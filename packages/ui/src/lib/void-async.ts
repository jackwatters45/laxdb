export const voidAsync =
  <TArgs extends readonly unknown[]>(fn: (...args: TArgs) => Promise<unknown> | unknown) =>
  (...args: TArgs): void => {
    void fn(...args);
  };
