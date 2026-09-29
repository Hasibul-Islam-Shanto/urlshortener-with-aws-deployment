export type UserRecord = {
  readonly userId: string;
  readonly email: string;
  readonly passwordHash: string;
  readonly createdAt: string;
  readonly updatedAt: string;
};

/** Safe to return from the API. Never includes `passwordHash`. */
export type PublicUser = {
  readonly userId: string;
  readonly email: string;
};

export const toPublicUser = ({ userId, email }: UserRecord): PublicUser =>
  Object.freeze({ userId, email });
