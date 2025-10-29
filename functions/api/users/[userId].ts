import { json, errorJson, type Env, logInfo, logError } from "../_lib";
import { UserRepository, getDatabase } from "../../../src/server/db";

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  if (request.method !== "GET") {
    return errorJson(405, "method_not_allowed", "Unsupported method");
  }

  const rawUserId = params.userId;
  if (typeof rawUserId !== "string" || rawUserId.length === 0) {
    logError(request, "Missing userId parameter", { params });
    return errorJson(400, "invalid_path", "userId is required");
  }
  const userId = rawUserId;

  logInfo(request, "Fetching user detail", { userId });

  try {
    const db = getDatabase(env);
    const userRepo = new UserRepository(db);
    const user = await userRepo.getById(userId);
    if (!user) {
      logError(request, "User not found", { userId });
      return errorJson(404, "user_not_found", "User not found");
    }
    logInfo(request, "User detail returned", { userId });
    return json({ user });
  } catch (error) {
    logError(request, "Failed to fetch user detail", {
      userId,
      error: error instanceof Error ? error.message : String(error),
    });
    return errorJson(500, "internal_error", "Failed to fetch user detail");
  }
};
