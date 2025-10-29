import { json, errorJson, type Env, logInfo, logError } from "../_lib";
import { UserRepository, getDatabase } from "../../../src/server/db";

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== "GET") {
    return errorJson(405, "method_not_allowed", "Unsupported method");
  }

  logInfo(request, "Fetching user list");

  try {
    const db = getDatabase(env);
    const userRepo = new UserRepository(db);
    const users = await userRepo.list();
    logInfo(request, "User list fetched", { count: users.length });
    return json({ users });
  } catch (error) {
    logError(request, "Failed to fetch user list", { error: error instanceof Error ? error.message : String(error) });
    return errorJson(500, "internal_error", "Failed to fetch user list");
  }
};
