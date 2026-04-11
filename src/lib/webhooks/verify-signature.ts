import crypto from 'node:crypto';

export interface VerifyWebhookSignatureOptions {
  rawBody: string;
  signature: string | null | undefined;
  secret: string | undefined;
  signaturePrefix?: string | null;
  algorithm?: 'sha1' | 'sha256' | 'sha512';
}

function normalizeSignature(signature: string, prefix?: string | null): string {
  const trimmed = signature.trim();
  if (!prefix) return trimmed;

  const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return trimmed.replace(new RegExp(`^${escaped}`, 'i'), '');
}

export function verifyWebhookSignature({
  rawBody,
  signature,
  secret,
  signaturePrefix,
  algorithm = 'sha256',
}: VerifyWebhookSignatureOptions): boolean {
  if (!secret || !signature) return false;

  const normalizedSignature = normalizeSignature(signature, signaturePrefix);
  if (!normalizedSignature) return false;

  const expected = crypto.createHmac(algorithm, secret).update(rawBody).digest('hex');

  const expectedBuffer = Buffer.from(expected, 'hex');
  const signatureBuffer = Buffer.from(normalizedSignature, 'hex');

  if (signatureBuffer.length !== expectedBuffer.length) return false;

  return crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
}

