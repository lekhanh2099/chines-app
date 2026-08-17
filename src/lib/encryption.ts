/**
 * Server-side AES-256-GCM encryption for BYOK API keys.
 * Uses Node.js crypto — never import this on the client.
 */

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const FALLBACK_KEY_CONTEXT = "chines-app/byok/supabase-secret/v1";

function getDedicatedEncryptionKey(): Buffer | null {
 const secret = process.env.BYOK_ENCRYPTION_SECRET;
 if (!secret) return null;
 if (secret.length < 32) {
  throw new Error("BYOK_ENCRYPTION_SECRET must be at least 32 characters.");
 }

 // Preserve the existing derivation so already-encrypted keys remain readable.
 return Buffer.from(secret.slice(0, 32), "utf8");
}

function getSupabaseFallbackEncryptionKey(): Buffer | null {
 const secret = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (!secret) return null;

 return createHash("sha256")
  .update(`${FALLBACK_KEY_CONTEXT}\0${secret}`, "utf8")
  .digest();
}

function getEncryptionKeys(): Buffer[] {
 const dedicated = getDedicatedEncryptionKey();
 const fallback = getSupabaseFallbackEncryptionKey();
 const keys = [dedicated, fallback].filter((key): key is Buffer => key !== null);

 if (keys.length === 0) {
  throw new Error(
   "BYOK encryption is not configured. Set BYOK_ENCRYPTION_SECRET, SUPABASE_SECRET_KEY, or SUPABASE_SERVICE_ROLE_KEY.",
  );
 }

 return keys;
}

function decryptWithKey(encoded: string, key: Buffer): string {
 const data = Buffer.from(encoded, "base64");
 if (data.length <= IV_LENGTH + AUTH_TAG_LENGTH) {
  throw new Error("Encrypted API key payload is invalid.");
 }

 const iv = data.subarray(0, IV_LENGTH);
 const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
 const ciphertext = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

 const decipher = createDecipheriv(ALGORITHM, key, iv);
 decipher.setAuthTag(authTag);

 return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

export function isByokEncryptionConfigured(): boolean {
 try {
  return getEncryptionKeys().length > 0;
 } catch {
  return false;
 }
}

/**
 * Encrypt a plaintext API key. Returns base64-encoded string:
 *   iv(12 bytes) + authTag(16 bytes) + ciphertext
 */
export function encryptApiKey(plaintext: string): string {
 const key = getEncryptionKeys()[0];
 const iv = randomBytes(IV_LENGTH);
 const cipher = createCipheriv(ALGORITHM, key, iv);

 const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
 const authTag = cipher.getAuthTag();

 return Buffer.concat([iv, authTag, encrypted]).toString("base64");
}

/**
 * Decrypt a base64-encoded encrypted API key back to plaintext.
 *
 * When a dedicated BYOK secret is added later, try the server-secret fallback
 * too so keys encrypted before that configuration change remain readable.
 */
export function decryptApiKey(encoded: string): string {
 const keys = getEncryptionKeys();
 let lastError: Error | null = null;

 for (const key of keys) {
  try {
   return decryptWithKey(encoded, key);
  } catch (error) {
   lastError = error instanceof Error ? error : new Error("Unable to decrypt API key.");
  }
 }

 throw lastError || new Error("Unable to decrypt API key.");
}
