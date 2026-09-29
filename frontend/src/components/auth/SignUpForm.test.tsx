import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

import { ApiError } from "../../services/api/errors";
import { SignUpForm } from "./SignUpForm";

const renderForm = (onSubmit = vi.fn()) => {
  render(
    <MemoryRouter>
      <SignUpForm onSubmit={onSubmit} />
    </MemoryRouter>,
  );
  return onSubmit;
};

describe("SignUpForm", () => {
  it("rejects a short password and a mismatched confirmation", async () => {
    const user = userEvent.setup();
    const onSubmit = renderForm();
    await user.type(screen.getByLabelText("Email"), "not-an-email");
    await user.type(screen.getByLabelText("Password"), "short");
    await user.type(screen.getByLabelText("Confirm password"), "other");
    await user.click(screen.getByRole("button", { name: "Sign up" }));
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    expect(screen.getByText("Password is too short")).toBeInTheDocument();
    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();
  });

  it("submits a valid account", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    renderForm(onSubmit);
    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "StrongPassword123!");
    await user.type(screen.getByLabelText("Confirm password"), "StrongPassword123!");
    await user.click(screen.getByRole("button", { name: "Sign up" }));
    expect(onSubmit).toHaveBeenCalledWith("user@example.com", "StrongPassword123!");
  });

  it("shows when the email is already registered", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new ApiError(409, "Conflict"));
    renderForm(onSubmit);
    await user.type(screen.getByLabelText("Email"), "user@example.com");
    await user.type(screen.getByLabelText("Password"), "StrongPassword123!");
    await user.type(screen.getByLabelText("Confirm password"), "StrongPassword123!");
    await user.click(screen.getByRole("button", { name: "Sign up" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email already registered",
    );
  });
});
