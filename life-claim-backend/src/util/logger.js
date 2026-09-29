// src/util/logger.js
//
// Centralized application logger (roadmap 3.4). Replaces scattered console.* calls
// with one configurable logger:
//   - LEVELS incl. `fatal` — env-configurable via LOG_LEVEL (fatal>error>warn>info>http>debug>trace).
//   - ROTATION by size/time — daily files with size cap + retention, so
//     application.log can no longer grow unbounded.
//   - CORRELATION IDs — every line is stamped with the current request id
//     (from requestContext / AsyncLocalStorage) with zero call-site changes.
//   - OPTIONAL CENTRALIZED SHIPPING — set LOG_HTTP_HOST (+ LOG_HTTP_PATH/PORT) to
//     forward logs to an ELK/Loki/HTTP collector.
//   - CONSOLE-COMPATIBLE — logger.log/info/warn/error/debug accept the same
//     variadic args as console.* (formatted with util.format), so replacing
//     `console.x(` with `logger.x(` is a mechanical, behaviour-preserving swap.
//
// Config is read straight from process.env (NOT the DB config service) on purpose:
// the logger must work before the DB/config cache is warm and must never create a
// require cycle. Runtime level changes from the IT Admin console (3.5) call
// logger.setLevel().

const util = require('util');
const path = require('path');
const fs = require('fs');
const winston = require('winston');
require('winston-daily-rotate-file');
const requestContext = require('./requestContext');

// fatal is the most severe; trace the least. `http` sits between info and debug
// for request-access lines.
const LEVELS = { fatal: 0, error: 1, warn: 2, info: 3, http: 4, debug: 5, trace: 6 };
const COLORS = { fatal: 'red bold', error: 'red', warn: 'yellow', info: 'green', http: 'cyan', debug: 'blue', trace: 'grey' };
winston.addColors(COLORS);

const env = (key, dflt) => {
  const v = process.env[key];
  return v === undefined || v === '' ? dflt : v;
};
const bool = (key, dflt) => {
  const v = process.env[key];
  if (v === undefined) return dflt;
  return !/^(false|0|no|off)$/i.test(String(v).trim());
};

const isProduction = env('NODE_ENV') === 'production';
const LOG_DIR = path.resolve(env('LOG_DIR', path.join(__dirname, '..', '..', 'logs')));
const validLevel = (lvl) => (Object.prototype.hasOwnProperty.call(LEVELS, lvl) ? lvl : null);
const initialLevel = validLevel(String(env('LOG_LEVEL', isProduction ? 'info' : 'debug')).toLowerCase())
  || (isProduction ? 'info' : 'debug');

// Attach the current correlation id (and a couple of request attrs) to every entry.
const correlation = winston.format((info) => {
  const ctx = requestContext.getStore();
  if (ctx) {
    if (ctx.requestId && !info.requestId) info.requestId = ctx.requestId;
    if (ctx.userId && !info.userId) info.userId = ctx.userId;
  }
  return info;
});

const baseFormat = winston.format.combine(
  correlation(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
  winston.format.errors({ stack: true })
);

// Human-readable console line; JSON for machine collectors.
const consoleFormat = winston.format.combine(
  baseFormat,
  isProduction
    ? winston.format.json()
    : winston.format.combine(
        winston.format.colorize({ level: true }),
        winston.format.printf((info) => {
          const rid = info.requestId ? ` [${info.requestId}]` : '';
          const stack = info.stack ? `\n${info.stack}` : '';
          return `${info.timestamp} ${info.level}${rid}: ${info.message}${stack}`;
        })
      )
);

const transports = [new winston.transports.Console({ handleExceptions: true })];

// Rotating file transports (size + time). Disable with LOG_TO_FILE=false.
if (bool('LOG_TO_FILE', true)) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
    const rotateOpts = {
      dirname: LOG_DIR,
      datePattern: env('LOG_DATE_PATTERN', 'YYYY-MM-DD'),
      maxSize: env('LOG_MAX_SIZE', '20m'),
      maxFiles: env('LOG_MAX_FILES', '14d'),
      zippedArchive: bool('LOG_ZIP', true),
      format: winston.format.combine(baseFormat, winston.format.json()),
    };
    // Combined log (all levels at/above LOG_LEVEL).
    transports.push(new winston.transports.DailyRotateFile({
      ...rotateOpts,
      filename: env('LOG_FILE', 'application') + '-%DATE%.log',
    }));
    // Dedicated error+fatal log for fast triage.
    transports.push(new winston.transports.DailyRotateFile({
      ...rotateOpts,
      level: 'error',
      filename: env('LOG_ERROR_FILE', 'error') + '-%DATE%.log',
    }));
  } catch (e) {
    // Never let logging setup crash the app; fall back to console only.
    // eslint-disable-next-line no-console
    console.error('[logger] file transport disabled:', e?.message);
  }
}

// Optional centralized shipping (ELK/Loki/HTTP collector).
if (env('LOG_HTTP_HOST')) {
  transports.push(new winston.transports.Http({
    host: env('LOG_HTTP_HOST'),
    port: Number(env('LOG_HTTP_PORT', '80')),
    path: env('LOG_HTTP_PATH', '/'),
    ssl: bool('LOG_HTTP_SSL', false),
    format: winston.format.combine(baseFormat, winston.format.json()),
  }));
}

const winstonLogger = winston.createLogger({
  levels: LEVELS,
  level: initialLevel,
  format: consoleFormat,
  transports,
  exitOnError: false,
});

// ---- console-compatible facade --------------------------------------------
// util.format(...args) reproduces console formatting exactly, so swapping
// `console.x(a, b, c)` for `logger.x(a, b, c)` preserves output verbatim while
// gaining levels, rotation and correlation ids.
function emit(level, args) {
  if (args.length === 1 && args[0] instanceof Error) {
    const err = args[0];
    winstonLogger.log(level, err.message, { stack: err.stack });
    return;
  }
  winstonLogger.log(level, util.format(...args));
}

const logger = {
  fatal: (...args) => emit('fatal', args),
  error: (...args) => emit('error', args),
  warn: (...args) => emit('warn', args),
  info: (...args) => emit('info', args),
  http: (...args) => emit('http', args),
  debug: (...args) => emit('debug', args),
  trace: (...args) => emit('trace', args),
  log: (...args) => emit('info', args), // console.log -> info

  /** Structured log: logger.event('warn', 'msg', { meta }). */
  event: (level, message, meta = {}) => winstonLogger.log(level, message, meta),

  /** Change level at runtime (IT Admin console, 3.5). Returns the applied level. */
  setLevel: (level) => {
    const l = validLevel(String(level || '').toLowerCase());
    if (!l) return null;
    winstonLogger.level = l;
    for (const t of winstonLogger.transports) {
      // keep the error file pinned to 'error'; move the rest with the global level.
      if (!(t instanceof winston.transports.DailyRotateFile && t.level === 'error')) {
        // don't override transports that set their own explicit level
      }
    }
    return l;
  },
  getLevel: () => winstonLogger.level,
  levels: LEVELS,
  raw: winstonLogger,
};

module.exports = logger;
