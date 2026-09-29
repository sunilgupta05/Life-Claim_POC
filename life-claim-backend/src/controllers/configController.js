// src/controllers/configController.js
//
// Admin API over the centralized config service (roadmap 0.3). Lets a superuser
// view and edit runtime business settings; saves hot-reload immediately.
// (A dedicated IT Admin UI is roadmap 3.5 — this is the backend it will use.)

const logger = require('../util/logger');
const configService = require('../config/configService');

const VALID_TYPES = ['string', 'number', 'boolean', 'json'];

/** GET /api/config — list DB-backed settings (secret values masked). */
const listConfig = async (req, res) => {
  try {
    res.json({ status: configService.status(), items: configService.listForAdmin() });
  } catch (err) {
    logger.error('[config] list error:', err?.message);
    res.status(500).json({ message: 'Failed to load configuration' });
  }
};

/**
 * PUT /api/config/:key — upsert a business setting.
 * body: { value, type?, category?, description?, isSecret? }
 * Applies immediately (hot-reload), no restart required.
 */
const upsertConfig = async (req, res) => {
  const key = String(req.params.key || '').trim();
  if (!key) return res.status(400).json({ message: 'Config key is required' });

  const { value, type = 'string', category = null, description = null, isSecret = false } = req.body || {};
  if (value === undefined || value === null) {
    return res.status(400).json({ message: 'A value is required' });
  }
  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ message: `type must be one of: ${VALID_TYPES.join(', ')}` });
  }

  try {
    await configService.set(key, value, {
      type,
      category,
      description,
      isSecret: !!isSecret,
      actor: req.user?.username || null,
    });
    res.json({ message: 'Saved', key, applied: true });
  } catch (err) {
    logger.error('[config] upsert error:', err?.message);
    const missing = err?.code === 'APP_CONFIG_TABLE_MISSING';
    res.status(missing ? 409 : 500).json({
      message: missing
        ? 'app_config table not found — run database migrations first (npm run migrate).'
        : 'Failed to save configuration',
    });
  }
};

/** DELETE /api/config/:key — remove a setting (reverts to .env/default). */
const deleteConfig = async (req, res) => {
  const key = String(req.params.key || '').trim();
  if (!key) return res.status(400).json({ message: 'Config key is required' });
  try {
    await configService.remove(key);
    res.json({ message: 'Deleted', key });
  } catch (err) {
    logger.error('[config] delete error:', err?.message);
    res.status(500).json({ message: 'Failed to delete configuration' });
  }
};

module.exports = { listConfig, upsertConfig, deleteConfig };
