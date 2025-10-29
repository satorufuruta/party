import { json, errorJson, type Env, logInfo, logError } from "../_lib";
import { QuizRepository, QuestionRepository, getDatabase } from "../../../src/server/db";

export const onRequest: PagesFunction<Env> = async ({ request, env, params }) => {
  if (request.method !== "GET") {
    return errorJson(405, "method_not_allowed", "Unsupported method");
  }

  const rawQuizId = params.quizId;
  if (typeof rawQuizId !== "string" || rawQuizId.length === 0) {
    logError(request, "Missing quizId parameter", { params });
    return errorJson(400, "invalid_path", "quizId is required");
  }
  const quizId = rawQuizId;

  logInfo(request, "Fetching quiz detail", { quizId });
  const db = getDatabase(env);
  const quizRepo = new QuizRepository(db);
  const questionRepo = new QuestionRepository(db);

  const quiz = await quizRepo.getById(quizId);
  if (!quiz) {
    logError(request, "Quiz not found", { quizId });
    return errorJson(404, "quiz_not_found", "Quiz not found");
  }

  const questions = await questionRepo.listByQuiz(quizId);
  const enriched = await Promise.all(
    questions.map(async (question) => {
      const choices = await questionRepo.getChoices(question.id);
      return {
        id: question.id,
        text: question.text,
        orderIndex: question.order_index,
        timeLimitSec: question.time_limit_sec,
        revealDurationSec: question.reveal_duration_sec,
        pendingResultSec: question.pending_result_sec,
        choices: choices.map((choice) => ({
          id: choice.id,
          text: choice.text,
          isCorrect: choice.is_correct === 1,
        })),
      };
    })
  );

  const responsePayload = {
    quiz: {
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      createdAt: quiz.created_at,
      questions: enriched,
    },
  };

  logInfo(request, "Quiz detail returned", { quizId, questionCount: enriched.length });
  return json(responsePayload);
};
