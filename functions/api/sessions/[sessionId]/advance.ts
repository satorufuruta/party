import { errorJson, parseRequestBody, getSessionStub, forwardToDo, type Env } from "../../_lib";

interface AdvancePayload {
  action?: "next" | "skip" | "forceEnd";
  questionIndex?: number;
}

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  if (request.method !== "POST") {
    return errorJson(405, "method_not_allowed", "Unsupported method");
  }

  const sessionId = params.sessionId;
  if (!sessionId) {
    return errorJson(400, "invalid_path", "sessionId is required");
  }

  const payload = await parseRequestBody<AdvancePayload>(request);
  const stub = getSessionStub(env, sessionId);
  const response = await forwardToDo(stub, "/advance", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload ?? {}),
  });

  if (response.status >= 400) {
    const body = await response.text();
    return errorJson(response.status, "advance_failed", body || "Failed to advance session");
  }

  return new Response(null, { status: 202 });
};
