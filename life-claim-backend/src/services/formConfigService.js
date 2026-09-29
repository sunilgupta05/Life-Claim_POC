// src/services/formConfigService.js
//
// Per-form field override service (roadmap 2.3). Caches the form_field_config
// rows (show/hide + required overrides per form) with a TTL refresh + hot-reload
// on write, mirroring rbacService. Best-effort: unmigrated ⇒ empty ⇒ the
// frontend uses its base schemas unchanged (non-breaking).

const logger = require('../util/logger');
const dao = require('../dataAccess/formConfigDao');

const DEFAULT_TTL_MS = 60 * 1000;

let snapshot = []; // array of { FORM_KEY, FIELD_NAME, IS_VISIBLE, IS_REQUIRED, SORT_ORDER }
let ready = false;
let refreshTimer = null;
let warnedMissing = false;

function ttlMs() {
  const raw = Number(process.env.FORM_CONFIG_CACHE_TTL_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_TTL_MS;
}

async function reload() {
  try {
    snapshot = await dao.getAll();
    ready = true;
    return true;
  } catch (err) {
    ready = true;
    if (err && err.code === dao.TABLE_MISSING) {
      if (!warnedMissing) {
        logger.warn('[formConfig] form_field_config not migrated yet — forms use base schemas (run npm run migrate).');
        warnedMissing = true;
      }
    } else {
      logger.warn('[formConfig] reload failed, keeping cached values:', err?.message);
    }
    return false;
  }
}

async function init() {
  await reload();
  if (!refreshTimer) {
    refreshTimer = setInterval(() => { reload().catch(() => {}); }, ttlMs());
    if (typeof refreshTimer.unref === 'function') refreshTimer.unref();
  }
  return snapshot.length;
}

/** Overrides for one form as { fieldName: { visible, required } } (required: bool|null). */
function getFormConfig(formKey) {
  const out = {};
  for (const r of snapshot) {
    if (r.FORM_KEY !== formKey) continue;
    out[r.FIELD_NAME] = {
      visible: !!r.IS_VISIBLE,
      required: r.IS_REQUIRED === null || r.IS_REQUIRED === undefined ? null : !!r.IS_REQUIRED,
    };
  }
  return out;
}

/** All forms grouped: { formKey: { fieldName: { visible, required } } } (admin UI). */
function getAllForms() {
  const out = {};
  for (const r of snapshot) {
    (out[r.FORM_KEY] = out[r.FORM_KEY] || {})[r.FIELD_NAME] = {
      visible: !!r.IS_VISIBLE,
      required: r.IS_REQUIRED === null || r.IS_REQUIRED === undefined ? null : !!r.IS_REQUIRED,
    };
  }
  return out;
}

async function setField(formKey, fieldName, { visible = true, required = null, sortOrder = 0 } = {}) {
  await dao.upsertField({ formKey, fieldName, isVisible: visible, isRequired: required, sortOrder });
  await reload();
}

/** Bulk-save a form's field overrides. `fields` = [{ name, visible, required, sortOrder }]. */
async function setForm(formKey, fields = []) {
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    await dao.upsertField({
      formKey, fieldName: f.name,
      isVisible: f.visible !== false,
      isRequired: f.required === undefined ? null : f.required,
      sortOrder: Number.isFinite(f.sortOrder) ? f.sortOrder : i,
    });
  }
  await reload();
}

async function resetForm(formKey) {
  const n = await dao.deleteForm(formKey);
  await reload();
  return n;
}

function status() {
  return { ready, overrides: snapshot.length, ttlMs: ttlMs() };
}

/** Test seam. */
function __setSnapshotForTests(rows) {
  snapshot = Array.isArray(rows) ? rows : [];
  ready = true;
}

module.exports = {
  init, reload, getFormConfig, getAllForms, setField, setForm, resetForm, status, __setSnapshotForTests,
};
