// backend/server.js

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const os = require('os');
const app = require('./app');

// Backend startup rules:
// - same code runs in local and deployment
// - machine/environment decides whether URL is localhost or deployed IP/domain
// - switch using .env values, not by commenting code
const PORT = process.env.PORT || 3012;
const HOST = process.env.HOST || '0.0.0.0'; // Bind to all interfaces
const USE_HTTPS = process.env.USE_HTTPS !== 'false'; // Default to HTTPS; set to 'false' to disable

// Display URL only; deployment host/domain should come from environment.
const SERVER_IP = process.env.SERVER_IP || 'localhost';

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
    console.log(`✓ Server is running on ${protocol}://${SERVER_IP}:${PORT}`);
    console.log(`✓ Binding to: ${HOST}:${PORT}`);
    if (useHttps) {
      console.log('✓ Using HTTPS with self-signed certificates');
    }
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use. Try killing other processes or change PORT.`);
    } else {
      console.error('❌ Server error:', err.message);
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
