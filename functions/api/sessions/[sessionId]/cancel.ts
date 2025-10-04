import { errorJson, getSessionStub, forwardToDo, type Env } from "../../_lib";

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  if (request.method !== "POST") {
    return errorJson(405, "method_not_allowed", "Unsupported method");
  }

  const sessionId = params.sessionId;
  if (!sessionId) {
    return errorJson(400, "invalid_path", "sessionId is required");
  }

  const stub = getSessionStub(env, sessionId);
  const response = await forwardToDo(stub, "/cancel", { method: "POST" });
  if (response.status >= 400) {
    const body = await response.text();
    return errorJson(response.status, "cancel_failed", body || "Failed to cancel session");
  }

  return new Response(null, { status: 202 });
};
