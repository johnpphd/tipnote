import { randomBytes, createHash } from "crypto";

/**
 * Generate a cryptographically random token (base64url encoded).
 */
export function generateRandomToken(bytes = 32): string {
  return randomBytes(bytes).toString("base64url");
}

/**
 * SHA-256 hash a token for storage. Raw tokens are never stored.
 */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/**
 * Verify a PKCE S256 code challenge against a code verifier.
 * challenge = BASE64URL(SHA256(verifier))
 */
export function verifyPkceS256(
  codeVerifier: string,
  codeChallenge: string
): boolean {
  const computed = createHash("sha256")
    .update(codeVerifier)
    .digest("base64url");
  return computed === codeChallenge;
}
