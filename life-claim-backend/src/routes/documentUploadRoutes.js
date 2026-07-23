const express = require('express');
const fs = require('fs');
const path = require('path');
var multer = require('multer');

/** Temp upload staging — created on demand (gitignored contents, not the folder). */
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'files');
if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Security: Whitelist allowed file extensions (.zip removed — macro/archive risk)
const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx', '.xls', '.xlsx', '.csv'];
// Security: Limit file size to 10MB to prevent Denial of Service
const MAX_FILE_SIZE = 10 * 1024 * 1024; 
const MAX_UPLOAD_FILES = 1;

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error(`Security: File type ${ext} is not allowed.`), false);
    }
};

var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
        cb(null, UPLOAD_DIR);
    },
    filename: function(req, file, cb){
        // Security: Sanitize filename to prevent path traversal and shell injection
        const cleanName = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
        // Ensure filename is unique but recognizable
        cb(null, Date.now() + '-' + cleanName);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: MAX_FILE_SIZE }
});

const documentUploadController = require('../controllers/documentUploadController');
const authMiddleware = require('../middleware/authMiddleware');
const {
    authorizeClaimBodyAccess,
    authorizePreviewNodeAccess,
} = require('../middleware/claimAccessMiddleware');
const exposeErrorDetails = process.env.NODE_ENV !== 'production';

const router = express.Router();

//router.get('/folder/:applicationNo', authMiddleware.authenticate, documentViewerController.getDocumentsByApplicationNo);
// 
// Multer must run before authorizeClaimBodyAccess — multipart fields are not in req.body until parsed.
router.post('/uploadFile', authMiddleware.authenticate, (req, res, next) => {
    upload.array('files', MAX_UPLOAD_FILES)(req, res, function (err) {
        if (err instanceof multer.MulterError) {
            return res.status(400).json({
                message: "File Upload Error",
                ...(exposeErrorDetails ? { detail: err.message } : {}),
            });
        } else if (err) {
            const isSecurity = String(err.message || '').includes('Security:');
            return res.status(400).json({
                message: isSecurity ? "Security Validation Error" : "Upload failed",
                ...(exposeErrorDetails ? { detail: err.message } : {}),
            });
        }
        next();
    });
}, authorizeClaimBodyAccess, documentUploadController.uploadDocument);

router.get(
    '/preview/:nodeId',
    authMiddleware.authenticate,
    authorizePreviewNodeAccess,
    documentUploadController.previewDocument
);

module.exports = router;