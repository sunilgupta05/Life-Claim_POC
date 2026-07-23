const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const UploadedDocument = require('../controllers/uploadedDocumentController');
const { authorizeClaimBodyAccess } = require('../middleware/claimAccessMiddleware');

const router = express.Router();

/** To Get the all the deatils based on claimnumber & documentTypes exist in the 'UploadedDocuments' table */
router.post(
  '/uploadedDocuments',
  authMiddleware.authenticate,
  authorizeClaimBodyAccess,
  UploadedDocument.UploadedDocumentDetails
);
/** To Get the count based on the claimNumber and documentType from the 'uploadedDocuments' table */
router.post(
  '/getDocumentCount',
  authMiddleware.authenticate,
  authorizeClaimBodyAccess,
  UploadedDocument.UploadedDocumentCountDetails
);
/** To add row into the 'uploadedDocuments' table after document is uploaded on the alfresco (DMS)*/
router.post(
  '/addUploadedDocument',
  authMiddleware.authenticate,
  authorizeClaimBodyAccess,
  UploadedDocument.AddDocumentDetails
);
//router.post('/addrole', authMiddleware.authenticate, roleController.createRole);

module.exports = router;