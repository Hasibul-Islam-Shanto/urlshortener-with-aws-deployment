export type UrlRecord = {
  shortCode: string;
  originalUrl: string;
  createdAt: string;
};

export type CreateUrlRequest = {
  url: string;
};

export type CreateUrlResponse = {
  shortCode: string;
  originalUrl: string;
};

export type ListUrlsResponse = {
  count: number;
  items: UrlRecord[];
};
