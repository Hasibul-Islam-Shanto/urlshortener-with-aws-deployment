const MAX_URL_LENGTH = 2048;

export const validateUrl = (value: string): string | null => {
  const trimmed = value.trim();
  if (trimmed === "") {
    return "Enter a URL to shorten.";
  }
  if (trimmed.length > MAX_URL_LENGTH) {
    return `URL must be at most ${MAX_URL_LENGTH} characters.`;
  }
  if (!URL.canParse(trimmed)) {
    return "Only http and https URLs are supported.";
  }
  const protocol = new URL(trimmed).protocol;
  if (protocol !== "http:" && protocol !== "https:") {
    return "Only http and https URLs are supported.";
  }
  return null;
};

export const safeHttpUrl = (value: string): string | null => {
  if (!URL.canParse(value)) {
    return null;
  }
  const url = new URL(value);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return null;
  }
  return url.toString();
};
