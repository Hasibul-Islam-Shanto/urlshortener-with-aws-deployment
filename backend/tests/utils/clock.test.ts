import { describe, expect, it } from "vitest";

import { fixedClock, systemClock } from "../../src/utils/clock.js";

describe("clock", () => {
  it("fixedClock always returns the same instant", () => {
    const clock = fixedClock("2026-09-27T16:00:00.000Z");
    expect(clock().toISOString()).toBe("2026-09-27T16:00:00.000Z");
    expect(clock().getTime()).toBe(clock().getTime());
  });

  it("fixedClock returns a fresh Date each call", () => {
    const clock = fixedClock("2026-09-27T16:00:00.000Z");
    expect(clock()).not.toBe(clock());
  });

  it("systemClock returns a Date", () => {
    expect(systemClock()).toBeInstanceOf(Date);
  });
});
