import crypto from 'node:crypto';

// Computes an HMAC-SHA256 signature over the raw request body, hex-encoded.
// Real providers each define their own scheme (header name, hashing algorithm,
// whether the secret is per-merchant or global) — this is the shared building
// block adapters use to implement `verifyWebhookSignature` once real credentials
// replace the mock secret.
export function computeHmacSignature(rawBody, secret) {
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
}

export function timingSafeEqualHex(a, b) {
  if (!a || !b) return false;
  const bufA = Buffer.from(a, 'hex');
  const bufB = Buffer.from(b, 'hex');
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}
