import { json, errorJson, type Env, logInfo, logError } from "../../_lib";
import { AnswerRepository, SessionRepository, getDatabase } from "../../../../src/server/db";

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  if (request.method !== "GET") {
    return errorJson(405, "method_not_allowed", "Unsupported method");
  }

  const rawSessionId = params.sessionId;
  if (typeof rawSessionId !== "string" || rawSessionId.length === 0) {
    logError(request, "Missing sessionId for results", { params });
    return errorJson(400, "invalid_path", "sessionId is required");
  }
  const sessionId = rawSessionId;

  logInfo(request, "Fetching session results", { sessionId });
  const db = getDatabase(env);
  const sessionRepo = new SessionRepository(db);
  const session = await sessionRepo.getById(sessionId);
  if (!session) {
    logError(request, "Session not found for results", { sessionId });
    return errorJson(404, "session_not_found", "Session not found");
  }

  const answerRepo = new AnswerRepository(db);
  const answers = await answerRepo.listBySession(sessionId);
  const participants = new Map<
    string,
    {
      userId: string;
      answers: Array<{
        questionId: string;
        choiceId: string;
        isCorrect: boolean;
        submittedAt: string;
        elapsedMs: number;
      }>;
      score: number;
      totalElapsedMs: number;
    }
  >();

  for (const answer of answers) {
    const isCorrect = answer.is_correct === 1;
    const rawElapsed = Number(answer.elapsed_ms ?? 0);
    const elapsedMs = Number.isFinite(rawElapsed) ? Math.max(0, Math.floor(rawElapsed)) : 0;
    const participant = participants.get(answer.user_id) ?? {
      userId: answer.user_id,
      answers: [],
      score: 0,
      totalElapsedMs: 0,
    };

    participant.answers.push({
      questionId: answer.question_id,
      choiceId: answer.choice_id,
      isCorrect,
      submittedAt: answer.submitted_at,
      elapsedMs,
    });
    participant.score += isCorrect ? 1 : 0;
    participant.totalElapsedMs += elapsedMs;
    participants.set(answer.user_id, participant);
  }

  const participantList = Array.from(participants.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.totalElapsedMs !== b.totalElapsedMs) return a.totalElapsedMs - b.totalElapsedMs;
    return a.userId.localeCompare(b.userId);
  });

  const responsePayload = {
    sessionId,
    summary: {
      totalParticipants: participantList.length,
    },
    participants: participantList,
  };

  logInfo(request, "Session results returned", {
    sessionId,
    participantCount: participantList.length,
  });
  return json(responsePayload);
};
