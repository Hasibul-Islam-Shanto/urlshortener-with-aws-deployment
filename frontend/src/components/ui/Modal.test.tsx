import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";

import { Modal } from "./Modal";

const ModalHarness = ({ onClose }: { onClose: () => void }) => {
  const [open, setOpen] = useState(true);
  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
      >
        Open dialog
      </button>
      <Modal
        open={open}
        title="Delete shortened URL?"
        onClose={() => {
          setOpen(false);
          onClose();
        }}
      >
        <button type="button">Cancel</button>
        <button type="button">Delete</button>
      </Modal>
    </>
  );
};

describe("Modal", () => {
  it("closes on Escape and returns focus to the trigger", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    render(<ModalHarness onClose={onClose} />);
    const dialog = screen.getByRole("dialog", { name: "Delete shortened URL?" });
    expect(dialog).toHaveAttribute("data-state", "open");
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
