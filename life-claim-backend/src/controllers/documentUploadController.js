const fs = require('fs');
const path = require('path');
const formData = require('form-data');
const axios = require('axios');
const dotenv = require('dotenv');
const uploadedDocumentsService = require('../services/uploadedDocumentsService');
const DOCUMENT_STORAGE = process.env.ENVIRONMENT1 === 'PRODUCTION' ? process.env.PROD_DOCUMENT_STORAGE_LOCATION : process.env.DEV_DOCUMENT_STORAGE_LOCATION;
const isProduction = process.env.NODE_ENV === 'production';
const exposeErrorDetails = !isProduction;
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

//console.log(`documentUploadController.js > previewDocument > nodeId 1:`);
/**preview link to see the uploaded documents (Route to preview a document from Alfresco) */
exports.previewDocument = async (req, res) => {
    const nodeId = req.params.nodeId;
    console.log('documentUploadController.js > previewDocument request received');
    try {
      const APITicket = await getAuthTicketForDMS();
      if (String(APITicket).includes('ERROR')) {
        return res.status(500).json(safeErrorResponse('Failed to preview document', APITicket));
      }
      const alfrescoURL = `http://${process.env.DOCUMENT_VIEWER_IP}/alfresco/api/-default-/public/alfresco/versions/1/nodes/${nodeId}/content`;
      const response = await axios.get(alfrescoURL, {
        headers: {
          Authorization: `Basic ${APITicket}`,
        },
        responseType: 'stream',
      });

      const upstreamContentType = String(response.headers['content-type'] || '').toLowerCase();
      const contentType = upstreamContentType.split(';')[0] || 'application/octet-stream';
      const canInlinePreview = INLINE_PREVIEW_MIME_TYPES.some((type) => contentType.startsWith(type));

      // Content spoofing hardening: disable sniffing and render inline only for trusted MIME types.
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', canInlinePreview ? 'inline' : 'attachment');
      response.data.pipe(res);
    } catch (err) {
      console.error('Error previewing file:', err.message);
      res.status(500).json(safeErrorResponse('Failed to preview document', err));
    }
};
  

/** to update table after the document uploaded on alfresco */
exports.UpdateUploadedDocumentTable = async (claimNumber, fileName, documentType, folderId, nodeId) => {
    console.log('documentUploadController.js >> UpdateUploadedDocumentTable invoked');
    const UploadedDocumentResponse = await uploadedDocumentsService.AddUploadedDocumentService(claimNumber, fileName, documentType, folderId, nodeId);
    //const uploadedDocument =  UploadedDocumentResponse;
    console.log('documentUploadController.js >> UpdateUploadedDocumentTable completed');
    return UploadedDocumentResponse;
}

/** Checking duplicate function. */
const checkDuplicate = async (folderID, fileName, APITicket) => {
    try {
        const getFilesInFolderRes = await fetch(`http://${process.env.DOCUMENT_VIEWER_IP}/alfresco/api/-default-/public/alfresco/versions/1/nodes/${folderID}/children`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${APITicket}`
            }
        });

        if (!getFilesInFolderRes.ok) {
            console.error('Failed to fetch files from folder', await getFilesInFolderRes.text());
            return false;
        }

        const folderFiles = await getFilesInFolderRes.json();
        const existingFiles = folderFiles?.list?.entries || [];

        const isDuplicate = existingFiles.some(entry => entry.entry.name === fileName);
        return isDuplicate;
    } catch (err) {
        console.error('Error in checkDuplicate:', err);
        return false;
    }
};

//life_claim fooder id  : - 318f10d4-66f4-49f5-a966-bb4e634105e
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
            await fs.promises.unlink(filePath).catch(() => {});
            return res.status(400).json(safeErrorResponse("Security validation failed for uploaded file"));
        }

        console.log('documentUploadController.js > uploadDocument request received');
        const APITicket = await getAuthTicketForDMS();

        if (APITicket.includes('ERROR')) {
            return res.status(500).json(safeErrorResponse("Something went wrong", APITicket));
        }
        const getFolderByClaimNumberResponse = await fetch(`http://${process.env.DOCUMENT_VIEWER_IP}/alfresco/api/-default-/public/alfresco/versions/1/nodes/${DOCUMENT_STORAGE}/children`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Basic ${APITicket}`
            }
        });

        //console.log('5 documentUploadController.js > uploadDocument :: getFolderByClaimNumberResponse', getFolderByClaimNumberResponse);
        /** Error Handling for getFolderByClaimNumber */
        if (!getFolderByClaimNumberResponse.ok) {
            console.log('err documentUploadController.js > uploadDocument :: getFolderByClaimNumberResponse');
            const errMsg = await getFolderByClaimNumberResponse.text();
            return res.status(500).json(safeErrorResponse("Something went wrong", errMsg));
        }
            console.log('documentUploadController.js > uploadDocument folder lookup succeeded');

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
        // console.log('7 documentUploadController.js > uploadDocument :: getFolderByClaimNumberResponse');
        // if folder does not exist for creating new folder based on ClaimNumber
        if (!folderID) {
            /** Createing New Folder*/
            const createFolderResponse = await fetch(`http://${process.env.DOCUMENT_VIEWER_IP}/alfresco/api/-default-/public/alfresco/versions/1/nodes/${DOCUMENT_STORAGE}/children`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Basic ${APITicket}`
                },
                body: JSON.stringify({
                    "name": claimNumber,
                    "nodeType": "cm:folder"
                })
            });
            // console.log('8 documentUploadController.js > uploadDocument :: getFolderByClaimNumberResponse');
            /** Error Handing for createFolder */
            if (!createFolderResponse.ok) {
                const errMsg = await createFolderResponse.json();
                return res.status(500).json(safeErrorResponse("Something went wrong", errMsg));
            }
            createdDocument = await createFolderResponse.json();
            folderID = createdDocument?.entry?.id;
        }
        // console.log('9 documentUploadController.js > uploadDocument :: folderID ', folderID);
        if (folderID) {
            console.log('documentUploadController.js > uploadDocument folder resolved');

            /** Duplicate check uses original filename (user-visible name in Alfresco) */
            const isDuplicate = await checkDuplicate(folderID, originalName, APITicket);
            if (isDuplicate) {
                await fs.promises.unlink(filePath).catch(() => {});
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
                await axios.post(`http://${process.env.DOCUMENT_VIEWER_IP}/alfresco/api/-default-/public/alfresco/versions/1/nodes/${folderID}/children`,
                    form,
                    {
                        headers: {
                            ...form.getHeaders(),
                            Authorization: `Basic ${APITicket}`,
                        },
                        params: { overwrite: false },
                    })
                    .then(async (response) => {
                        try {
                            //console.log("Uploaded file response:", JSON.stringify(response.data, null, 2));
                            const entry = response.data.entry;
                            const nodeId = entry.id;
                            //const nodeRef = `workspace://SpacesStore/${nodeId}`;
                           // console.log("Stored NodeRef:", nodeRef);
                            console.log('documentUploadController.js > uploadDocument DMS upload succeeded'); 
                            // Using originalName for the database entry so the user sees the original name in the UI
                            await exports.UpdateUploadedDocumentTable(claimNumber, originalName, documentType, folderID, nodeId);
                            return res.status(201).json({ message: "File Uploaded Successfully" });
                        } catch (err) {
                            console.error('Failed to update DB after file upload:', err);
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
                    console.log('documentUploadController.js > uploadDocument processing completed'); 
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
    console.log('documentUploadController.js > DMS ticket request started');
    const dmsUserId =
      process.env.DMS_USER_ID ||
      (!isProduction ? 'admin' : '');
    const dmsPassword =
      process.env.DMS_PASSWORD ||
      (!isProduction ? 'admin' : '');

    if (!dmsUserId || !dmsPassword) {
        return 'ERROR: DMS credentials are not configured. Set DMS_USER_ID and DMS_PASSWORD.';
    }

    const getTicketResponse = await fetch(`http://${process.env.DOCUMENT_VIEWER_IP}/alfresco/api/-default-/public/authentication/versions/1/tickets`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            "userId": dmsUserId,
            "password": dmsPassword
        })
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
