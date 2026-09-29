// src/routes/formConfigRoutes.js
//
// Per-form field override API (roadmap 2.3), mounted at /api/form-config AFTER
// the global auth gate. Reads are available to any authenticated user (the form
// renderer applies overrides); writes require superuser (admin.config.manage).

const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const requirePermission = require('../middleware/requirePermission');
const ctrl = require('../controllers/formConfigController');

const router = express.Router();

router.use(authMiddleware.authenticate);

// Readable by any authenticated user (the wizard needs overrides to render).
router.get('/', ctrl.getAll);
router.get('/:formKey', ctrl.getForm);

// Writes are superuser-only.
const admin = requirePermission('admin.config.manage');
router.put('/:formKey', admin, ctrl.putForm);
router.patch('/:formKey/fields/:name', admin, ctrl.patchField);
router.delete('/:formKey', admin, ctrl.resetForm);

module.exports = router;
