import { json, errorJson, parseRequestBody, type Env } from "../../_lib";
import { UserRepository, getDatabase } from "../../../../src/server/db";

interface RegisterParticipantPayload {
  userId?: string;
  name: string;
  displayName?: string;
}

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  if (request.method !== "POST") {
    return errorJson(405, "method_not_allowed", "Unsupported method");
  }

  const sessionId = params.sessionId;
  if (!sessionId) {
    return errorJson(400, "invalid_path", "sessionId is required");
  }

  const payload = await parseRequestBody<RegisterParticipantPayload>(request);
  if (!payload || !payload.name) {
    return errorJson(400, "validation_failed", "Participant name is required");
  }

  const userId = payload.userId ?? crypto.randomUUID();
  const displayName = payload.displayName ?? payload.name;

  const db = getDatabase(env);
  const userRepo = new UserRepository(db);
  await userRepo.upsert({ id: userId, name: payload.name, display_name: displayName });

  return json({ userId, sessionId, displayName });
};
