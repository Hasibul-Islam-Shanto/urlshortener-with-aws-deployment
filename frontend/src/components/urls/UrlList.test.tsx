import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { UrlList } from "./UrlList";
import type { UrlRecord } from "../../types/url";

const shortUrlFor = (shortCode: string) => `https://short.example.com/${shortCode}`;

const record: UrlRecord = {
  shortCode: "a8K2x",
  originalUrl: "https://example.com/some/very/long/path/that/should/truncate",
  createdAt: "2026-09-28T12:00:00.000Z",
};

describe("UrlList", () => {
  it("shows skeleton loading instead of an empty table", () => {
    render(
      <UrlList
        state={{ status: "loading" }}
        shortUrlFor={shortUrlFor}
        onRetry={vi.fn()}
        onCreateFirst={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByRole("status", { name: "Loading your URLs" })).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders shortened URLs without overflowing the record", () => {
    render(
      <UrlList
        state={{ status: "ready", items: [record] }}
        shortUrlFor={shortUrlFor}
        onRetry={vi.fn()}
        onCreateFirst={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("https://short.example.com/a8K2x")).toBeInTheDocument();
    expect(screen.getByText(record.originalUrl)).toHaveClass("truncate");
    expect(screen.getByRole("link", { name: "Open" })).toHaveAttribute(
      "rel",
      "noopener noreferrer",
    );
    expect(screen.getByText("Sep 28, 2026")).toBeInTheDocument();
  });

  it("shows an empty state without a table", async () => {
    const user = userEvent.setup();
    const onCreateFirst = vi.fn();
    render(
      <UrlList
        state={{ status: "ready", items: [] }}
        shortUrlFor={shortUrlFor}
        onRetry={vi.fn()}
        onCreateFirst={onCreateFirst}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByText("No shortened URLs yet")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Shorten a URL" }));
    expect(onCreateFirst).toHaveBeenCalledTimes(1);
  });

  it("shows an error state and retries", async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(
      <UrlList
        state={{ status: "error" }}
        shortUrlFor={shortUrlFor}
        onRetry={onRetry}
        onCreateFirst={vi.fn()}
        onDelete={vi.fn()}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("We couldn't load your URLs.");
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("asks for confirmation before deleting a URL", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn<() => Promise<void>>(() => Promise.resolve());
    const onDeleted = vi.fn();
    render(
      <UrlList
        state={{ status: "ready", items: [record] }}
        shortUrlFor={shortUrlFor}
        onRetry={vi.fn()}
        onCreateFirst={vi.fn()}
        onDelete={onDelete}
        onDeleted={onDeleted}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Delete shortened URL https://short.example.com/a8K2x",
      }),
    );
    expect(
      screen.getByRole("dialog", { name: "Delete shortened URL?" }),
    ).toHaveTextContent("https://short.example.com/a8K2x");

    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onDelete).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", {
        name: "Delete shortened URL https://short.example.com/a8K2x",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDelete).toHaveBeenCalledWith("a8K2x");
    expect(onDeleted).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("keeps the dialog open when deletion fails", async () => {
    const user = userEvent.setup();
    render(
      <UrlList
        state={{ status: "ready", items: [record] }}
        shortUrlFor={shortUrlFor}
        onRetry={vi.fn()}
        onCreateFirst={vi.fn()}
        onDelete={() => Promise.reject(new Error("nope"))}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "Delete shortened URL https://short.example.com/a8K2x",
      }),
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "We couldn't delete this URL. Please try again.",
    );
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
