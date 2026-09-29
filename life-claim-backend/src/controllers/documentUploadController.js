const logger = require('../util/logger');
const fs = require('fs');
const appConfig = require('../config/configService');
const path = require('path');
const formData = require('form-data');
const axios = require('axios');
const dotenv = require('dotenv');
const uploadedDocumentsService = require('../services/uploadedDocumentsService');
const { run } = require('../util/resilience');
// Resilient DMS calls (roadmap 3.1): every Alfresco call gets a timeout so a hung
// DMS can't wedge a request; axios uses `timeout`, native fetch uses AbortSignal.
const alfrescoTimeout = () => appConfig.getNumber('ALFRESCO_TIMEOUT_MS', 15000);
const DOCUMENT_STORAGE = appConfig.get('ENVIRONMENT1') === 'PRODUCTION' ? appConfig.get('PROD_DOCUMENT_STORAGE_LOCATION') : appConfig.get('DEV_DOCUMENT_STORAGE_LOCATION');
const isProduction = appConfig.get('NODE_ENV') === 'production';
const exposeErrorDetails = appConfig.get('EXPOSE_ERROR_DETAIL') === 'true';
const INLINE_PREVIEW_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'text/plain',
  'text/csv',
];
const OLE_SIGNATURE = 'd0cf11e0a1b11ae1';
const ZIP_SIGNATURES = ['504b0304', '504b0506', '504b0708'];

const safeErrorResponse = (message, errorLike) => ({
  message,
  ...(exposeErrorDetails
    ? {
      detail:
        typeof errorLike === 'string'
          ? errorLike
          : (errorLike?.message || String(errorLike || 'Unknown error')),
    }
    : {}),
});

const fileBufferToHex = (buffer) => buffer.toString('hex');

const hasAllowedBinarySignature = (hexPrefix, ext) => {
  switch (ext) {
    case '.pdf':
      return hexPrefix.startsWith('25504446');
    case '.jpg':
    case '.jpeg':
      return hexPrefix.startsWith('ffd8ff');
    case '.png':
      return hexPrefix.startsWith('89504e470d0a1a0a');
    case '.doc':
    case '.xls':
      return hexPrefix.startsWith(OLE_SIGNATURE);
    case '.docx':
    case '.xlsx':
      return ZIP_SIGNATURES.some((sig) => hexPrefix.startsWith(sig));
    default:
      return false;
  }
};

const isLikelyTextFile = (buffer) => {
  for (const byte of buffer) {
    if (byte === 0) {
      return false;
    }
  }
  return true;
};

const isFileContentAllowed = async (filePath, originalName) => {
  const ext = String(path.extname(originalName || '')).toLowerCase();
  if (!ext) {
    return false;
  }

  const fileHandle = await fs.promises.open(filePath, 'r');
  try {
    const header = Buffer.alloc(16);
    const { bytesRead } = await fileHandle.read(header, 0, 16, 0);
    const slice = header.subarray(0, bytesRead);
    const hexPrefix = fileBufferToHex(slice);

    if (ext === '.csv') {
      return isLikelyTextFile(slice);
    }
    return hasAllowedBinarySignature(hexPrefix, ext);
  } finally {
    await fileHandle.close();
  }
};

//logger.info(`documentUploadController.js > previewDocument > nodeId 1:`);
/**preview link to see the uploaded documents (Route to preview a document from Alfresco) */
exports.previewDocument = async (req, res) => {
  const nodeId = req.params.nodeId;
  logger.info('documentUploadController.js > previewDocument request received');
  try {
    const APITicket = await getAuthTicketForDMS();
    if (String(APITicket).includes('ERROR')) {
      return res.status(500).json(safeErrorResponse('Failed to preview document', APITicket));
    }
    const alfrescoURL = `http://${appConfig.get('DOCUMENT_VIEWER_IP')}/alfresco/api/-default-/public/alfresco/versions/1/nodes/${nodeId}/content`;
    const response = await run('alfresco', () => axios.get(alfrescoURL, {
      headers: {
        Authorization: `Basic ${APITicket}`,
      },
      responseType: 'stream',
      timeout: alfrescoTimeout(),
    }));

    const upstreamContentType = String(response.headers['content-type'] || '').toLowerCase();
    const contentType = upstreamContentType.split(';')[0] || 'application/octet-stream';
    const canInlinePreview = INLINE_PREVIEW_MIME_TYPES.some((type) => contentType.startsWith(type));

    // Content spoofing hardening: disable sniffing and render inline only for trusted MIME types.
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', canInlinePreview ? 'inline' : 'attachment');
    response.data.pipe(res);
  } catch (err) {
    logger.error('Error previewing file:', err.message);
    res.status(500).json(safeErrorResponse('Failed to preview document', err));
  }
};


/** to update table after the document uploaded on alfresco */
exports.UpdateUploadedDocumentTable = async (claimNumber, fileName, documentType, folderId, nodeId) => {
  logger.info('documentUploadController.js >> UpdateUploadedDocumentTable invoked');
  const UploadedDocumentResponse = await uploadedDocumentsService.AddUploadedDocumentService(claimNumber, fileName, documentType, folderId, nodeId);
  //const uploadedDocument =  UploadedDocumentResponse;
  logger.info('documentUploadController.js >> UpdateUploadedDocumentTable completed');
  return UploadedDocumentResponse;
}

/** Checking duplicate function. */
const checkDuplicate = async (folderID, fileName, APITicket) => {
  try {
    const getFilesInFolderRes = await fetch(`http://${appConfig.get('DOCUMENT_VIEWER_IP')}/alfresco/api/-default-/public/alfresco/versions/1/nodes/${folderID}/children`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${APITicket}`
      },
      signal: AbortSignal.timeout(alfrescoTimeout())
    });

    if (!getFilesInFolderRes.ok) {
      logger.error('Failed to fetch files from folder', await getFilesInFolderRes.text());
      return false;
    }

    const folderFiles = await getFilesInFolderRes.json();
    const existingFiles = folderFiles?.list?.entries || [];

    const isDuplicate = existingFiles.some(entry => entry.entry.name === fileName);
    return isDuplicate;
  } catch (err) {
    logger.error('Error in checkDuplicate:', err);
    return false;
  }
};

// life-claim folder id (DarkHorse): 318f10d4-66f4-49f5-a966-bb4e634105e6
exports.uploadDocument = async (req, res, next) => {
  try {
    const uploadedFiles = req.files; // This is now an array
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return res.status(400).json({ message: "No files uploaded" });
    }

    // Security: Use the sanitized filename generated by Multer for filesystem operations
    const fileName = uploadedFiles[0].filename;
    const originalName = uploadedFiles[0].originalname;
    const claimNumber = req.body.claimNo;
    const documentType = req.body.documentType;
    const documentId = req.body.documentId;
    const filePath = req.files[0].path;

    const allowedContent = await isFileContentAllowed(filePath, originalName);
    if (!allowedContent) {
      await fs.promises.unlink(filePath).catch(() => { });
      return res.status(400).json(safeErrorResponse("Security validation failed for uploaded file"));
    }

    logger.info('documentUploadController.js > uploadDocument request received');
    const APITicket = await getAuthTicketForDMS();

    if (APITicket.includes('ERROR')) {
      return res.status(500).json(safeErrorResponse("Something went wrong", APITicket));
    }
    const getFolderByClaimNumberResponse = await fetch(`http://${appConfig.get('DOCUMENT_VIEWER_IP')}/alfresco/api/-default-/public/alfresco/versions/1/nodes/${DOCUMENT_STORAGE}/children`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Basic ${APITicket}`
      },
      signal: AbortSignal.timeout(alfrescoTimeout())
    });

    //logger.info('5 documentUploadController.js > uploadDocument :: getFolderByClaimNumberResponse', getFolderByClaimNumberResponse);
    /** Error Handling for getFolderByClaimNumber */
    if (!getFolderByClaimNumberResponse.ok) {
      logger.info('err documentUploadController.js > uploadDocument :: getFolderByClaimNumberResponse');
      const errMsg = await getFolderByClaimNumberResponse.text();
      return res.status(500).json(safeErrorResponse("Something went wrong", errMsg));
    }
    logger.info('documentUploadController.js > uploadDocument folder lookup succeeded');

    const folderEntry = await getFolderByClaimNumberResponse.json();
    const entries = folderEntry?.list?.entries || [];

    let createdDocument;
    let folderID;
    /** Resolve Alfresco folder for this claim number */
    for (const item of entries) {
      const entry = item?.entry;
      if (entry?.isFolder && entry.name === claimNumber) {
        folderID = entry.id;
        break;
      }
    }
    // logger.info('7 documentUploadController.js > uploadDocument :: getFolderByClaimNumberResponse');
    // if folder does not exist for creating new folder based on ClaimNumber
    if (!folderID) {
      /** Createing New Folder*/
      const createFolderResponse = await fetch(`http://${appConfig.get('DOCUMENT_VIEWER_IP')}/alfresco/api/-default-/public/alfresco/versions/1/nodes/${DOCUMENT_STORAGE}/children`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${APITicket}`
        },
        body: JSON.stringify({
          "name": claimNumber,
          "nodeType": "cm:folder"
        }),
        signal: AbortSignal.timeout(alfrescoTimeout())
      });
      // logger.info('8 documentUploadController.js > uploadDocument :: getFolderByClaimNumberResponse');
      /** Error Handing for createFolder */
      if (!createFolderResponse.ok) {
        const errMsg = await createFolderResponse.json();
        return res.status(500).json(safeErrorResponse("Something went wrong", errMsg));
      }
      createdDocument = await createFolderResponse.json();
      folderID = createdDocument?.entry?.id;
    }
    // logger.info('9 documentUploadController.js > uploadDocument :: folderID ', folderID);
    if (folderID) {
      logger.info('documentUploadController.js > uploadDocument folder resolved');

      /** Duplicate check uses original filename (user-visible name in Alfresco) */
      const isDuplicate = await checkDuplicate(folderID, originalName, APITicket);
      if (isDuplicate) {
        await fs.promises.unlink(filePath).catch(() => { });
        return res.status(409).json({
          message: "A file with this name already exists for this claim",
          ...(exposeErrorDetails ? { detail: "Duplicate file detected" } : {})
        });
      }

      /** Uploading File */
      //const filePath = path.join(__dirname, '../../files', fileName);
      fs.readFile(filePath, async function (err, file) {
        if (err) {
          return res.status(500).json(safeErrorResponse("Something went wrong", err));
        }
        const currentDate = new Date();
        const form = new formData();
        form.append('filedata', fs.createReadStream(filePath), originalName);
        await run('alfresco', () => axios.post(`http://${appConfig.get('DOCUMENT_VIEWER_IP')}/alfresco/api/-default-/public/alfresco/versions/1/nodes/${folderID}/children`,
          form,
          {
            headers: {
              ...form.getHeaders(),
              Authorization: `Basic ${APITicket}`,
            },
            params: { overwrite: false },
            timeout: alfrescoTimeout(),
          }), { retries: 0 })
          .then(async (response) => {
            try {
              //logger.info("Uploaded file response:", JSON.stringify(response.data, null, 2));
              const entry = response.data.entry;
              const nodeId = entry.id;
              //const nodeRef = `workspace://SpacesStore/${nodeId}`;
              // logger.info("Stored NodeRef:", nodeRef);
              logger.info('documentUploadController.js > uploadDocument DMS upload succeeded');
              // Using originalName for the database entry so the user sees the original name in the UI
              await exports.UpdateUploadedDocumentTable(claimNumber, originalName, documentType, folderID, nodeId);
              return res.status(201).json({ message: "File Uploaded Successfully" });
            } catch (err) {
              logger.error('Failed to update DB after file upload:', err);
              return res.status(500).json(safeErrorResponse("File uploaded but DB update failed", err));
            }
          })
          // .then(data => {
          //     UpdateUploadedDocumentTable(fileName, claimNumber, documentType, folderID);
          //     return res.status(201).json({
          //         message: "File Uploaded Successfully"
          //     });
          // })
          .catch(err => {
            return res.status(500).json({
              message: "Something went Wrong while uploading file..",
            });
          });
        logger.info('documentUploadController.js > uploadDocument processing completed');
      });

    } else {
      /** If folder not found / created */
      return res.status(404).json({
        message: "Something went Wrong",
        ...(exposeErrorDetails ? { detail: "Folder not found for Claim No " + claimNumber } : {})
      });
    }

  } catch (error) {
    return res.status(500).json(safeErrorResponse("Something went wrong", error));
  }
}



const getAuthTicketForDMS = async () => {
  logger.info('documentUploadController.js > DMS ticket request started');
  const dmsUserId =
    process.env.DMS_USER_ID ||
    (!isProduction ? 'admin' : '');
  const dmsPassword =
    process.env.DMS_PASSWORD ||
    (!isProduction ? 'admin' : '');

  if (!dmsUserId || !dmsPassword) {
    return 'ERROR: DMS credentials are not configured. Set DMS_USER_ID and DMS_PASSWORD.';
  }

  const getTicketResponse = await fetch(`http://${appConfig.get('DOCUMENT_VIEWER_IP')}/alfresco/api/-default-/public/authentication/versions/1/tickets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      "userId": dmsUserId,
      "password": dmsPassword
    }),
    signal: AbortSignal.timeout(alfrescoTimeout())
  });

  /** Error Handling for getTicketResponse */
  if (!getTicketResponse.ok) {
    const errMsg = await getTicketResponse.text();
    return "ERROR: " + errMsg;
  }
  const APITicketJSON = await getTicketResponse.json();
  const APITicket = Buffer.from(APITicketJSON.entry.id).toString('base64');

  return APITicket;
}
