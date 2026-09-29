import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CopyButton } from "./CopyButton";
import { copyText } from "../../features/urls/format";

describe("copyText", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns true when the clipboard write succeeds", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    await expect(copyText("https://short.example.com/a8K2x")).resolves.toBe(true);
    expect(writeText).toHaveBeenCalledWith("https://short.example.com/a8K2x");
  });

  it("returns false when the clipboard write fails", async () => {
    vi.stubGlobal("navigator", {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    await expect(copyText("https://short.example.com/a8K2x")).resolves.toBe(false);
  });
});

describe("CopyButton", () => {
  it("shows Copied and then returns to Copy", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
    render(
      <CopyButton
        value="https://short.example.com/a8K2x"
        label="Copy shortened URL"
        resetAfterMs={20}
      />,
    );
    const button = screen.getByRole("button", { name: "Copy shortened URL" });
    await user.click(button);
    expect(button).toHaveTextContent("Copied");
    await waitFor(() => {
      expect(button).toHaveTextContent("Copy");
    });
  });

  it("explains how to copy manually when the clipboard fails", async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    render(
      <CopyButton value="https://short.example.com/a8K2x" label="Copy shortened URL" />,
    );
    await user.click(screen.getByRole("button", { name: "Copy shortened URL" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to copy automatically. Please copy the URL manually.",
    );
  });
});
