import { json, errorJson, type Env } from "../../_lib";
import {
  AnswerRepository,
  QuestionRepository,
  SessionRepository,
  getDatabase,
} from "../../../../src/server/db";

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  if (request.method !== "GET") {
    return errorJson(405, "method_not_allowed", "Unsupported method");
  }

  const sessionId = params.sessionId;
  if (!sessionId) {
    return errorJson(400, "invalid_path", "sessionId is required");
  }

  const db = getDatabase(env);
  const sessionRepo = new SessionRepository(db);
  const session = await sessionRepo.getById(sessionId);
  if (!session) {
    return errorJson(404, "session_not_found", "Session not found");
  }

  const answerRepo = new AnswerRepository(db);
  const answers = await answerRepo.listBySession(sessionId);
  const questionRepo = new QuestionRepository(db);
  const questions = await questionRepo.listByQuiz(session.quiz_id);

  const choiceMap = new Map<string, { questionId: string; isCorrect: boolean }>();
  for (const question of questions) {
    const choices = await questionRepo.getChoices(question.id);
    for (const choice of choices) {
      choiceMap.set(choice.id, { questionId: question.id, isCorrect: choice.is_correct === 1 });
    }
  }

  const participants = new Map<
    string,
    {
      userId: string;
      answers: Array<{
        questionId: string;
        choiceId: string;
        isCorrect: boolean;
        submittedAt: string;
      }>;
      score: number;
    }
  >();

  for (const answer of answers) {
    const data = choiceMap.get(answer.choice_id);
    const isCorrect = data?.isCorrect ?? false;
    const participant = participants.get(answer.user_id) ?? {
      userId: answer.user_id,
      answers: [],
      score: 0,
    };

    participant.answers.push({
      questionId: answer.question_id,
      choiceId: answer.choice_id,
      isCorrect,
      submittedAt: answer.submitted_at,
    });
    participant.score += isCorrect ? 1 : 0;
    participants.set(answer.user_id, participant);
  }

  const participantList = Array.from(participants.values()).sort((a, b) => b.score - a.score);

  return json({
    sessionId,
    summary: {
      totalParticipants: participantList.length,
    },
    participants: participantList,
  });
};
