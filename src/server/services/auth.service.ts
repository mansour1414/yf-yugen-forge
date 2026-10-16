import { prisma } from '../../lib/prisma';
import { comparePassword, hashRefreshToken, hashPassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken, TokenPayload } from '../utils/jwt';
import { LoginInput, ChangeOwnPasswordInput } from '../types/auth.schema';
import { performance } from 'perf_hooks';
import { logger } from '../core/logger/pino.logger';
import { ApiError } from '../core/errors/api-error';
import { OAuth2Client } from 'google-auth-library';
import { env } from '../core/config/env.config';

export class AuthService {
  static async login(input: LoginInput, userAgent?: string, ipAddress?: string) {
    const tTotalStart = performance.now();
    const { email, password } = input;

    // 1. Find user by email with role and permissions
    const t1 = performance.now();
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
    logger.debug(`[PERF] login.prisma.user.findUnique = ${(performance.now() - t1).toFixed(2)} ms`);

    if (!user) {
      const error: any = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    // 2. Verify password
    const t2 = performance.now();
    const isPasswordValid = await comparePassword(password, user.password);
    logger.debug(`[PERF] login.comparePassword = ${(performance.now() - t2).toFixed(2)} ms`);

    if (!isPasswordValid) {
      const error: any = new Error('Invalid credentials');
      error.statusCode = 401;
      throw error;
    }

    // 3. Check ACTIVE status
    if (user.status !== 'ACTIVE') {
      const error: any = new Error('Account disabled');
      error.statusCode = 403;
      throw error;
    }

    // 4. Update lastLogin
    const t3 = performance.now();
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });
    logger.debug(`[PERF] login.prisma.user.update = ${(performance.now() - t3).toFixed(2)} ms`);

    // 5. Generate Tokens
    const tokenPayload = { userId: user.id, role: user.role.name };
    
    const t6 = performance.now();
    const accessToken = generateAccessToken(tokenPayload);
    logger.debug(`[PERF] login.generateAccessToken = ${(performance.now() - t6).toFixed(2)} ms`);

    const t7 = performance.now();
    const refreshToken = generateRefreshToken(tokenPayload);
    logger.debug(`[PERF] login.generateRefreshToken = ${(performance.now() - t7).toFixed(2)} ms`);

    // 6. Hash and save Refresh Token in database session
    const t8 = performance.now();
    const hashedRefreshToken = hashRefreshToken(refreshToken);
    logger.debug(`[PERF] login.hashRefreshToken = ${(performance.now() - t8).toFixed(2)} ms`);

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const t4 = performance.now();
    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: hashedRefreshToken,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
        expiresAt,
      },
    });
    logger.debug(`[PERF] login.prisma.session.create = ${(performance.now() - t4).toFixed(2)} ms`);

    // 7. Insert ActivityLog
    const t5 = performance.now();
    await prisma.activityLog.create({
      data: {
        action: 'LOGIN',
        entity: 'USER',
        entityId: user.id,
        userId: user.id,
        ipAddress: ipAddress || null,
      },
    });
    logger.debug(`[PERF] login.prisma.activityLog.create = ${(performance.now() - t5).toFixed(2)} ms`);

    const permissions = user.role.permissions.map((rp) => rp.permission.name);
    const { password: _, ...userWithoutPassword } = user;

    logger.debug(`[PERF] TOTAL login() = ${(performance.now() - tTotalStart).toFixed(2)} ms`);

    return {
      token: accessToken,
      refreshToken,
      user: userWithoutPassword,
      permissions,
    };
  }

  /**
   * Sign in via Google Identity Services. Deliberately does NOT auto-create new
   * accounts (this project has no self-service registration flow, and every
   * Client-role user requires an Admin-entered business record that Google can't
   * provide). Only two outcomes are possible:
   *  - The Google account is already linked (by googleId) -> sign in normally.
   *  - No account is linked yet, but a local account exists with the same
   *    *verified* email -> link it (by email only, never by name) and sign in.
   *  - Otherwise -> reject with a clear "ask your admin" message. No user or
   *    session is ever created for an unrecognized email.
   */
  static async googleLogin(credential: string, userAgent?: string, ipAddress?: string) {
    const tTotalStart = performance.now();

    if (!env.GOOGLE_CLIENT_ID) {
      throw ApiError.internal('Google sign-in is not configured on this server');
    }

    // 1. Verify the Google ID token server-side (signature, issuer, audience,
    // and expiration are all checked internally by google-auth-library).
    // NOTE: never log `credential` or any decoded token value.
    const oauthClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);
    let payload: import('google-auth-library').TokenPayload | undefined;
    const t1 = performance.now();
    try {
      const ticket = await oauthClient.verifyIdToken({
        idToken: credential,
        audience: env.GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      throw ApiError.unauthorized('Invalid or expired Google credential');
    } finally {
      logger.debug(`[PERF] googleLogin.verifyIdToken = ${(performance.now() - t1).toFixed(2)} ms`);
    }

    if (!payload || !payload.sub || !payload.email) {
      throw ApiError.unauthorized('Invalid Google credential');
    }
    if (!payload.email_verified) {
      throw ApiError.unauthorized('Your Google email is not verified');
    }

    const googleId = payload.sub;
    const googleEmail = payload.email.toLowerCase();

    // 2. Case C: this Google account is already linked to a local user.
    let user = await prisma.user.findUnique({
      where: { googleId },
      include: { role: { include: { permissions: { include: { permission: true } } } } },
    });

    // 3. Case A: not linked yet, but a local account exists with this verified
    // email -> link by email only (never by name/picture).
    if (!user) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email: googleEmail },
        include: { role: { include: { permissions: { include: { permission: true } } } } },
      });

      if (existingByEmail) {
        if (existingByEmail.googleId && existingByEmail.googleId !== googleId) {
          // Extremely unlikely (would require a prior manual DB edit), but never
          // silently re-link an account that's already linked to a different Google identity.
          throw ApiError.forbidden('This account is linked to a different Google identity');
        }

        user = await prisma.user.update({
          where: { id: existingByEmail.id },
          data: {
            googleId,
            authProvider: 'google',
            // Only fill in an avatar if the user doesn't already have one set —
            // never overwrite an existing admin-managed avatar.
            ...(!existingByEmail.avatar && payload.picture ? { avatar: payload.picture } : {}),
          },
          include: { role: { include: { permissions: { include: { permission: true } } } } },
        });
      }
    }

    // 4. Case B (explicitly disabled): no local account matches this email.
    if (!user) {
      throw ApiError.notFound('No account found for this email. Please contact your administrator to get access.');
    }

    // 5. Respect the exact same account-status rules as normal login.
    if (user.status !== 'ACTIVE') {
      throw ApiError.forbidden('Account disabled');
    }

    // 6. Update lastLogin
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    // 7. Issue the SAME YF access/refresh tokens as normal login
    const tokenPayload = { userId: user.id, role: user.role.name };
    const accessToken = generateAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken(tokenPayload);
    const hashedRefreshToken = hashRefreshToken(refreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshToken: hashedRefreshToken,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
        expiresAt,
      },
    });

    await prisma.activityLog.create({
      data: {
        action: 'LOGIN_GOOGLE',
        entity: 'USER',
        entityId: user.id,
        userId: user.id,
        ipAddress: ipAddress || null,
      },
    });

    const permissions = user.role.permissions.map((rp) => rp.permission.name);
    const { password: _pw, ...userWithoutPassword } = user;

    logger.debug(`[PERF] TOTAL googleLogin() = ${(performance.now() - tTotalStart).toFixed(2)} ms`);

    return {
      token: accessToken,
      refreshToken,
      user: userWithoutPassword,
      permissions,
    };
  }

  static async refresh(refreshTokenCookie?: string, userAgent?: string, ipAddress?: string) {
    const tTotalStart = performance.now();

    if (!refreshTokenCookie) {
      const error: any = new Error('Refresh token not provided');
      error.statusCode = 401;
      throw error;
    }

    // 1. Verify Refresh Token JWT signature
    let payload: TokenPayload;
    const t1 = performance.now();
    try {
      const decoded = verifyRefreshToken(refreshTokenCookie);
      if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded) {
        payload = decoded as TokenPayload;
      } else {
        throw new Error('Invalid token payload');
      }
      logger.debug(`[PERF] refresh.verifyRefreshToken = ${(performance.now() - t1).toFixed(2)} ms`);
    } catch (err: any) {
      logger.debug(`[PERF] refresh.verifyRefreshToken = ${(performance.now() - t1).toFixed(2)} ms`);
      const error: any = new Error(`Invalid or expired refresh token: ${err.message}`);
      error.statusCode = 401;
      throw error;
    }

    // 2. Find active session using hashed refresh token
    const t2 = performance.now();
    const hashedCookie = hashRefreshToken(refreshTokenCookie);
    const matchedSession = await prisma.session.findFirst({
      where: {
        userId: payload.userId,
        refreshToken: hashedCookie,
        expiresAt: { gt: new Date() },
      },
    });
    logger.debug(`[PERF] refresh.prisma.session.findFirst = ${(performance.now() - t2).toFixed(2)} ms`);

    if (!matchedSession) {
      const error: any = new Error('Session not found or expired');
      error.statusCode = 401;
      throw error;
    }

    // 3. Load user to check active status and get role/permissions
    const t4 = performance.now();
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
    logger.debug(`[PERF] refresh.prisma.user.findUnique = ${(performance.now() - t4).toFixed(2)} ms`);

    if (!user || user.status !== 'ACTIVE') {
      const error: any = new Error('User inactive or not found');
      error.statusCode = 403;
      throw error;
    }

    // 4. Issue new Access Token and Rotate Refresh Token
    const tokenPayload = { userId: user.id, role: user.role.name };
    
    const t7 = performance.now();
    const newAccessToken = generateAccessToken(tokenPayload);
    logger.debug(`[PERF] refresh.generateAccessToken = ${(performance.now() - t7).toFixed(2)} ms`);

    const t8 = performance.now();
    const newRefreshToken = generateRefreshToken(tokenPayload);
    logger.debug(`[PERF] refresh.generateRefreshToken = ${(performance.now() - t8).toFixed(2)} ms`);

    const t9 = performance.now();
    const newHashedRefreshToken = hashRefreshToken(newRefreshToken);
    logger.debug(`[PERF] refresh.hashRefreshToken = ${(performance.now() - t9).toFixed(2)} ms`);

    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Replace old session with rotated session atomically: delete + create run
    // in a single Prisma transaction, so a mid-way failure (e.g. a dropped DB
    // connection) can never leave the user with neither a valid old session
    // nor a valid new one — either both operations commit or neither does.
    const t5 = performance.now();
    try {
      await prisma.$transaction([
        prisma.session.delete({
          where: { id: matchedSession.id },
        }),
        prisma.session.create({
          data: {
            userId: user.id,
            refreshToken: newHashedRefreshToken,
            userAgent: userAgent || null,
            ipAddress: ipAddress || null,
            expiresAt,
          },
        }),
      ]);
    } catch (err: any) {
      logger.warn({ err: { code: err.code, message: err.message } }, 'refresh: failed to rotate session');
      throw err;
    }
    logger.debug(`[PERF] refresh.prisma.session.rotate = ${(performance.now() - t5).toFixed(2)} ms`);

    logger.debug(`[PERF] TOTAL refresh() = ${(performance.now() - tTotalStart).toFixed(2)} ms`);

    return {
      token: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  static async logout(refreshTokenCookie?: string) {
    if (!refreshTokenCookie) return;

    try {
      const decoded = verifyRefreshToken(refreshTokenCookie);
      if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded) {
        const payload = decoded as TokenPayload;
        const hashedCookie = hashRefreshToken(refreshTokenCookie);
        await prisma.session.deleteMany({
          where: {
            userId: payload.userId,
            refreshToken: hashedCookie,
          },
        });
      }
    } catch (err) {
      // Ignore invalid token on logout
    }
  }

  static async logoutAll(userId: string) {
    await prisma.session.deleteMany({
      where: { userId },
    });
  }

  static async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      const error: any = new Error('User not found');
      error.statusCode = 404;
      throw error;
    }

    const permissions = user.role.permissions.map((rp) => rp.permission.name);
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      role: user.role,
      permissions,
    };
  }

  static async changeOwnPassword(userId: string, input: ChangeOwnPasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw ApiError.notFound('User not found');
    }

    const isCurrentValid = await comparePassword(input.currentPassword, user.password);
    if (!isCurrentValid) {
      throw ApiError.badRequest('Current password is incorrect');
    }

    const hashedPassword = await hashPassword(input.newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword, mustChangePassword: false },
      }),
      prisma.session.deleteMany({ where: { userId } }),
    ]);

    await prisma.activityLog.create({
      data: { action: 'CHANGE_OWN_PASSWORD', entity: 'USER', entityId: userId, userId },
    });

    return { success: true };
  }
}
