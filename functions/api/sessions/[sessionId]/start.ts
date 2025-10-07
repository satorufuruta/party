import {
  errorJson,
  getSessionStub,
  forwardToDo,
  type Env,
  logInfo,
  logError,
} from "../../_lib";

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  if (request.method !== "POST") {
    return errorJson(405, "method_not_allowed", "Unsupported method");
  }

  const rawSessionId = params.sessionId;
  if (typeof rawSessionId !== "string" || rawSessionId.length === 0) {
    logError(request, "Missing sessionId for start", { params });
    return errorJson(400, "invalid_path", "sessionId is required");
  }
  const sessionId = rawSessionId;

  logInfo(request, "Start session invoked", { sessionId });
  const stub = getSessionStub(env, sessionId);
  const response = await forwardToDo(stub, "/start", { method: "POST" });
  if (response.status >= 400) {
    const body = await response.text();
    logError(request, "Start session failed", { sessionId, status: response.status, body });
    return errorJson(response.status, "start_failed", body || "Failed to start session");
  }

  logInfo(request, "Start session acknowledged", { sessionId });
  return new Response(null, { status: 202 });
};
