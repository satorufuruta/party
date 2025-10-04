import type { SessionSnapshot } from "./types";

const defaultHeaders = { "content-type": "application/json" } as const;

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...defaultHeaders,
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const data = await response.clone().json();
      message = data?.error?.message ?? message;
    } catch {
      const text = await response.clone().text();
      if (text) message = text;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
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

export const createSession = async (
  quizId: string,
  options: { autoProgress?: boolean } = {}
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

export const registerParticipant = async (
  sessionId: string,
  payload: { userId?: string; name: string; displayName?: string }
): Promise<{ userId: string; sessionId: string; displayName: string }> => {
  return await apiFetch(`/api/sessions/${sessionId}/participants`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
};

export interface SessionResults {
  sessionId: string;
  summary: {
    totalParticipants: number;
  };
  participants: Array<{
    userId: string;
    score: number;
    answers: Array<{
      questionId: string;
      choiceId: string;
      isCorrect: boolean;
      submittedAt: string;
    }>;
  }>;
}

export const fetchSessionResults = async (sessionId: string): Promise<SessionResults> => {
  return await apiFetch(`/api/sessions/${sessionId}/results`);
};
