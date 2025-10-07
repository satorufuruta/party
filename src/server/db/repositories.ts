import { D1Database } from "./client";
import type {
  AnswerRecord,
  ChoiceRecord,
  QuestionRecord,
  QuizRecord,
  SessionRecord,
  UserRecord,
} from "./types";

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export class UserRepository {
  constructor(private readonly db: D1Database) {}

  async upsert(user: Pick<UserRecord, "id" | "name" | "display_name">): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO users (id, name, display_name)
         VALUES (?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, display_name = excluded.display_name`
      )
      .bind(user.id, user.name, user.display_name)
      .run();
  }
}

export class QuizRepository {
  constructor(private readonly db: D1Database) {}

  async list(options: PaginationOptions = {}): Promise<QuizRecord[]> {
    const limit = options.limit ?? 20;
    const offset = options.offset ?? 0;
    const stmt = this.db
      .prepare(
        `SELECT id, title, description, created_at, updated_at
         FROM quizzes
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      )
      .bind(limit, offset);
    const { results } = await stmt.all<QuizRecord>();
    return results;
  }

  async getById(id: string): Promise<QuizRecord | null> {
    return await this.db
      .prepare(
        `SELECT id, title, description, created_at, updated_at
         FROM quizzes
         WHERE id = ?`
      )
      .bind(id)
      .first<QuizRecord>();
  }

  async create(record: QuizRecord): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO quizzes (id, title, description, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?)`
      )
      .bind(
        record.id,
        record.title,
        record.description,
        record.created_at,
        record.updated_at
      )
      .run();
  }
}

export class QuestionRepository {
  constructor(private readonly db: D1Database) {}

  async listByQuiz(quizId: string): Promise<QuestionRecord[]> {
    const stmt = this.db
      .prepare(
        `SELECT id, quiz_id, text, order_index, time_limit_sec, reveal_duration_sec, created_at, updated_at
         FROM questions
         WHERE quiz_id = ?
         ORDER BY order_index ASC`
      )
      .bind(quizId);
    const { results } = await stmt.all<QuestionRecord>();
    return results;
  }

  async getChoices(questionId: string): Promise<ChoiceRecord[]> {
    const stmt = this.db
      .prepare(
        `SELECT id, question_id, text, is_correct, created_at, updated_at
         FROM choices
         WHERE question_id = ?
         ORDER BY id`
      )
      .bind(questionId);
    const { results } = await stmt.all<ChoiceRecord>();
    return results;
  }

  async createQuestion(record: QuestionRecord, choices: ChoiceRecord[]): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO questions (id, quiz_id, text, order_index, time_limit_sec, reveal_duration_sec, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        record.id,
        record.quiz_id,
        record.text,
        record.order_index,
        record.time_limit_sec,
        record.reveal_duration_sec,
        record.created_at,
        record.updated_at
      )
      .run();

    for (const choice of choices) {
      await this.db
        .prepare(
          `INSERT INTO choices (id, question_id, text, is_correct, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?)`
        )
        .bind(
          choice.id,
          choice.question_id,
          choice.text,
          choice.is_correct,
          choice.created_at,
          choice.updated_at
        )
        .run();
    }
  }
}

export class SessionRepository {
  constructor(private readonly db: D1Database) {}

  async create(record: SessionRecord): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO sessions (id, quiz_id, status, auto_progress, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?)`
      )
      .bind(
        record.id,
        record.quiz_id,
        record.status,
        record.auto_progress,
        record.created_at,
        record.updated_at
      )
      .run();
  }

  async updateStatus(sessionId: string, status: string, autoProgress: 0 | 1): Promise<void> {
    await this.db
      .prepare(
        `UPDATE sessions
         SET status = ?, auto_progress = ?, updated_at = ?
         WHERE id = ?`
      )
      .bind(status, autoProgress, new Date().toISOString(), sessionId)
      .run();
  }

  async getById(sessionId: string): Promise<SessionRecord | null> {
    return await this.db
      .prepare(
        `SELECT id, quiz_id, status, auto_progress, created_at, updated_at
         FROM sessions
         WHERE id = ?`
      )
      .bind(sessionId)
      .first<SessionRecord>();
  }
}

export class AnswerRepository {
  constructor(private readonly db: D1Database) {}

  async recordAnswer(record: AnswerRecord): Promise<void> {
    await this.db
      .prepare(
        `INSERT INTO answers (id, session_id, question_id, user_id, choice_id, submitted_at)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(session_id, question_id, user_id)
         DO UPDATE SET choice_id = excluded.choice_id, submitted_at = excluded.submitted_at`
      )
      .bind(
        record.id,
        record.session_id,
        record.question_id,
        record.user_id,
        record.choice_id,
        record.submitted_at
      )
      .run();
  }

  async listBySession(sessionId: string): Promise<AnswerRecord[]> {
    const stmt = this.db
      .prepare(
        `SELECT id, session_id, question_id, user_id, choice_id, submitted_at
         FROM answers
         WHERE session_id = ?`
      )
      .bind(sessionId);
    const { results } = await stmt.all<AnswerRecord>();
    return results;
  }
}
