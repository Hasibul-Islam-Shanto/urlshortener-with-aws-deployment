const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const MIN_PASSWORD_LENGTH = 8;
export const MAX_PASSWORD_LENGTH = 72;

export const validateEmail = (value: string): string | null => {
  const trimmed = value.trim();
  if (trimmed === "") {
    return "Email is required";
  }
  if (!EMAIL_PATTERN.test(trimmed)) {
    return "Invalid email address";
  }
  return null;
};

export const validatePassword = (value: string): string | null => {
  if (value === "") {
    return "Password is required";
  }
  if (value.length < MIN_PASSWORD_LENGTH) {
    return "Password is too short";
  }
  if (value.length > MAX_PASSWORD_LENGTH) {
    return "Password is too long";
  }
  return null;
};

export const validateConfirmPassword = (
  password: string,
  confirm: string,
): string | null => {
  if (confirm === "") {
    return "Confirm your password";
  }
  if (password !== confirm) {
    return "Passwords do not match";
  }
  return null;
};
