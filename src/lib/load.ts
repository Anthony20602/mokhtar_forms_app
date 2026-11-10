import "server-only";
import { describeDbError } from "./db";

/**
 * Runs a page's data loading and, when the database is unreachable, returns a
 * message to show instead of crashing into a blank error page.
 */
export async function load<T>(
  fn: () => Promise<T>,
): Promise<{ data: T; error: null } | { data: null; error: string }> {
  try {
    return { data: await fn(), error: null };
  } catch (err) {
    const message = describeDbError(err);
    if (!message) throw err;
    return { data: null, error: message };
  }
}
