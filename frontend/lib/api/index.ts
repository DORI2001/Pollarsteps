/**
 * API client barrel. Combines per-domain modules into the `api` facade
 * used by existing call sites: `import { api, session } from "@/lib/api"`.
 */
import { authApi } from "./auth";
import { tripsApi } from "./trips";
import { stepsApi } from "./steps";
import { uploadsApi } from "./uploads";
import { recommendationsApi } from "./recommendations";
import { storiesApi } from "./stories";

export { session } from "./session";
export type { TokenPair, ApiError } from "./client";

export const api = {
  ...authApi,
  ...tripsApi,
  ...stepsApi,
  ...uploadsApi,
  ...recommendationsApi,
  ...storiesApi,
};
