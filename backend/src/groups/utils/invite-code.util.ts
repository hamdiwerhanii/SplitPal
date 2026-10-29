import { randomInt } from 'crypto';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const INVITE_CODE_LENGTH = 8;

export const generateInviteCode = (): string =>
  Array.from(
    { length: INVITE_CODE_LENGTH },
    () => ALPHABET[randomInt(0, ALPHABET.length)],
  ).join('');

export const normalizeInviteCode = (value: string): string =>
  value.trim().toUpperCase();
