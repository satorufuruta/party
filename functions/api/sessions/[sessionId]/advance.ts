import {
  errorJson,
  parseRequestBody,
  getSessionStub,
  forwardToDo,
  type Env,
  logInfo,
  logError,
} from "../../_lib";

interface AdvancePayload {
  action?: "next" | "skip" | "forceEnd";
  questionIndex?: number;
}

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  if (request.method !== "POST") {
    return errorJson(405, "method_not_allowed", "Unsupported method");
  }

  const rawSessionId = params.sessionId;
  if (typeof rawSessionId !== "string" || rawSessionId.length === 0) {
    logError(request, "Missing sessionId for advance", { params });
    return errorJson(400, "invalid_path", "sessionId is required");
  }
  const sessionId = rawSessionId;

  const payload = await parseRequestBody<AdvancePayload>(request);
  logInfo(request, "Advancing session", { sessionId, payload });
  const stub = getSessionStub(env, sessionId);
  const response = await forwardToDo(stub, "/advance", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  });

  if (response.status >= 400) {
    const body = await response.text();
    logError(request, "Advance request failed", { sessionId, status: response.status, body });
    return errorJson(response.status, "advance_failed", body || "Failed to advance session");
  }

  logInfo(request, "Advance request accepted", { sessionId });
  return new Response(null, { status: 202 });
};
