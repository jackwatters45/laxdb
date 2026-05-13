const PERSISTED_ID_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
const PERSISTED_ID_LENGTH = 12;

/** Create a client-side id that satisfies core's NanoidSchema. */
export function createPersistedId(): string {
  const bytes = new Uint8Array(PERSISTED_ID_LENGTH);
  crypto.getRandomValues(bytes);

  return Array.from(bytes, (byte) => {
    const index = byte & 63;
    return PERSISTED_ID_ALPHABET[index] ?? "A";
  }).join("");
}

/** Create an id for UI-only entities that are never persisted directly. */
export function createTransientId(prefix: string): string {
  return `${prefix}-${crypto.randomUUID()}`;
}
