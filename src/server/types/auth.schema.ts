import { z } from 'zod';
import { validatePassword } from '../utils/password-policy';

const passwordField = z.string().min(1, 'Password is required').refine(
  (val) => {
    const result = validatePassword(val);
    return result.success;
  },
  {
    message: 'Password does not meet complexity requirements',
  }
);

export const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const GoogleAuthSchema = z.object({
  credential: z.string().min(1, 'Google credential is required'),
});

export const ChangeOwnPasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordField,
});

export type LoginInput = z.infer<typeof LoginSchema>;
export type GoogleAuthInput = z.infer<typeof GoogleAuthSchema>;
export type ChangeOwnPasswordInput = z.infer<typeof ChangeOwnPasswordSchema>;
