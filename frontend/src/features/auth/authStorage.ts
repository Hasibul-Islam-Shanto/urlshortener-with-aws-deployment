const TOKEN_KEY = "url-shortener.accessToken";

/** Any script on this origin can read this token. */
export const authStorage = {
  getToken: (): string | undefined => {
    const token = localStorage.getItem(TOKEN_KEY);
    return token === null || token === "" ? undefined : token;
  },
  setToken: (token: string): void => {
    localStorage.setItem(TOKEN_KEY, token);
  },
  removeToken: (): void => {
    localStorage.removeItem(TOKEN_KEY);
  },
};

let sessionNotice: string | null = null;

export const setSessionNotice = (message: string): void => {
  sessionNotice = message;
};

export const takeSessionNotice = (): string | null => {
  const notice = sessionNotice;
  sessionNotice = null;
  return notice;
};
