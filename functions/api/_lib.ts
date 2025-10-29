import type { DatabaseEnv } from "../../src/server/db";

export interface Env extends DatabaseEnv {
  QUIZ_ROOM_DO: DurableObjectNamespace;
  DEFAULT_SESSION_ID?: string;
}

export const json = (data: unknown, init: ResponseInit = {}): Response => {
  const headers = new Headers(init.headers);
  headers.set("content-type", "application/json");
  return new Response(JSON.stringify(data), { ...init, headers });
};

export const errorJson = (status: number, code: string, message: string, details?: unknown): Response =>
  json({ error: { code, message, details } }, { status });

const formatRoute = (request: Request): string => {
  const { method } = request;
  let pathname = "unknown";
  try {
    pathname = new URL(request.url).pathname;
  } catch {
    pathname = request.url;
  }
  return `${method} ${pathname}`;
};

export const logInfo = (request: Request, message: string, details?: unknown): void => {
  const route = formatRoute(request);
  if (typeof details === "undefined") {
    console.log(`[API] ${route} :: ${message}`);
  } else {
    console.log(`[API] ${route} :: ${message}`, details);
  }
};

export const logError = (request: Request, message: string, details?: unknown): void => {
  const route = formatRoute(request);
  if (typeof details === "undefined") {
    console.error(`[API] ${route} :: ${message}`);
  } else {
    console.error(`[API] ${route} :: ${message}`, details);
  }
};

export const parseRequestBody = async <T>(request: Request): Promise<T | null> => {
  try {
    const text = await request.text();
    if (!text) return null;
    return JSON.parse(text) as T;
  } catch {
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
