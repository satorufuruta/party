import {
  json,
  errorJson,
  parseRequestBody,
  getSessionStub,
  forwardToDo,
  type Env,
  logInfo,
  logError,
} from "../../_lib";
import { SessionRepository, getDatabase } from "../../../../src/server/db";

interface CreateSessionInput {
  autoProgress?: boolean;
}

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  if (request.method !== "POST") {
    return errorJson(405, "method_not_allowed", "Unsupported method");
  }

  const rawQuizId = params.quizId;
  if (typeof rawQuizId !== "string" || rawQuizId.length === 0) {
    logError(request, "Missing quizId for session creation", { params });
    return errorJson(400, "invalid_path", "quizId is required");
  }
  const quizId = rawQuizId;

  const payload = await parseRequestBody<CreateSessionInput>(request);
  const autoProgress = payload?.autoProgress ?? true;

  logInfo(request, "Creating session", { quizId, autoProgress });

  const db = getDatabase(env);
  const sessionRepo = new SessionRepository(db);

  const sessionId = crypto.randomUUID();
  const nowIso = new Date().toISOString();

  await sessionRepo.create({
    id: sessionId,
    quiz_id: quizId,
    status: "lobby",
    auto_progress: autoProgress ? 1 : 0,
    created_at: nowIso,
    updated_at: nowIso,
  });

  const stub = getSessionStub(env, sessionId);
  const initializeResponse = await forwardToDo(stub, "/initialize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionId, quizId, autoProgress }),
  });

  if (initializeResponse.status >= 400) {
    const message = await initializeResponse.text();
    logError(request, "Durable Object initialization failed", {
      sessionId,
      status: initializeResponse.status,
      message,
    });
    return errorJson(initializeResponse.status, "initialize_failed", message || "Failed to initialize session");
  }

  const responsePayload = {
    sessionId,
    quizId,
    autoProgress,
    status: "lobby",
  };

  logInfo(request, "Session created", responsePayload);
  return json(responsePayload, { status: 201 });
};
