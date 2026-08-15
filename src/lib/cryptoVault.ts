// Core Cryptography Engine for Sentinel Zero-Knowledge Vault

// Helper to convert buffer to base64
function bufferToBase64(buffer: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper to convert base64 to buffer
function base64ToBuffer(base64: string): ArrayBuffer {
  const binary_string = atob(base64);
  const len = binary_string.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binary_string.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Derives a strong AES-GCM key from a master password.
 * Uses PBKDF2 with SHA-256 and 100,000 iterations.
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits', 'deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

export interface EncryptedPayload {
  salt: string; // base64
  iv: string;   // base64
  data: string; // base64 encrypted data
}

/**
 * Encrypts a plaintext string (e.g. JSON stringified vault) using a master password.
 */
export async function encryptData(plaintext: string, password: string): Promise<EncryptedPayload> {
  // Generate a random salt for key derivation
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveKey(password, salt);

  // Generate a random initialization vector (IV) for AES-GCM
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const enc = new TextEncoder();
  const encryptedContent = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    enc.encode(plaintext)
  );

  return {
    salt: bufferToBase64(salt),
    iv: bufferToBase64(iv),
    data: bufferToBase64(encryptedContent)
  };
}

/**
 * Decrypts an EncryptedPayload using a master password.
 * Throws an error if the password is wrong or data is corrupted.
 */
export async function decryptData(payload: EncryptedPayload, password: string): Promise<string> {
  const salt = new Uint8Array(base64ToBuffer(payload.salt));
  const iv = new Uint8Array(base64ToBuffer(payload.iv));
  const encryptedContent = base64ToBuffer(payload.data);

  const key = await deriveKey(password, salt);

  try {
    const decryptedContent = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encryptedContent
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedContent);
  } catch (e) {
    throw new Error('Decryption failed. Incorrect master password or corrupted data.');
  }
}

/**
 * Generates a secure random password
 */
export function generatePassword(length = 16): string {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }
  return password;
}
