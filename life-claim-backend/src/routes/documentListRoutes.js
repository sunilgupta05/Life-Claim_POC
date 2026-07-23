const express = require('express');
const authService = require('../services/authService');
const authMiddleware = require('../middleware/authMiddleware');
const documentListController = require('../controllers/documentListController');

const router = express.Router();

router.post('/documentList', authMiddleware.authenticate, documentListController.getDocumentList);
router.get('/documentList', authMiddleware.authenticate, documentListController.getDocumentList);

//router.post('/addrole', authMiddleware.authenticate, roleController.createRole);

module.exports = router;