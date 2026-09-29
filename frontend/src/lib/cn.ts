export const cn = (...parts: readonly (string | false | undefined)[]): string =>
  parts.filter((part) => part !== undefined && part !== false && part !== "").join(" ");
