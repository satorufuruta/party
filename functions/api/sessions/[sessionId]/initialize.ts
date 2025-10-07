import {
  errorJson,
  parseRequestBody,
  getSessionStub,
  forwardToDo,
  type Env,
  logInfo,
  logError,
} from "../../_lib";

interface InitializePayload {
  quizId: string;
  autoProgress?: boolean;
}

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  if (request.method !== "POST") {
    return errorJson(405, "method_not_allowed", "Unsupported method");
  }

  const rawSessionId = params.sessionId;
  if (typeof rawSessionId !== "string" || rawSessionId.length === 0) {
    logError(request, "Missing sessionId for initialize", { params });
    return errorJson(400, "invalid_path", "sessionId is required");
  }
  const sessionId = rawSessionId;

  const payload = await parseRequestBody<InitializePayload>(request);
  if (!payload?.quizId) {
    logError(request, "Initialization payload missing quizId", { payload });
    return errorJson(400, "validation_failed", "quizId is required");
  }

  logInfo(request, "Initializing session", { sessionId, quizId: payload.quizId, autoProgress: payload.autoProgress });
  const stub = getSessionStub(env, sessionId);
  const response = await forwardToDo(stub, "/initialize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionId, quizId: payload.quizId, autoProgress: payload.autoProgress }),
  });

  if (response.status >= 400) {
    const body = await response.text();
    logError(request, "Initialize request failed", { sessionId, status: response.status, body });
    return errorJson(response.status, "initialize_failed", body || "Failed to initialize session");
  }

  logInfo(request, "Initialize request accepted", { sessionId });
  return new Response(null, { status: 202 });
};
