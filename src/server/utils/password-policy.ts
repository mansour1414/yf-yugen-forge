export interface PasswordValidationResult {
  success: boolean;
  errors: string[];
}

// bcrypt only uses the first 72 bytes of a password, so anything longer is silently truncated:
// two passwords that differ only after byte 72 would be interchangeable. Cap the length at the
// point where it still means something (bytes, not characters — Arabic letters take 2 bytes).
const MAX_PASSWORD_BYTES = 72;

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password || typeof password !== 'string') {
    return { success: false, errors: ['Password is required'] };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }

  if (Buffer.byteLength(password, 'utf8') > MAX_PASSWORD_BYTES) {
    errors.push(`Password is too long (maximum ${MAX_PASSWORD_BYTES} bytes)`);
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    success: errors.length === 0,
    errors,
  };
}
