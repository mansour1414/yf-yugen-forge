import bcrypt from 'bcrypt';
import { randomInt } from 'crypto';
import crypto from 'crypto';
import { env } from '../core/config/env.config';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function hashRefreshToken(token: string): string {
  const secret = env.REFRESH_TOKEN_HASH_SECRET;
  return crypto.createHmac('sha256', secret).update(token).digest('hex');
}

export function generateTemporaryPassword(length: number = 16): string {
  const characterSets = [
    'ABCDEFGHJKLMNPQRSTUVWXYZ',
    'abcdefghijkmnopqrstuvwxyz',
    '23456789',
    '!@#$%^&*',
  ];
  const allCharacters = characterSets.join('');
  const password = characterSets.map((characters) => characters[randomInt(characters.length)]);

  while (password.length < length) {
    password.push(allCharacters[randomInt(allCharacters.length)]);
  }

  for (let index = password.length - 1; index > 0; index -= 1) {
    const swapIndex = randomInt(index + 1);
    [password[index], password[swapIndex]] = [password[swapIndex], password[index]];
  }

  return password.join('');
}
