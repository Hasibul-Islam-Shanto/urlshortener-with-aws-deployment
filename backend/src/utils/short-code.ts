import { randomInt } from "node:crypto";

export const URL_SAFE_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export const DEFAULT_SHORT_CODE_LENGTH = 7;

/** Returns an integer in the range [0, maxExclusive). */
export type RandomInt = (maxExclusive: number) => number;

export type ShortCodeGenerator = (length: number) => string;

export type ShortCodeGeneratorOptions = {
  readonly randomInt: RandomInt;
  readonly alphabet?: string;
};

export const createShortCodeGenerator =
  ({
    randomInt: nextInt,
    alphabet = URL_SAFE_ALPHABET,
  }: ShortCodeGeneratorOptions): ShortCodeGenerator =>
  (length) => {
    if (!Number.isInteger(length) || length < 1) {
      throw new RangeError(
        `Short code length must be a positive integer, got ${String(length)}`,
      );
    }
    return Array.from({ length }, () => alphabet.charAt(nextInt(alphabet.length))).join(
      "",
    );
  };

export const cryptoShortCodeGenerator: ShortCodeGenerator = createShortCodeGenerator({
  randomInt: (maxExclusive) => randomInt(maxExclusive),
});
