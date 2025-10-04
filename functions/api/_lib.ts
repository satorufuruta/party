import type { DatabaseEnv } from "../../src/server/db";

export interface Env extends DatabaseEnv {
  QUIZ_ROOM_DO: DurableObjectNamespace;
}

export const json = (data: unknown, init: ResponseInit = {}): Response => {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  return new Response(JSON.stringify(data), { ...init, headers });
};

export const errorJson = (status: number, code: string, message: string, details?: unknown): Response =>
  json({ error: { code, message, details } }, { status });

export const parseRequestBody = async <T>(request: Request): Promise<T | null> => {
  try {
    const text = await request.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch (error) {
    return null;
  }
};

export const getSessionStub = (env: Env, sessionId: string): DurableObjectStub => {
  const id = env.QUIZ_ROOM_DO.idFromName(sessionId);
  return env.QUIZ_ROOM_DO.get(id);
};

export const forwardToDo = async (
  stub: DurableObjectStub,
  path: string,
  init: RequestInit = {}
): Promise<Response> => {
  const url = new URL(path, "https://do.internal");
  return await stub.fetch(url.toString(), init);
};

export interface PagesContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}
