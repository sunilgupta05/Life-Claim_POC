const forge = require('node-forge');
const fs = require('fs');
const path = require('path');

console.log('Generating self-signed SSL certificates...');

try {
  // Generate a key pair
  console.log('  - Generating RSA key pair (2048 bits)...');
  const keys = forge.pki.rsa.generateKeyPair(2048);

  // Create a certificate
  console.log('  - Creating certificate...');
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notAfter.getFullYear() + 1);

  const attrs = [
    { name: 'commonName', value: '192.168.60.16' },
    { name: 'countryName', value: 'US' },
    { name: 'stateOrProvinceName', value: 'State' },
    { name: 'localityName', value: 'City' },
    { name: 'organizationName', value: 'Organization' },
  ];
  cert.setSubject(attrs);
  cert.setIssuer(attrs);

  // Self-sign certificate
  cert.setExtensions([
    {
      name: 'basicConstraints',
      cA: true,
    },
    {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true,
    },
    {
      name: 'extKeyUsage',
      serverAuth: true,
      clientAuth: true,
      codeSigning: true,
    },
    {
      name: 'subjectAltName',
      altNames: [
        {
          type: 2, // DNS
          value: '192.168.60.16',
        },
        {
          type: 2, // DNS
          value: 'localhost',
        },
        {
          type: 7, // IP
          ip: '192.168.60.16',
        },
        {
          type: 7, // IP
          ip: '127.0.0.1',
        },
      ],
    },
  ]);

  cert.sign(keys.privateKey, forge.md.sha256.create());

  // Convert to PEM
  const certPem = forge.pki.certificateToPem(cert);
  const keyPem = forge.pki.privateKeyToPem(keys.privateKey);

  // Write to files
  fs.writeFileSync(path.join(__dirname, 'cert.pem'), certPem);
  fs.writeFileSync(path.join(__dirname, 'key.pem'), keyPem);

  console.log('✓ SSL certificates generated successfully!');
  console.log('  - cert.pem');
  console.log('  - key.pem');
} catch (error) {
  console.error('Error generating certificates:', error.message);
  process.exit(1);
}
