import jwt from 'jsonwebtoken';

export interface TokenPayload {
  userId: string;
  role: string;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return secret;
};

const getJwtRefreshSecret = (): string => {
  const secret = process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_REFRESH_SECRET is not defined in environment variables');
  }
  return secret;
};

const getJwtExpiresIn = (): string | number => {
  return process.env.JWT_EXPIRES_IN || '15m';
};

const getJwtRefreshExpiresIn = (): string | number => {
  return process.env.JWT_REFRESH_EXPIRES || '30d';
};

export function generateAccessToken(payload: TokenPayload): string {
  const secret = getJwtSecret();
  const expiresIn = getJwtExpiresIn() as any;
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyAccessToken(token: string): TokenPayload {
  const secret = getJwtSecret();
  const decoded = jwt.verify(token, secret);
  return decoded as TokenPayload;
}

export function generateRefreshToken(payload: TokenPayload): string {
  const secret = getJwtRefreshSecret();
  const expiresIn = getJwtRefreshExpiresIn() as any;
  return jwt.sign(payload, secret, { expiresIn });
}

export function verifyRefreshToken(token: string): TokenPayload {
  const secret = getJwtRefreshSecret();
  const decoded = jwt.verify(token, secret);
  return decoded as TokenPayload;
}
