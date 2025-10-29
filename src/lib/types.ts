export type SessionStatus = "idle" | "lobby" | "question" | "answers_locked" | "reveal" | "finished";

export interface ParticipantAnswer {
  choiceId: string;
  submittedAt: number;
  isCorrect?: boolean;
}

export interface ParticipantState {
  userId: string;
  displayName: string;
  connected: boolean;
  lastSeen: number;
  answers: Record<string, ParticipantAnswer>;
}

export interface QuestionChoice {
  id: string;
  text: string;
}

export interface QuestionPayload {
  id: string;
  text: string;
  choices: QuestionChoice[];
}

export interface SessionSnapshot {
  sessionId: string;
  quizId: string;
  status: SessionStatus;
  questionIndex: number;
  questionDeadline: number | null;
  questionStartedAt?: number | null;
  questionLockedAt?: number | null;
  questionRevealAt?: number | null;
  questionRevealEndsAt?: number | null;
  autoProgress: boolean;
  participants: ParticipantState[];
}

export type SocketEvent =
  | ({ type: "session_ready"; timestamp: number } & SessionSnapshot)
  | {
      type: "question_start";
      sessionId: string;
      timestamp: number;
      questionIndex: number;
      deadline: number | null;
      question: QuestionPayload;
    }
  | {
      type: "question_locked";
      sessionId: string;
      timestamp: number;
      questionIndex: number;
      questionId: string;
      lockedAt: number;
      revealAt: number;
    }
  | {
      type: "question_reveal";
      sessionId: string;
      timestamp: number;
      questionIndex: number;
      questionId: string;
      revealAt: number;
      revealEndsAt: number;
      totals: Record<string, number>;
      correctChoiceIds: string[];
    }
  | {
      type: "answer_result";
      sessionId: string;
      timestamp: number;
      questionIndex: number;
      isCorrect: boolean;
      correctChoiceId: string;
      choiceId: string;
      questionId: string;
      userId: string;
    }
  | {
      type: "answer_received";
      sessionId: string;
      timestamp: number;
      questionIndex: number;
      questionId: string;
      choiceId: string;
      userId: string;
    }
  | {
      type: "quiz_finish";
      sessionId: string;
      timestamp: number;
    }
  | {
      type: "error";
      sessionId: string;
      timestamp: number;
      code: string;
      message: string;
    }
  | {
      type: "admin_session_state";
      sessionId: string;
      timestamp: number;
      status: SessionStatus;
      quizId: string;
      questionIndex: number;
      questionDeadline: number | null;
      questionStartedAt: number | null;
      questionLockedAt: number | null;
      questionRevealAt: number | null;
      questionRevealEndsAt: number | null;
      autoProgress: boolean;
      participants: ParticipantState[];
      pendingResults: Record<
        string,
        {
          questionId: string;
          totals: Record<string, number>;
          correctChoiceIds: string[];
        }
      >;
      questions: Array<{
        id: string;
        orderIndex: number;
        text: string;
        timeLimitSec: number;
        pendingResultSec: number;
        revealDurationSec: number;
        choices: Array<{ id: string; text: string; isCorrect: boolean }>;
      }>;
    };

export type ClientRole = "admin" | "participant";
