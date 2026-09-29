import { describe, expect, it } from "vitest";

import {
  createShortCodeGenerator,
  cryptoShortCodeGenerator,
  URL_SAFE_ALPHABET,
} from "../../src/utils/short-code.js";

const urlSafePattern = /^[A-Za-z0-9]+$/;

describe("createShortCodeGenerator", () => {
  it("is deterministic when randomness is injected", () => {
    const generate = createShortCodeGenerator({ randomInt: () => 0 });
    expect(generate(6)).toBe("AAAAAA");
  });

  it("maps random indexes onto the alphabet", () => {
    const indexes = [0, 1, 2, 61];
    let call = 0;
    const generate = createShortCodeGenerator({
      randomInt: () => indexes[call++] ?? 0,
    });
    expect(generate(4)).toBe("ABC9");
  });

  it("passes the alphabet size as the exclusive upper bound", () => {
    const bounds: number[] = [];
    const generate = createShortCodeGenerator({
      randomInt: (max) => {
        bounds.push(max);
        return 0;
      },
    });
    generate(3);
    expect(bounds).toEqual([
      URL_SAFE_ALPHABET.length,
      URL_SAFE_ALPHABET.length,
      URL_SAFE_ALPHABET.length,
    ]);
  });

  it("supports a custom alphabet", () => {
    const generate = createShortCodeGenerator({ randomInt: () => 1, alphabet: "xy" });
    expect(generate(3)).toBe("yyy");
  });

  it.each([0, -1, 2.5, Number.NaN])("throws for invalid length %s", (length) => {
    const generate = createShortCodeGenerator({ randomInt: () => 0 });
    expect(() => generate(length)).toThrow(RangeError);
  });
});

describe("cryptoShortCodeGenerator", () => {
  it.each([1, 6, 10, 32])("produces URL-safe codes of length %s", (length) => {
    const code = cryptoShortCodeGenerator(length);
    expect(code).toHaveLength(length);
    expect(code).toMatch(urlSafePattern);
  });

  it("produces varied codes", () => {
    const codes = new Set(Array.from({ length: 100 }, () => cryptoShortCodeGenerator(8)));
    expect(codes.size).toBe(100);
  });
});
