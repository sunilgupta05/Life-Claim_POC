// src/controllers/systemSettingsController.js
//
// IT Administrator settings API (roadmap 3.5). A curated, grouped view over the
// runtime config service (0.3) covering integration URLs, timeouts/resilience and
// logging. Reuses the same hot-reload write path as /api/config, but restricts
// edits to the vetted settings catalog and renders friendly metadata.
//
//   GET  /api/settings        — grouped settings with current resolved value + source
//   PUT  /api/settings/:key   — update one catalogued setting (hot-reload)
//   DELETE /api/settings/:key — revert one setting to its .env/default

const appConfig = require('../config/configService');
const logger = require('../util/logger');
const { SETTINGS, BY_KEY } = require('../config/settingsCatalog');

/** Where is this key's effective value coming from right now? */
function sourceOf(key) {
  const admin = appConfig.listForAdmin().find((i) => i.key === key);
  if (admin) return 'db';
  if (process.env[key] !== undefined && process.env[key] !== '') return 'env';
  return 'default';
}

/** Resolve the effective value for display (secrets masked; none here by design). */
function valueOf(def) {
  const resolved = appConfig.get(def.key, def.default);
  return resolved;
}

/** GET /api/settings — grouped catalog with current values. */
const getSettings = async (req, res) => {
  try {
    const groups = {};
    for (const def of SETTINGS) {
      const g = def.group || 'General';
      if (!groups[g]) groups[g] = [];
      groups[g].push({
        key: def.key,
        label: def.label,
        help: def.help,
        type: def.type,
        options: def.options,
        default: def.default,
        value: valueOf(def),
        source: sourceOf(def.key),
      });
    }
    res.json({
      groups: Object.entries(groups).map(([name, items]) => ({ name, items })),
      logLevel: logger.getLevel(),
    });
  } catch (err) {
    logger.error('[settings] get error:', err?.message);
    res.status(500).json({ message: 'Failed to load settings', code: 'INTERNAL_ERROR' });
  }
};

const validate = (def, value) => {
  if (def.type === 'number' && !Number.isFinite(Number(value))) return 'must be a number';
  if (def.type === 'boolean' && !/^(true|false)$/i.test(String(value))) return 'must be true or false';
  if (def.type === 'enum' && def.options && !def.options.includes(String(value))) {
    return `must be one of: ${def.options.join(', ')}`;
  }
  return null;
};

/** PUT /api/settings/:key — update one catalogued setting. */
const updateSetting = async (req, res) => {
  const key = String(req.params.key || '').trim();
  const def = BY_KEY[key];
  if (!def) return res.status(404).json({ message: 'Unknown setting', code: 'NOT_FOUND' });

  const { value } = req.body || {};
  if (value === undefined || value === null) {
    return res.status(400).json({ message: 'A value is required', code: 'BAD_REQUEST' });
  }
  const err = validate(def, value);
  if (err) return res.status(422).json({ message: `${def.label} ${err}`, code: 'VALIDATION_ERROR' });

  const type = def.type === 'enum' ? 'string' : def.type;
  try {
    await appConfig.set(key, String(value), {
      type,
      category: def.group,
      description: def.label,
      actor: req.user?.username || null,
    });
    // Logging level applies to the live logger immediately.
    if (key === 'LOG_LEVEL') logger.setLevel(String(value));
    logger.info(`[settings] ${key} updated by ${req.user?.username || 'unknown'}`);
    res.json({ message: 'Saved', key, value: String(value), applied: true });
  } catch (e) {
    logger.error('[settings] update error:', e?.message);
    const missing = e?.code === 'APP_CONFIG_TABLE_MISSING';
    res.status(missing ? 409 : 500).json({
      message: missing
        ? 'app_config table not found — run database migrations first (npm run migrate).'
        : 'Failed to save setting',
      code: missing ? 'CONFLICT' : 'INTERNAL_ERROR',
    });
  }
};

/** DELETE /api/settings/:key — revert to .env/default. */
const resetSetting = async (req, res) => {
  const key = String(req.params.key || '').trim();
  const def = BY_KEY[key];
  if (!def) return res.status(404).json({ message: 'Unknown setting', code: 'NOT_FOUND' });
  try {
    await appConfig.remove(key);
    if (key === 'LOG_LEVEL') logger.setLevel(appConfig.get('LOG_LEVEL', def.default));
    res.json({ message: 'Reverted', key });
  } catch (e) {
    logger.error('[settings] reset error:', e?.message);
    res.status(500).json({ message: 'Failed to revert setting', code: 'INTERNAL_ERROR' });
  }
};

module.exports = { getSettings, updateSetting, resetSetting };
