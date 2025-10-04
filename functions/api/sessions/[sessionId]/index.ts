import { json, errorJson, getSessionStub, forwardToDo, type Env } from "../../_lib";

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  if (request.method !== "GET") {
    return errorJson(405, "method_not_allowed", "Unsupported method");
  }

  const sessionId = params.sessionId;
  if (!sessionId) {
    return errorJson(400, "invalid_path", "sessionId is required");
  }

  const stub = getSessionStub(env, sessionId);
  const response = await forwardToDo(stub, "/state", { method: "GET" });
  if (response.status >= 400) {
    const body = await response.text();
    return errorJson(response.status, "state_unavailable", body || "Unable to fetch session state");
  }

  const data = await response.json();
  return json({ session: data });
};
