import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "../../services/api/errors";
import { SignInForm } from "./SignInForm";

const renderForm = (onSubmit = vi.fn()) => {
  render(
    <MemoryRouter>
      <SignInForm onSubmit={onSubmit} />
    </MemoryRouter>,
  );
  return onSubmit;
};

describe("SignInForm", () => {
  it("requires an email and password", async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm();
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Email is required")).toBeInTheDocument();
    expect(screen.getByText("Password is required")).toBeInTheDocument();
  });

  it("shows a loading state and signs in", async () => {
    const user = userEvent.setup();
    let resolveSignIn: () => void = () => undefined;
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSignIn = resolve;
        }),
    );
    renderForm(onSubmit);
    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "StrongPassword123!");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(screen.getByRole("button", { name: "Signing in..." })).toBeDisabled();
    expect(onSubmit).toHaveBeenCalledWith("user@example.com", "StrongPassword123!");
    resolveSignIn();
  });

  it("shows a generic error for a rejected sign-in", async () => {
    const user = userEvent.setup();
    const onSubmit = vi
      .fn()
      .mockRejectedValue(new ApiError(401, "Authentication required"));
    renderForm(onSubmit);
    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "StrongPassword123!");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password",
    );
  });

  it("links to sign up", () => {
    renderForm();
    expect(screen.getByRole("link", { name: "Sign up" })).toHaveAttribute(
      "href",
      "/signup",
    );
  });
});
