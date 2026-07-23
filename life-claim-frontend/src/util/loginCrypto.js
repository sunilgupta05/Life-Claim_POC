import { readEnv } from './env'

function resolveLoginPublicKeyPem() {
  const fromEnv = readEnv('LOGIN_RSA_PUBLIC_KEY', '')
  if (fromEnv) {
    return fromEnv.replace(/\\n/g, '\n')
  }
  if (typeof __LOGIN_RSA_PUBLIC_KEY__ !== 'undefined' && __LOGIN_RSA_PUBLIC_KEY__) {
    return __LOGIN_RSA_PUBLIC_KEY__
  }
  return ''
}

function pemToArrayBuffer(pem) {
  const b64 = pem
    .replace(/-----BEGIN PUBLIC KEY-----/g, '')
    .replace(/-----END PUBLIC KEY-----/g, '')
    .replace(/\s/g, '')
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes.buffer
}

async function importPublicKey(pem) {
  return crypto.subtle.importKey(
    'spki',
    pemToArrayBuffer(pem),
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  )
}

export async function encryptPasswordForLogin(plainPassword) {
  const pem = resolveLoginPublicKeyPem()
  if (!pem) {
    throw new Error('Login RSA public key is not configured in the frontend build.')
  }
  const key = await importPublicKey(pem)
  const encoded = new TextEncoder().encode(plainPassword)
  const ciphertext = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, key, encoded)
  const bytes = new Uint8Array(ciphertext)
  let binary = ''
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}
