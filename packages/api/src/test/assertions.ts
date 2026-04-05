const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const expectRecord = (value: unknown): Record<string, unknown> => {
  if (!isRecord(value)) {
    throw new Error("Expected an object response");
  }

  return value;
};

export const expectRecordArray = (
  value: unknown,
): Array<Record<string, unknown>> => {
  if (!Array.isArray(value)) {
    throw new TypeError("Expected an array response");
  }

  return value.map((item) => expectRecord(item));
};

export const expectString = (value: unknown, label: string): string => {
  if (typeof value !== "string") {
    throw new TypeError(`Expected ${label} to be a string`);
  }

  return value;
};

export const expectStringProp = (value: unknown, key: string): string =>
  expectString(expectRecord(value)[key], key);
