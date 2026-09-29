import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";

import { env } from "../../config/env";
import { createAuthApi } from "../../services/api/auth";
import type { AuthUser } from "../../services/api/auth";
import { createApiClient } from "../../services/api/client";
import { createUrlsApi } from "../../services/api/urls";
import { AuthContext } from "./auth-context";
import { authStorage, setSessionNotice } from "./authStorage";

type Session = {
  token: string;
  user: AuthUser;
};

const apiBaseUrl = (): string => (import.meta.env.DEV ? "" : env.apiBaseUrl);

let expireSession = (): void => undefined;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(() => authStorage.getToken() !== undefined);

  const client = useMemo(
    () =>
      createApiClient({
        baseUrl: apiBaseUrl(),
        getAccessToken: () => authStorage.getToken(),
        onUnauthorized: () => {
          expireSession();
        },
      }),
    [],
  );
  const authApi = useMemo(() => createAuthApi(client), [client]);
  const urlsApi = useMemo(() => createUrlsApi(client), [client]);

  const clearSession = useCallback(() => {
    authStorage.removeToken();
    setSession(null);
  }, []);

  useEffect(() => {
    expireSession = () => {
      clearSession();
      const path = window.location.pathname;
      if (path === "/signin" || path === "/signup") {
        return;
      }
      setSessionNotice("Your session has expired. Please sign in again.");
      void navigate("/signin", { replace: true });
    };
    return () => {
      expireSession = () => undefined;
    };
  }, [clearSession, navigate]);

  useEffect(() => {
    const token = authStorage.getToken();
    if (token === undefined) {
      return;
    }
    let active = true;
    void authApi
      .me()
      .then((user) => {
        if (active) {
          setSession({ token, user });
        }
      })
      .catch(() => {
        if (active) {
          clearSession();
        }
      })
      .finally(() => {
        if (active) {
          setIsLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [authApi, clearSession]);

  const signin = useCallback(
    async (email: string, password: string) => {
      const result = await authApi.signIn(email, password);
      authStorage.setToken(result.accessToken);
      setSession({ token: result.accessToken, user: result.user });
    },
    [authApi],
  );

  const signup = useCallback(
    async (email: string, password: string) => {
      await authApi.signUp(email, password);
    },
    [authApi],
  );

  const logout = useCallback(() => {
    clearSession();
    void navigate("/signin", { replace: true });
  }, [clearSession, navigate]);

  const value = useMemo(
    () => ({
      user: session?.user ?? null,
      token: session?.token ?? null,
      isAuthenticated: session !== null,
      isLoading,
      signin,
      signup,
      logout,
      urlsApi,
    }),
    [session, isLoading, signin, signup, logout, urlsApi],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
