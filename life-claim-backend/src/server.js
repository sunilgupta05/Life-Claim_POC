// backend/server.js

// Distributed tracing (roadmap 4.3) — must run BEFORE any other module is required
// so OpenTelemetry can patch http/express/mysql/amqp. No-op unless the OTEL SDK is
// installed and OTEL_EXPORTER_OTLP_ENDPOINT is set (see util/tracing.js).
const { startTracing } = require('./util/tracing');
const tracing = startTracing();

const logger = require('./util/logger');
const http = require('http');
const appConfig = require('./config/configService');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const app = require('./app');

if (tracing.enabled) logger.info(`[tracing] OpenTelemetry enabled → ${tracing.endpoint}`);

// Backend startup rules:
// - same code runs in local and deployment
// - machine/environment decides whether URL is localhost or deployed IP/domain
// - switch using .env values, not by commenting code
const PORT = appConfig.get('PORT') || 3012;
const HOST = appConfig.get('HOST') || '0.0.0.0'; // Bind to all interfaces
const USE_HTTPS = appConfig.get('USE_HTTPS') !== 'false'; // Default to HTTPS; set to 'false' to disable

// Display URL only; deployment host/domain should come from environment.
const SERVER_IP = appConfig.get('SERVER_IP') || 'localhost';

// Load SSL certificates
const certPath = path.join(__dirname, '../cert.pem');
const keyPath = path.join(__dirname, '../key.pem');

// Check if certificates exist
const certExists = fs.existsSync(certPath);
const keyExists = fs.existsSync(keyPath);
const useHttps = USE_HTTPS && certExists && keyExists;

function startServer(server) {
  server.listen(PORT, HOST, () => {
    const protocol = useHttps ? 'https' : 'http';
    logger.info(`✓ Server is running on ${protocol}://${SERVER_IP}:${PORT}`);
    logger.info(`✓ Binding to: ${HOST}:${PORT}`);
    if (useHttps) {
      logger.info('✓ Using HTTPS with self-signed certificates');
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      logger.error(`❌ Port ${PORT} is already in use. Try killing other processes or change PORT.`);
    } else {
      logger.error('❌ Server error:', err.message);
    }
    process.exit(1);
  });
}

if (useHttps) {
  const options = {
    key: fs.readFileSync(keyPath),
    cert: fs.readFileSync(certPath),
    requestCert: false,
  };
  startServer(https.createServer(options, app));
} else {
  // Local development / non-SSL mode
  startServer(http.createServer(app));
}
