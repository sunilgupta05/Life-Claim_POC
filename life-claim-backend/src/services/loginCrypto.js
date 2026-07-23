const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const KEYS_DIR = path.join(__dirname, '../../keys');
let publicKeyPem = null;
let privateKeyPem = null;

function loadKeys() {
  if (publicKeyPem && privateKeyPem) return;

  if (process.env.LOGIN_RSA_PRIVATE_KEY && process.env.LOGIN_RSA_PUBLIC_KEY) {
    privateKeyPem = process.env.LOGIN_RSA_PRIVATE_KEY.replace(/\\n/g, '\n');
    publicKeyPem = process.env.LOGIN_RSA_PUBLIC_KEY.replace(/\\n/g, '\n');
    return;
  }

  const privPath = path.join(KEYS_DIR, 'login_private.pem');
  const pubPath = path.join(KEYS_DIR, 'login_public.pem');

  if (fs.existsSync(privPath) && fs.existsSync(pubPath)) {
    privateKeyPem = fs.readFileSync(privPath, 'utf8');
    publicKeyPem = fs.readFileSync(pubPath, 'utf8');
    return;
  }

  if (process.env.NODE_ENV === 'production') {
    console.error('[loginCrypto] LOGIN_RSA_* env vars or keys/login_*.pem are required in production.');
    return;
  }

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  fs.mkdirSync(KEYS_DIR, { recursive: true });
  fs.writeFileSync(privPath, privateKey, { mode: 0o600 });
  fs.writeFileSync(pubPath, publicKey, { mode: 0o644 });
  privateKeyPem = privateKey;
  publicKeyPem = publicKey;
  console.log('[loginCrypto] Generated development RSA key pair at', KEYS_DIR);
}

function isEncryptionEnabled() {
  loadKeys();
  return Boolean(publicKeyPem && privateKeyPem);
}

function getPublicKeyPem() {
  loadKeys();
  return publicKeyPem;
}

function decryptPassword(encryptedBase64) {
  loadKeys();
  if (!privateKeyPem) {
    const err = new Error('Login password encryption is not configured on the server.');
    err.status = 503;
    throw err;
  }

  const ciphertext = Buffer.from(String(encryptedBase64 || ''), 'base64');
  if (!ciphertext.length) {
    const err = new Error('Encrypted password payload is empty.');
    err.status = 400;
    throw err;
  }

  return crypto.privateDecrypt(
    {
      key: privateKeyPem,
      padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    ciphertext
  ).toString('utf8');
}

module.exports = {
  isEncryptionEnabled,
  getPublicKeyPem,
  decryptPassword,
};
