/**
 * Client-side input validation. Password rules MUST match
 * backend_app/app/schemas/auth.py (_PASSWORD_MIN, _PASSWORD_RE).
 */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72; // bcrypt limit
const PASSWORD_COMPLEXITY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePassword = (password: string): boolean => {
  if (!password) return false;
  if (password.length < PASSWORD_MIN_LENGTH) return false;
  if (password.length > PASSWORD_MAX_LENGTH) return false;
  return PASSWORD_COMPLEXITY.test(password);
};

export const passwordRequirementsMessage = (): string =>
  `Password must be at least ${PASSWORD_MIN_LENGTH} characters and contain an uppercase letter, a lowercase letter, and a digit`;

export const validateCoordinates = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};
