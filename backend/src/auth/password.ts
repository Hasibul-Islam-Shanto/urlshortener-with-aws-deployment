import { compare, hash } from "bcryptjs";

/** bcrypt cost factor. 10 is a practical default for interactive sign-in on Lambda. */
export const BCRYPT_COST = 10;

/**
 * Hash of a password that is never a real account. Sign-in compares against this
 * when the email is unknown so the response time does not reveal whether the
 * email exists.
 */
export const DUMMY_PASSWORD_HASH =
  "$2b$10$3A6POq/NbG0fbzbWizQDjuMOKM/fNa.B5bRLv2oG5ZBzASA1LuGXC";

export const hashPassword = (
  password: string,
  cost: number = BCRYPT_COST,
): Promise<string> => hash(password, cost);

export const verifyPassword = (
  password: string,
  passwordHash: string,
): Promise<boolean> => compare(password, passwordHash);
