import { MlKem1024 } from 'mlkem';

/**
 * Quantum-Safe Cryptography Module
 * Uses CRYSTALS-Kyber (ML-KEM) for post-quantum key encapsulation
 * and AES-256-GCM for symmetric encryption
 */

export interface EncryptedData {
  encapsulatedKey: string; // Base64 encoded
  ciphertext: string; // Base64 encoded
  iv: string; // Base64 encoded
  tag: string; // Base64 encoded (authentication tag)
}

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

/**
 * Generate a quantum-safe key pair using CRYSTALS-Kyber-1024
 */
export async function generateQuantumSafeKeyPair(): Promise<KeyPair> {
  const mlkem = new MlKem1024();
  const [publicKey, privateKey] = await mlkem.generateKeyPair();
  return { publicKey, privateKey };
}

/**
 * Encrypt data using quantum-safe cryptography
 * @param data - The data to encrypt (as string or object)
 * @param recipientPublicKey - The recipient's public key
 * @returns Encrypted data bundle
 */
export async function encryptWithQuantumSafe(
  data: string | object,
  recipientPublicKey: Uint8Array
): Promise<EncryptedData> {
  try {
    const mlkem = new MlKem1024();
    
    // Convert data to string if it's an object
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    const dataBytes = new TextEncoder().encode(dataString);

    // Step 1: Key encapsulation - generate shared secret using recipient's public key
    const [encapsulatedKey, sharedSecret] = await mlkem.encap(recipientPublicKey);

    // Step 2: Derive AES key from shared secret using Web Crypto API
    const aesKey = await crypto.subtle.importKey(
      'raw',
      sharedSecret.slice(0, 32), // Use 256 bits for AES-256
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    );

    // Step 3: Generate random IV
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Step 4: Encrypt data with AES-256-GCM
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      aesKey,
      dataBytes
    );

    // Extract authentication tag (last 16 bytes)
    const ciphertext = new Uint8Array(encryptedData.slice(0, -16));
    const tag = new Uint8Array(encryptedData.slice(-16));

    return {
      encapsulatedKey: arrayBufferToBase64(encapsulatedKey),
      ciphertext: arrayBufferToBase64(ciphertext),
      iv: arrayBufferToBase64(iv),
      tag: arrayBufferToBase64(tag)
    };
  } catch (error) {
    console.error('Quantum-safe encryption failed:', error);
    throw new Error('Failed to encrypt data with quantum-safe cryptography');
  }
}

/**
 * Decrypt data using quantum-safe cryptography
 * @param encryptedData - The encrypted data bundle
 * @param privateKey - The recipient's private key
 * @returns Decrypted data
 */
export async function decryptWithQuantumSafe(
  encryptedData: EncryptedData,
  privateKey: Uint8Array
): Promise<string> {
  try {
    const mlkem = new MlKem1024();

    // Step 1: Decapsulate to recover shared secret
    const encapsulatedKey = new Uint8Array(base64ToArrayBuffer(encryptedData.encapsulatedKey));
    const sharedSecret = await mlkem.decap(encapsulatedKey, privateKey);

    // Step 2: Derive AES key from shared secret
    const aesKey = await crypto.subtle.importKey(
      'raw',
      sharedSecret.slice(0, 32),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    );

    // Step 3: Prepare encrypted data with authentication tag
    const ciphertext = base64ToArrayBuffer(encryptedData.ciphertext);
    const tag = base64ToArrayBuffer(encryptedData.tag);
    const iv = base64ToArrayBuffer(encryptedData.iv);
    
    // Combine ciphertext and tag for decryption
    const encryptedBytes = new Uint8Array(ciphertext.byteLength + tag.byteLength);
    encryptedBytes.set(new Uint8Array(ciphertext), 0);
    encryptedBytes.set(new Uint8Array(tag), ciphertext.byteLength);

    // Step 4: Decrypt with AES-256-GCM
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: new Uint8Array(iv) },
      aesKey,
      encryptedBytes
    );

    return new TextDecoder().decode(decryptedData);
  } catch (error) {
    console.error('Quantum-safe decryption failed:', error);
    throw new Error('Failed to decrypt data with quantum-safe cryptography');
  }
}

/**
 * Generate and store a quantum-safe key pair in localStorage
 * (In production, use secure key storage like Web Crypto API's non-extractable keys)
 */
export async function initializeQuantumSafeKeys(): Promise<void> {
  const existingPublicKey = localStorage.getItem('qc_public_key');
  
  if (!existingPublicKey) {
    const { publicKey, privateKey } = await generateQuantumSafeKeyPair();
    
    // Store keys (in production, use secure storage)
    localStorage.setItem('qc_public_key', arrayBufferToBase64(publicKey));
    localStorage.setItem('qc_private_key', arrayBufferToBase64(privateKey));
    
    console.log('✅ Quantum-safe keys initialized');
  }
}

/**
 * Get stored public key
 */
export function getPublicKey(): Uint8Array | null {
  const key = localStorage.getItem('qc_public_key');
  return key ? new Uint8Array(base64ToArrayBuffer(key)) : null;
}

/**
 * Get stored private key
 */
export function getPrivateKey(): Uint8Array | null {
  const key = localStorage.getItem('qc_private_key');
  return key ? new Uint8Array(base64ToArrayBuffer(key)) : null;
}

// Utility functions for Base64 encoding/decoding
function arrayBufferToBase64(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}
