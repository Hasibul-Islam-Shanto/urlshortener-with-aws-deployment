import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { UrlForm } from "./UrlForm";
import type { CreateUrlResponse } from "../../types/url";

const shortUrlFor = (shortCode: string) => `https://short.example.com/${shortCode}`;

describe("UrlForm", () => {
  it("renders a labeled URL field", () => {
    render(<UrlForm onCreate={vi.fn()} shortUrlFor={shortUrlFor} />);
    expect(screen.getByLabelText("Your long URL")).toBeInTheDocument();
  });

  it("rejects an invalid URL before calling the API", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn();
    render(<UrlForm onCreate={onCreate} shortUrlFor={shortUrlFor} />);
    await user.type(screen.getByLabelText("Your long URL"), "javascript:alert(1)");
    await user.click(screen.getByRole("button", { name: "Shorten URL" }));
    expect(onCreate).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Only http and https URLs are supported.",
    );
  });

  it("submits with the keyboard", async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue({
      shortCode: "a8K2x",
      originalUrl: "https://example.com",
    } satisfies CreateUrlResponse);
    render(<UrlForm onCreate={onCreate} shortUrlFor={shortUrlFor} />);
    await user.type(screen.getByLabelText("Your long URL"), "https://example.com{Enter}");
    expect(onCreate).toHaveBeenCalledWith("https://example.com");
  });

  it("shows a loading state that blocks a second submit", async () => {
    const user = userEvent.setup();
    let resolveCreate: (value: CreateUrlResponse) => void = () => undefined;
    const onCreate = vi.fn(
      () =>
        new Promise<CreateUrlResponse>((resolve) => {
          resolveCreate = resolve;
        }),
    );
    render(<UrlForm onCreate={onCreate} shortUrlFor={shortUrlFor} />);
    await user.type(screen.getByLabelText("Your long URL"), "https://example.com");
    await user.click(screen.getByRole("button", { name: "Shorten URL" }));
    const pending = screen.getByRole("button", { name: "Creating..." });
    expect(pending).toBeDisabled();
    await user.click(pending);
    expect(onCreate).toHaveBeenCalledTimes(1);
    resolveCreate({ shortCode: "a8K2x", originalUrl: "https://example.com" });
    expect(
      await screen.findByText("https://short.example.com/a8K2x"),
    ).toBeInTheDocument();
  });

  it("shows the shortened URL after a successful create", async () => {
    const user = userEvent.setup();
    render(
      <UrlForm
        onCreate={vi.fn().mockResolvedValue({
          shortCode: "a8K2x",
          originalUrl: "https://example.com/some/very/long/path",
        })}
        shortUrlFor={shortUrlFor}
      />,
    );
    await user.type(
      screen.getByLabelText("Your long URL"),
      "https://example.com/some/very/long/path",
    );
    await user.click(screen.getByRole("button", { name: "Shorten URL" }));
    expect(
      await screen.findByText("https://short.example.com/a8K2x"),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Your long URL")).toHaveValue("");
  });

  it("shows a useful message when creation fails", async () => {
    const user = userEvent.setup();
    render(
      <UrlForm
        onCreate={vi.fn().mockRejectedValue(new Error("DynamoDB exploded"))}
        shortUrlFor={shortUrlFor}
      />,
    );
    await user.type(screen.getByLabelText("Your long URL"), "https://example.com");
    await user.click(screen.getByRole("button", { name: "Shorten URL" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "We couldn't create the short URL. Please check the URL and try again.",
    );
    expect(screen.queryByText(/DynamoDB/)).not.toBeInTheDocument();
  });
});
