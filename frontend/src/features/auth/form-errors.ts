import { isApiError } from "../../services/api/errors";

export type SignUpFieldErrors = {
  email?: string;
  password?: string;
  form?: string;
};

export const signUpRequestError = (error: unknown): SignUpFieldErrors => {
  if (!isApiError(error)) {
    return { form: "Server error" };
  }
  if (error.status === 409) {
    return { form: "Email already registered" };
  }
  const email = error.fieldErrors?.email;
  if (email !== undefined) {
    return { email };
  }
  const password = error.fieldErrors?.password;
  if (password !== undefined) {
    return { password };
  }
  return { form: "Server error" };
};

export const signInRequestError = (error: unknown): string =>
  isApiError(error) && error.status === 401
    ? "Invalid email or password"
    : "Server error";
