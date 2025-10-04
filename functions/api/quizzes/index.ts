import { json, errorJson, parseRequestBody, type Env } from "../_lib";
import {
  QuizRepository,
  QuestionRepository,
  type QuizRecord,
  type QuestionRecord,
  type ChoiceRecord,
  getDatabase,
} from "../../../src/server/db";

interface CreateChoiceInput {
  text: string;
  isCorrect?: boolean;
}

interface CreateQuestionInput {
  text: string;
  timeLimitSec: number;
  choices: CreateChoiceInput[];
}

interface CreateQuizInput {
  title: string;
  description?: string;
  questions: CreateQuestionInput[];
}

export const onRequest: PagesFunction<Env> = async ({ request, env }) => {
  const db = getDatabase(env);
  const quizRepo = new QuizRepository(db);
  const questionRepo = new QuestionRepository(db);

  if (request.method === "GET") {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") ?? "20");
    const offset = Number(url.searchParams.get("offset") ?? "0");
    const quizzes = await quizRepo.list({ limit, offset });
    return json({ quizzes, pagination: { limit, offset } });
  }

  if (request.method === "POST") {
    const payload = await parseRequestBody<CreateQuizInput>(request);
    if (!payload) {
      return errorJson(400, "invalid_payload", "Body must be valid JSON");
    }

    if (!payload.title || !Array.isArray(payload.questions) || payload.questions.length === 0) {
      return errorJson(400, "validation_failed", "Quiz title and at least one question are required");
    }

    const nowIso = new Date().toISOString();
    const quizId = crypto.randomUUID();
    const quizRecord: QuizRecord = {
      id: quizId,
      title: payload.title,
      description: payload.description ?? null,
      created_at: nowIso,
      updated_at: nowIso,
    };

    await quizRepo.create(quizRecord);

    for (let index = 0; index < payload.questions.length; index += 1) {
      const questionInput = payload.questions[index];
      if (!questionInput.text || !Array.isArray(questionInput.choices) || questionInput.choices.length === 0) {
        return errorJson(400, "validation_failed", "Each question must have text and choices");
      }

      const questionId = crypto.randomUUID();
      const questionRecord: QuestionRecord = {
        id: questionId,
        quiz_id: quizId,
        text: questionInput.text,
        order_index: index,
        time_limit_sec: Math.max(0, questionInput.timeLimitSec ?? 0),
        created_at: nowIso,
        updated_at: nowIso,
      };

      const choices: ChoiceRecord[] = questionInput.choices.map((choice) => ({
        id: crypto.randomUUID(),
        question_id: questionId,
        text: choice.text,
        is_correct: choice.isCorrect ? 1 : 0,
        created_at: nowIso,
        updated_at: nowIso,
      }));

      await questionRepo.createQuestion(questionRecord, choices);
    }

    return json({ id: quizId, title: quizRecord.title }, { status: 201 });
  }

  return errorJson(405, "method_not_allowed", "Unsupported method");
};
