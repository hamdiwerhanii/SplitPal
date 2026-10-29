import {
  createHash,
  createHmac,
  randomBytes,
  randomInt,
  timingSafeEqual,
} from 'crypto';

export const generateOtpCode = (): string =>
  randomInt(0, 1_000_000).toString().padStart(6, '0');

export const hashOtpCode = (secret: string, email: string, code: string) =>
  createHmac('sha256', secret).update(`${email}:${code}`).digest('hex');

export const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

export const generateSecret = () => randomBytes(32).toString('base64url');

export const safeEqual = (a: string, b: string): boolean => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

export const splitOpaqueToken = (
  token: string,
): { id: string; secret: string } | null => {
  const [id, secret, ...rest] = token.split('.');
  if (!id || !secret || rest.length > 0) {
    return null;
  }
  return { id, secret };
};
