import type { SessionSnapshot } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE?.replace(/\/$/, "") ?? "";

const resolveApiUrl = (path: string): string => {
  if (/^https?:\/\//.test(path)) {
    return path;
  }
  if (!API_BASE) {
    return path;
  }
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
};

export class ApiError extends Error {
  status: number;
  code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
  }
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (typeof init.body === "string" && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const response = await fetch(resolveApiUrl(path), {
    ...init,
    headers,
    credentials: init.credentials ?? "include",
  });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    let code: string | undefined;
    try {
      const data = (await response.clone().json()) as { error?: { message?: string; code?: string } };
      message = data.error?.message ?? message;
      code = data.error?.code ?? code;
    } catch {
      const text = await response.clone().text();
      if (text) message = text;
    }
    console.error("[apiFetch] Request failed", { path, status: response.status, code, message });
    throw new ApiError(message, response.status, code);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentLength = response.headers.get("content-length");
  if (contentLength === "0") {
    return undefined as T;
  }

  const responseText = await response.text();
  if (!responseText) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json") || contentType.includes("+json")) {
    return JSON.parse(responseText) as T;
  }

  return responseText as unknown as T;
}

export interface QuizSummary {
  id: string;
  title: string;
  description: string | null;
  created_at?: string;
  questionCount?: number;
}

export interface QuizDetail extends QuizSummary {
  questions: Array<{
    id: string;
    text: string;
    orderIndex: number;
    timeLimitSec: number;
    revealDurationSec: number;
    pendingResultSec: number;
    choices: Array<{ id: string; text: string; isCorrect: boolean }>;
  }>;
}

export const fetchQuizzes = async (): Promise<QuizSummary[]> => {
  const data = await apiFetch<{ quizzes: QuizSummary[] }>("/api/quizzes");
  return data.quizzes;
};

export const fetchQuizDetail = async (quizId: string): Promise<QuizDetail> => {
  const data = await apiFetch<{ quiz: QuizDetail }>(`/api/quizzes/${quizId}`);
  return data.quiz;
};

export interface UserRecord {
  id: string;
  name: string;
  display_name: string | null;
  public_id: string;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  displayName: string;
  publicId: string;
  createdAt: string;
  updatedAt: string;
}

const mapUserRecord = (user: UserRecord): UserProfile => ({
  id: user.id,
  name: user.name,
  displayName: user.display_name ?? user.name,
  publicId: user.public_id,
  createdAt: user.created_at,
  updatedAt: user.updated_at,
});

export const fetchUsers = async (): Promise<UserProfile[]> => {
  const data = await apiFetch<{ users: UserRecord[] }>("/api/users");
  return data.users.map(mapUserRecord);
};

export const fetchCurrentUser = async (): Promise<UserProfile> => {
  const data = await apiFetch<{ user: UserRecord }>("/quiz/api/users/me");
  return mapUserRecord(data.user);
};

export const fetchUser = async (userId: string): Promise<UserProfile> => {
  const data = await apiFetch<{ user: UserRecord }>(`/api/users/${userId}`);
  return mapUserRecord(data.user);
};

export const identifyParticipant = async (familyName: string, givenName: string): Promise<UserProfile> => {
  const data = await apiFetch<{ user: UserRecord }>("/quiz/api/users/identify", {
    method: "POST",
    body: JSON.stringify({ familyName, givenName }),
  });
  return mapUserRecord(data.user);
};

export const createSession = async (
  quizId: string,
  options: { autoProgress?: boolean; sessionId?: string } = {}
): Promise<{ sessionId: string; quizId: string; autoProgress: boolean; status: string }> => {
  return await apiFetch(`/api/quizzes/${quizId}/sessions`, {
    method: "POST",
    body: JSON.stringify(options),
  });
};

export const initializeSession = async (sessionId: string, quizId: string): Promise<void> => {
  await apiFetch(`/api/sessions/${sessionId}/initialize`, {
    method: "POST",
    body: JSON.stringify({ quizId }),
  });
};

export const startSession = async (sessionId: string): Promise<void> => {
  await apiFetch(`/api/sessions/${sessionId}/start`, { method: "POST" });
};

export const advanceSession = async (
  sessionId: string,
  payload: { action?: "next" | "skip" | "forceEnd"; questionIndex?: number } = {}
): Promise<void> => {
  await apiFetch(`/api/sessions/${sessionId}/advance`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export const cancelSession = async (sessionId: string): Promise<void> => {
  await apiFetch(`/api/sessions/${sessionId}/cancel`, { method: "POST" });
};

export const fetchSessionState = async (
  sessionId: string
): Promise<{ session: SessionSnapshot }> => {
  return await apiFetch(`/api/sessions/${sessionId}`);
};
