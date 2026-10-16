import { Response } from 'express';

export function sendSuccess(res: Response, data: any, message?: string, statusCode: number = 200) {
  return res.status(statusCode).json({
    success: true,
    ...(message && { message }),
    data,
  });
}

export function sendPaginated(res: Response, data: any, pagination: { total: number; page: number; limit: number; totalPages: number }, message?: string) {
  return res.status(200).json({
    success: true,
    ...(message && { message }),
    data,
    pagination,
  });
}
