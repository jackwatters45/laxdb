import { disposeTestDatabase, ensureTestDatabase } from "./db";

export async function setup() {
  await ensureTestDatabase();
  return async () => {
    await disposeTestDatabase();
  };
}
