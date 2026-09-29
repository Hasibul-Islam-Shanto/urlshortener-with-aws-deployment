export type Clock = () => Date;

export const systemClock: Clock = () => new Date();

export const fixedClock =
  (isoTimestamp: string): Clock =>
  () =>
    new Date(isoTimestamp);
