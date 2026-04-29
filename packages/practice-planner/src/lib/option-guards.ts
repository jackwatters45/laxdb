export const isOneOf = <T extends string>(
  values: readonly T[],
  value: string | null | undefined,
): value is T =>
  value !== null &&
  value !== undefined &&
  values.some((candidate) => candidate === value);

export const isOptionValue = <T extends string>(
  options: readonly { value: T }[],
  value: string | null | undefined,
): value is T =>
  value !== null &&
  value !== undefined &&
  options.some((option) => option.value === value);
