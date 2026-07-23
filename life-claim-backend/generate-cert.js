const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Generating self-signed SSL certificates...');

try {
  // Try using PowerShell on Windows
  if (process.platform === 'win32') {
    const certPath = path.join(__dirname, 'cert.pem');
    const keyPath = path.join(__dirname, 'key.pem');
    
    // Use WSL or Git Bash if available, otherwise use Node's native crypto
    const cmd = `
    $cert = New-SelfSignedCertificate -DnsName "192.168.60.16" -CertStoreLocation "cert:\\CurrentUser\\My" -FriendlyName "Life Claim Backend" -NotAfter (Get-Date).AddYears(1);
    $pwd = ConvertTo-SecureString -String "temp123" -AsPlainText -Force;
    Export-PfxCertificate -Cert $cert -FilePath "${path.join(__dirname, 'cert.pfx')}" -Password $pwd;
    `;
    
    try {
      execSync(`powershell -Command "${cmd.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
      console.log('✓ Certificates generated successfully!');
    } catch (e) {
      console.log('PowerShell method failed, using alternative approach...');
      // Use node-pem or openssl from Git Bash/WSL with SANs
      const wsslCmd = `bash -c "openssl req -x509 -newkey rsa:2048 -nodes -out cert.pem -keyout key.pem -days 365 -subj '/C=US/ST=State/L=City/O=Organization/CN=192.168.60.16' -addext 'subjectAltName=IP:192.168.60.16,DNS:localhost,IP:127.0.0.1'"`;
      try {
        execSync(wsslCmd, { cwd: __dirname, stdio: 'inherit' });
        console.log('✓ Certificates generated via WSL/Git Bash with SANs!');
      } catch (e2) {
        console.error('Failed to generate certificates:', e2.message);
        console.log('\nManual steps:');
        console.log('1. Install Git for Windows (includes OpenSSL)');
        console.log('2. Run: git bash');
        console.log('3. Navigate to: C:\\Projects\\life_claim_policy_v2\\life-claim-backend');
        console.log('4. Run the following command:');
        console.log('openssl req -x509 -newkey rsa:2048 -nodes -out cert.pem -keyout key.pem -days 365 \\');
        console.log('  -subj "/C=US/ST=State/L=City/O=Organization/CN=192.168.60.16" \\');
        console.log('  -addext "subjectAltName=IP:192.168.60.16,DNS:localhost,IP:127.0.0.1"');
      }
    }
  } else {
    // Unix-like systems
    execSync('openssl req -x509 -newkey rsa:2048 -nodes -out cert.pem -keyout key.pem -days 365 -subj "/C=US/ST=State/L=City/O=Organization/CN=192.168.60.16" -addext "subjectAltName=IP:192.168.60.16,DNS:localhost,IP:127.0.0.1"', 
      { cwd: __dirname, stdio: 'inherit' });
    console.log('✓ Certificates generated successfully with SANs!');
  }
} catch (error) {
  console.error('Error generating certificates:', error.message);
  process.exit(1);
}
