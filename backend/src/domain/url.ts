export type UrlRecord = {
  readonly shortCode: string;
  readonly originalUrl: string;
  readonly createdAt: string;
  /** Absent on URLs created before authentication. Those rows stay unowned. */
  readonly userId?: string;
};

export type CreateUrlRecordParams = {
  readonly shortCode: string;
  readonly originalUrl: string;
  readonly createdAt: Date;
  readonly userId: string;
};

export const createUrlRecord = ({
  shortCode,
  originalUrl,
  createdAt,
  userId,
}: CreateUrlRecordParams): UrlRecord =>
  Object.freeze({
    shortCode,
    originalUrl,
    createdAt: createdAt.toISOString(),
    userId,
  });
