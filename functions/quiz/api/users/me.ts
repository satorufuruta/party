import { getQuizUserCookie, uuidPattern } from "../../../_cookies";
import { json, errorJson, type Env, logError, logInfo } from "../../../api/_lib";
import { UserRepository, getDatabase } from "../../../../src/server/db";

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== "GET") {
    return errorJson(405, "method_not_allowed", "Unsupported method");
  }

  const cookiePublicId = getQuizUserCookie(request);
  if (!cookiePublicId) {
    logError(request, "Missing quiz_user cookie");
    return errorJson(401, "unauthorized", "quiz_user cookie is required");
  }

  if (!uuidPattern.test(cookiePublicId)) {
    logError(request, "Invalid quiz_user cookie format", { cookiePublicId });
    return errorJson(400, "invalid_cookie", "quiz_user cookie is invalid");
  }

  try {
    const db = getDatabase(env);
    const userRepo = new UserRepository(db);
    const user = await userRepo.getByPublicId(cookiePublicId);
    if (!user) {
      logError(request, "User not found for quiz_user cookie", {
        publicId: cookiePublicId,
      });
      return errorJson(404, "user_not_found", "User not found");
    }

    logInfo(request, "Resolved user from quiz_user cookie", {
      userId: user.id,
      publicId: user.public_id,
    });
    const response = json({ user });
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    logError(request, "Failed to resolve quiz_user cookie", {
      publicId: cookiePublicId,
      error: error instanceof Error ? error.message : String(error),
    });
    return errorJson(500, "internal_error", "Failed to resolve quiz_user cookie");
  }
};
