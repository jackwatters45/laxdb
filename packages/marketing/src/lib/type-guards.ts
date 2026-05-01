export const isOneOf = <T extends string>(values: readonly T[], value: string): value is T =>
  values.some((candidate) => candidate === value);
