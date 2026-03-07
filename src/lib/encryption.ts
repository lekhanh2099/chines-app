/**
 * Server-side AES-256-GCM encryption for BYOK API keys.
 * Uses Node.js crypto — never import this on the client.
 */

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
 const secret = process.env.BYOK_ENCRYPTION_SECRET;
 if (!secret || secret.length < 32) {
  throw new Error(
   "BYOK_ENCRYPTION_SECRET must be set (min 32 chars) in environment variables.",
  );
 }
 // Use first 32 bytes as AES-256 key
 return Buffer.from(secret.slice(0, 32), "utf8");
}

/**
 * Encrypt a plaintext API key. Returns base64-encoded string:
 *   iv(12 bytes) + authTag(16 bytes) + ciphertext
 */
export function encryptApiKey(plaintext: string): string {
 const key = getEncryptionKey();
 const iv = randomBytes(IV_LENGTH);
 const cipher = createCipheriv(ALGORITHM, key, iv);

 const encrypted = Buffer.concat([
  cipher.update(plaintext, "utf8"),
  cipher.final(),
 ]);
 const authTag = cipher.getAuthTag();

 return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/**
 * Decrypt a base64-encoded encrypted API key back to plaintext.
 */
export function decryptApiKey(encoded: string): string {
 const key = getEncryptionKey();
 const data = Buffer.from(encoded, "base64");

 const iv = data.subarray(0, IV_LENGTH);
 const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
 const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

 const decipher = createDecipheriv(ALGORITHM, key, iv);
 decipher.setAuthTag(authTag);

 return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
  "utf8",
 );
}
