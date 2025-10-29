import { buildQuizUserCookie } from "../../../_cookies";
import { json, errorJson, type Env, logError, logInfo, parseRequestBody } from "../../../api/_lib";
import { UserRepository, getDatabase } from "../../../../src/server/db";

interface IdentifyRequest {
  familyName: string;
  givenName: string;
}

const normalizeInput = (value: unknown): string => {
  if (typeof value !== "string") return "";
  return value.trim();
};

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  if (request.method !== "POST") {
    return errorJson(405, "method_not_allowed", "Unsupported method");
  }

  const payload = await parseRequestBody<IdentifyRequest>(request);
  const familyName = normalizeInput(payload?.familyName);
  const givenName = normalizeInput(payload?.givenName);

  if (!familyName || !givenName) {
    logError(request, "Invalid identify payload", { payload });
    return errorJson(400, "validation_failed", "familyName and givenName are required");
  }

  try {
    const db = getDatabase(env);
    const userRepo = new UserRepository(db);
    const user = await userRepo.findByNameParts(familyName, givenName);
    if (!user) {
      logError(request, "User not found for provided names", { familyName, givenName });
      return errorJson(404, "user_not_found", "参加者が見つかりませんでした");
    }

    logInfo(request, "Identified user by names", { userId: user.id, publicId: user.public_id });
    const response = json({ user });
    response.headers.append("Set-Cookie", buildQuizUserCookie(user.public_id));
    response.headers.set("Cache-Control", "no-store");
    return response;
  } catch (error) {
    logError(request, "Failed to identify user", {
      familyName,
      givenName,
      error: error instanceof Error ? error.message : String(error),
    });
    return errorJson(500, "internal_error", "内部エラーが発生しました");
  }
};
