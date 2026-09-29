// src/controllers/formConfigController.js
//
// Admin API over per-form field overrides (roadmap 2.3). GET is readable by any
// authenticated user (the wizard applies overrides); writes are superuser-only.

const logger = require('../util/logger');
const formConfigService = require('../services/formConfigService');

const str = (v) => (v === undefined || v === null ? '' : String(v).trim());

/** GET /api/form-config/:formKey — overrides for one form (for the renderer). */
const getForm = async (req, res) => {
  res.json({ formKey: req.params.formKey, fields: formConfigService.getFormConfig(str(req.params.formKey)) });
};

/** GET /api/form-config — all forms' overrides (admin console). */
const getAll = async (req, res) => {
  res.json({ forms: formConfigService.getAllForms(), status: formConfigService.status() });
};

/** PUT /api/form-config/:formKey — bulk-save a form's field overrides. */
const putForm = async (req, res) => {
  const formKey = str(req.params.formKey);
  const fields = req.body?.fields;
  if (!formKey) return res.status(400).json({ message: 'formKey is required' });
  if (!Array.isArray(fields)) return res.status(400).json({ message: 'fields (array) is required' });
  // Validate each entry.
  for (const f of fields) {
    if (!f || !str(f.name)) return res.status(400).json({ message: 'each field needs a name' });
    if (f.required !== undefined && f.required !== null && typeof f.required !== 'boolean') {
      return res.status(400).json({ message: `field "${f.name}".required must be boolean or null` });
    }
  }
  try {
    await formConfigService.setForm(formKey, fields.map((f) => ({
      name: str(f.name),
      visible: f.visible !== false,
      required: f.required === undefined ? null : f.required,
      sortOrder: f.sortOrder,
    })));
    res.json({ message: 'Saved', formKey, fields: formConfigService.getFormConfig(formKey) });
  } catch (err) {
    sendError(res, err, 'Failed to save form configuration');
  }
};

/** PATCH /api/form-config/:formKey/fields/:name — toggle one field. */
const patchField = async (req, res) => {
  const formKey = str(req.params.formKey);
  const name = str(req.params.name);
  const { visible, required } = req.body || {};
  if (required !== undefined && required !== null && typeof required !== 'boolean') {
    return res.status(400).json({ message: 'required must be boolean or null' });
  }
  try {
    await formConfigService.setField(formKey, name, {
      visible: visible !== false,
      required: required === undefined ? null : required,
    });
    res.json({ message: 'Saved', formKey, name });
  } catch (err) {
    sendError(res, err, 'Failed to update field');
  }
};

/** DELETE /api/form-config/:formKey — revert a form to its base schema. */
const resetForm = async (req, res) => {
  const formKey = str(req.params.formKey);
  try {
    const removed = await formConfigService.resetForm(formKey);
    res.json({ message: 'Reset', formKey, removed });
  } catch (err) {
    sendError(res, err, 'Failed to reset form');
  }
};

function sendError(res, err, fallback) {
  if (err?.code === 'FORM_CONFIG_TABLE_MISSING') {
    return res.status(409).json({ message: 'form_field_config table not found — run database migrations first (npm run migrate).' });
  }
  logger.error('[formConfig] error:', err?.message);
  return res.status(500).json({ message: fallback });
}

module.exports = { getForm, getAll, putForm, patchField, resetForm };
