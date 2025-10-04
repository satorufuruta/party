import { errorJson, parseRequestBody, getSessionStub, forwardToDo, type Env } from "../../_lib";

interface InitializePayload {
  quizId: string;
  autoProgress?: boolean;
}

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  if (request.method !== "POST") {
    return errorJson(405, "method_not_allowed", "Unsupported method");
  }

  const sessionId = params.sessionId;
  if (!sessionId) {
    return errorJson(400, "invalid_path", "sessionId is required");
  }

  const payload = await parseRequestBody<InitializePayload>(request);
  if (!payload?.quizId) {
    return errorJson(400, "validation_failed", "quizId is required");
  }

  const stub = getSessionStub(env, sessionId);
  const response = await forwardToDo(stub, "/initialize", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ sessionId, quizId: payload.quizId, autoProgress: payload.autoProgress }),
  });

  if (response.status >= 400) {
    const body = await response.text();
    return errorJson(response.status, "initialize_failed", body || "Failed to initialize session");
  }

  return new Response(null, { status: 202 });
};
