import { D1Database } from "./client";
import type { AnswerRecord, ChoiceRecord, QuestionRecord, QuizRecord, SessionRecord, UserRecord } from "./types";

const generatePublicId = (): string => {
  const createFromBytes = (bytes: Uint8Array): string => {
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0"));
    return `${hex.slice(0, 4).join("")}-${hex.slice(4, 6).join("")}-${hex.slice(6, 8).join("")}-${hex
      .slice(8, 10)
      .join("")}-${hex.slice(10).join("")}`;
  };

  if (typeof globalThis.crypto !== "undefined") {
    if (typeof globalThis.crypto.randomUUID === "function") {
      return globalThis.crypto.randomUUID();
    }
    if (typeof globalThis.crypto.getRandomValues === "function") {
      const bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
      return createFromBytes(bytes);
    }
  }

  const fallback = new Uint8Array(16);
  for (let index = 0; index < fallback.length; index += 1) {
    fallback[index] = Math.floor(Math.random() * 256);
  }
  return createFromBytes(fallback);
};

export interface PaginationOptions {
  limit?: number;
  offset?: number;
}

export class UserRepository {
  constructor(private readonly db: D1Database) {}

  async upsert(user: Pick<UserRecord, "id" | "name" | "display_name"> & { public_id?: string }): Promise<void> {
    const publicId = user.public_id ?? generatePublicId();
    await this.db
      .prepare(
        `INSERT INTO users (id, name, display_name, public_id)
         VALUES (?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET name = excluded.name, display_name = excluded.display_name`
      )
      .bind(user.id, user.name, user.display_name, publicId)
      .run();
  }

  async getById(id: string): Promise<UserRecord | null> {
    return await this.db
      .prepare(
        `SELECT id, name, display_name, public_id, created_at, updated_at
         FROM users
         WHERE id = ?`
      )
      .bind(id)
      .first<UserRecord>();
  }

  async list(): Promise<UserRecord[]> {
    const stmt = this.db.prepare(
      `SELECT id, name, display_name, public_id, created_at, updated_at
       FROM users
       ORDER BY created_at ASC`
    );
    const { results } = await stmt.all<UserRecord>();
    return results;
  }

  async getByPublicId(publicId: string): Promise<UserRecord | null> {
    return await this.db
      .prepare(
        `SELECT id, name, display_name, public_id, created_at, updated_at
         FROM users
         WHERE public_id = ?`
      )
      .bind(publicId)
      .first<UserRecord>();
  }

  async findByNameParts(familyName: string, givenName: string): Promise<UserRecord | null> {
    const last = familyName.trim();
    const first = givenName.trim();
    if (!last || !first) return null;

    const displayWithSpace = `${last} ${first}`;
    const displayWithoutSpace = `${last}${first}`;

    return await this.db
      .prepare(
        `SELECT id, name, display_name, public_id, created_at, updated_at
         FROM users
         WHERE display_name IN (?, ?)
            OR name IN (?, ?)
         ORDER BY created_at ASC
         LIMIT 1`
      )
      .bind(displayWithSpace, displayWithoutSpace, displayWithSpace, displayWithoutSpace)
      .first<UserRecord>();
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
        `SELECT id, quiz_id, text, order_index, time_limit_sec, reveal_duration_sec, pending_result_sec, created_at, updated_at
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
        `INSERT INTO questions (id, quiz_id, text, order_index, time_limit_sec, reveal_duration_sec, pending_result_sec, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind(
        record.id,
        record.quiz_id,
        record.text,
        record.order_index,
        record.time_limit_sec,
        record.reveal_duration_sec,
        record.pending_result_sec,
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
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           quiz_id = excluded.quiz_id,
           status = excluded.status,
           auto_progress = excluded.auto_progress,
           updated_at = excluded.updated_at`
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
        `INSERT INTO answers (id, session_id, question_id, user_id, choice_id, submitted_at, elapsed_ms, is_correct)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(session_id, question_id, user_id)
         DO UPDATE SET choice_id = excluded.choice_id, submitted_at = excluded.submitted_at, elapsed_ms = excluded.elapsed_ms, is_correct = excluded.is_correct`
      )
      .bind(
        record.id,
        record.session_id,
        record.question_id,
        record.user_id,
        record.choice_id,
        record.submitted_at,
        record.elapsed_ms,
        record.is_correct
      )
      .run();
  }

  async listBySession(sessionId: string): Promise<AnswerRecord[]> {
    const stmt = this.db
      .prepare(
        `SELECT id, session_id, question_id, user_id, choice_id, submitted_at, elapsed_ms, is_correct
         FROM answers
         WHERE session_id = ?`
      )
      .bind(sessionId);
    const { results } = await stmt.all<AnswerRecord>();
    return results;
  }
}
