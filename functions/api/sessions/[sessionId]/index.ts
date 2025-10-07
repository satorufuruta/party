import {
  json,
  errorJson,
  getSessionStub,
  forwardToDo,
  type Env,
  logInfo,
  logError,
} from "../../_lib";

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  if (request.method !== "GET") {
    return errorJson(405, "method_not_allowed", "Unsupported method");
  }

  const rawSessionId = params.sessionId;
  if (typeof rawSessionId !== "string" || rawSessionId.length === 0) {
    logError(request, "Missing sessionId for state fetch", { params });
    return errorJson(400, "invalid_path", "sessionId is required");
  }
  const sessionId = rawSessionId;

  logInfo(request, "Fetching session state", { sessionId });
  const stub = getSessionStub(env, sessionId);
  const response = await forwardToDo(stub, "/state", { method: "GET" });
  if (response.status >= 400) {
    const body = await response.text();
    logError(request, "Session state fetch failed", { sessionId, status: response.status, body });
    return errorJson(response.status, "state_unavailable", body || "Unable to fetch session state");
  }

  const data = await response.json();
  logInfo(request, "Session state fetched", { sessionId });
  return json({ session: data });
};
