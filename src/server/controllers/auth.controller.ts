import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginSchema, GoogleAuthSchema, ChangeOwnPasswordSchema } from '../types/auth.schema';

export class AuthController {
  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validationResult = LoginSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationResult.error.format(),
        });
      }

      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await AuthService.login(validationResult.data, userAgent, ipAddress);

      // Set Refresh Token as HttpOnly Secure Cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      return res.status(200).json({
        success: true,
        token: result.token,
        user: result.user,
        permissions: result.permissions,
      });
    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      next(error);
    }
  }

  static async googleLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const validationResult = GoogleAuthSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationResult.error.format(),
        });
      }

      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;
      const result = await AuthService.googleLogin(validationResult.data.credential, userAgent, ipAddress);

      // Same cookie shape as normal login — the frontend behaves identically after either flow.
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      return res.status(200).json({
        success: true,
        token: result.token,
        user: result.user,
        permissions: result.permissions,
      });
    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      next(error);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshTokenCookie = req.cookies?.refreshToken;
      const userAgent = req.headers['user-agent'];
      const ipAddress = req.ip || req.socket.remoteAddress;

      const result = await AuthService.refresh(refreshTokenCookie, userAgent, ipAddress);

      // Rotate Refresh Token Cookie
      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        path: '/',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      return res.status(200).json({
        success: true,
        token: result.token,
      });
    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      next(error);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const refreshTokenCookie = req.cookies?.refreshToken;
      await AuthService.logout(refreshTokenCookie);

      res.clearCookie('refreshToken', {
        path: '/',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
      return res.status(200).json({
        success: true,
      });
    } catch (error) {
      next(error);
    }
  }

  static async logoutAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      await AuthService.logoutAll(req.user.userId);

      res.clearCookie('refreshToken', {
        path: '/',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production',
      });
      return res.status(200).json({
        success: true,
      });
    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      next(error);
    }
  }

  static async getCurrentUser(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const result = await AuthService.getCurrentUser(req.user.userId);

      return res.status(200).json({
        success: true,
        user: result.user,
        role: result.role,
        permissions: result.permissions,
      });
    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      next(error);
    }
  }

  static async changeOwnPassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user || !req.user.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const validationResult = ChangeOwnPasswordSchema.safeParse(req.body);
      if (!validationResult.success) {
        return res.status(400).json({
          error: 'Validation failed',
          details: validationResult.error.format(),
        });
      }

      await AuthService.changeOwnPassword(req.user.userId, validationResult.data);

      res.clearCookie('refreshToken', {
        path: '/',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      return res.status(200).json({ success: true });
    } catch (error: any) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      next(error);
    }
  }
}
