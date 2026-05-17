/**
 * Extracts a human-readable message from any thrown API error.
 * Handles: Error objects, API response shapes {detail, message}, plain strings.
 */
export function extractApiError(err: unknown, fallback = "Something went wrong"): string {
  if (!err) return fallback;
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message || fallback;
  if (typeof err === "object") {
    const e = err as Record<string, unknown>;
    if (typeof e.message === "string" && e.message) return e.message;
    if (typeof e.detail === "string" && e.detail) return e.detail;
  }
  return fallback;
}
