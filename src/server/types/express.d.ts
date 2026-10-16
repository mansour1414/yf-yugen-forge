import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
      };
      clientId?: string;
    }
  }
}

export {};
