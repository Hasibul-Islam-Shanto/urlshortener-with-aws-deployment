import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppRouter } from "../../app/router";
import { ToastProvider } from "../../components/ui/Toast";
import { AuthProvider } from "../../features/auth/AuthProvider";
import { authStorage } from "../../features/auth/authStorage";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

const requestUrl = (input: RequestInfo | URL): string => {
  if (typeof input === "string") {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  return input.url;
};

const user = { userId: "user-1", email: "user@example.com" };

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  );

describe("authenticated routes", () => {
  afterEach(() => {
    localStorage.clear();
    vi.unstubAllGlobals();
  });

  it("sends an unauthenticated visitor from the dashboard to sign in", async () => {
    vi.stubGlobal("fetch", vi.fn());
    renderAt("/dashboard");
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(authStorage.getToken()).toBeUndefined();
  });

  it("restores the session and logs out", async () => {
    authStorage.setToken("access-token");
    const fetchFn = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = requestUrl(input);
      if (url.endsWith("/auth/me")) {
        return Promise.resolve(json(200, { user }));
      }
      if (
        url.endsWith("/urls") &&
        (init?.method === undefined || init.method === "GET")
      ) {
        return Promise.resolve(json(200, { count: 0, items: [] }));
      }
      return Promise.resolve(json(500, {}));
    });
    vi.stubGlobal("fetch", fetchFn);

    const userEvents = userEvent.setup();
    renderAt("/dashboard");
    expect(
      await screen.findByRole("button", { name: "Account menu for user@example.com" }),
    ).toBeInTheDocument();
    await userEvents.click(
      screen.getByRole("button", { name: "Account menu for user@example.com" }),
    );
    await userEvents.click(screen.getByRole("menuitem", { name: "Logout" }));
    expect(await screen.findByRole("heading", { name: "Sign in" })).toBeInTheDocument();
    expect(authStorage.getToken()).toBeUndefined();
  });

  it("clears an expired session and asks the user to sign in again", async () => {
    authStorage.setToken("expired-token");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(json(401, { message: "Authentication required" })),
    );
    renderAt("/dashboard");
    expect(
      await screen.findByText("Your session has expired. Please sign in again."),
    ).toBeInTheDocument();
    expect(authStorage.getToken()).toBeUndefined();
  });

  it("creates and deletes a URL for the signed-in user", async () => {
    authStorage.setToken("access-token");
    const items: {
      shortCode: string;
      originalUrl: string;
      createdAt: string;
    }[] = [];
    const fetchFn = vi.fn((input: RequestInfo | URL, init?: RequestInit) => {
      const url = requestUrl(input);
      const method = init?.method ?? "GET";
      if (url.endsWith("/auth/me")) {
        return Promise.resolve(json(200, { user }));
      }
      if (url.endsWith("/urls") && method === "GET") {
        return Promise.resolve(json(200, { count: items.length, items }));
      }
      if (url.endsWith("/urls") && method === "POST") {
        items.push({
          shortCode: "code1",
          originalUrl: "https://example.com",
          createdAt: "2026-09-28T12:00:00.000Z",
        });
        return Promise.resolve(
          json(201, { shortCode: "code1", originalUrl: "https://example.com" }),
        );
      }
      if (method === "DELETE") {
        items.splice(0, items.length);
        return Promise.resolve(new Response(null, { status: 204 }));
      }
      return Promise.resolve(json(500, {}));
    });
    vi.stubGlobal("fetch", fetchFn);

    const userEvents = userEvent.setup();
    renderAt("/dashboard");
    expect(await screen.findByText("No shortened URLs yet")).toBeInTheDocument();
    await userEvents.type(screen.getByLabelText("Your long URL"), "https://example.com");
    await userEvents.click(screen.getByRole("button", { name: "Shorten URL" }));
    expect(await screen.findAllByText("https://api.example.com/code1")).not.toHaveLength(
      0,
    );
    await userEvents.click(
      screen.getByRole("button", {
        name: "Delete shortened URL https://api.example.com/code1",
      }),
    );
    await userEvents.click(screen.getByRole("button", { name: "Delete" }));
    expect(await screen.findByText("No shortened URLs yet")).toBeInTheDocument();
  });
});
