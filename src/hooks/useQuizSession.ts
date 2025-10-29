import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createQuizSocket, type QuizSocket } from "../lib/realtime";
import type { SocketEvent, QuestionPayload, SessionStatus, ParticipantState, ClientRole } from "../lib/types";

interface SessionState {
  sessionId: string;
  quizId: string;
  status: SessionStatus;
  questionIndex: number;
  questionDeadline: number | null;
  questionStartedAt: number | null;
  questionLockedAt: number | null;
  questionRevealAt: number | null;
  questionRevealEndsAt: number | null;
  question?: QuestionPayload;
  autoProgress: boolean;
  participants: ParticipantState[];
  summary?: {
    totals: Record<string, number>;
    correctChoiceIds: string[];
  } | null;
  adminSnapshot?: SocketEvent & { type: "admin_session_state" };
  lastAnswerAck?: SocketEvent & { type: "answer_received" } | null;
  lastAnswer?: SocketEvent & { type: "answer_result" } | null;
}

interface Action {
  type: "reset" | "event";
  payload?: SocketEvent;
}

const initialState: SessionState = {
  sessionId: "",
  quizId: "",
  status: "idle",
  questionIndex: -1,
  questionDeadline: null,
  questionStartedAt: null,
  questionLockedAt: null,
  questionRevealAt: null,
  questionRevealEndsAt: null,
  autoProgress: true,
  participants: [],
  summary: null,
  lastAnswerAck: null,
  lastAnswer: null,
};

const reducer = (state: SessionState, action: Action): SessionState => {
  if (action.type === "reset") {
    return { ...initialState };
  }

  const event = action.payload;
  if (!event) return state;

  switch (event.type) {
    case "session_ready":
      return {
        ...state,
        sessionId: event.sessionId,
        quizId: event.quizId,
        status: event.status,
        questionIndex: event.questionIndex,
        questionDeadline: event.questionDeadline,
        questionStartedAt: event.questionStartedAt ?? null,
        questionLockedAt: event.questionLockedAt ?? null,
        questionRevealAt: event.questionRevealAt ?? null,
        questionRevealEndsAt: event.questionRevealEndsAt ?? null,
        autoProgress: event.autoProgress,
        participants: event.participants,
        summary: null,
        lastAnswerAck: null,
        lastAnswer: null,
      };
    case "question_start":
      return {
        ...state,
        status: "question",
        questionIndex: event.questionIndex,
        questionDeadline: event.deadline,
        questionStartedAt: event.timestamp,
        questionLockedAt: null,
        questionRevealAt: null,
        questionRevealEndsAt: null,
        question: event.question,
        summary: null,
        lastAnswerAck: null,
        lastAnswer: null,
      };
    case "question_locked":
      return {
        ...state,
        status: "answers_locked",
        questionDeadline: null,
        questionLockedAt: event.lockedAt,
        questionRevealAt: event.revealAt,
        questionRevealEndsAt: null,
      };
    case "question_reveal":
      return {
        ...state,
        status: "reveal",
        questionLockedAt: state.questionLockedAt ?? event.revealAt,
        questionRevealAt: event.revealAt,
        questionRevealEndsAt: event.revealEndsAt,
        summary: {
          totals: event.totals,
          correctChoiceIds: event.correctChoiceIds,
        },
      };
    case "answer_received": {
      let found = false;
      const participants = state.participants.map((participant) => {
        if (participant.userId !== event.userId) {
          return participant;
        }
        found = true;
        const previous = participant.answers[event.questionId];
        const answers = {
          ...participant.answers,
          [event.questionId]: {
            choiceId: event.choiceId,
            submittedAt: event.timestamp,
            isCorrect: previous?.isCorrect,
          },
        };
        return {
          ...participant,
          answers,
          lastSeen: event.timestamp,
        };
      });

      const updatedParticipants = found
        ? participants
        : [
            ...participants,
            {
              userId: event.userId,
              displayName: event.userId,
              connected: true,
              lastSeen: event.timestamp,
              answers: {
                [event.questionId]: {
                  choiceId: event.choiceId,
                  submittedAt: event.timestamp,
                  isCorrect: undefined,
                },
              },
            },
          ];

      return {
        ...state,
        lastAnswerAck: event,
        participants: updatedParticipants,
      };
    }
    case "answer_result":
      {
        let found = false;
        const participants = state.participants.map((participant) => {
          if (participant.userId !== event.userId) {
            return participant;
          }
          found = true;
          const answers = {
            ...participant.answers,
            [event.questionId]: {
              choiceId: event.choiceId,
              submittedAt: event.timestamp,
              isCorrect: event.isCorrect,
            },
          };
          return {
            ...participant,
            answers,
            lastSeen: event.timestamp,
          };
        });

        const updatedParticipants = found
          ? participants
          : [
              ...participants,
              {
                userId: event.userId,
                displayName: event.userId,
                connected: true,
                lastSeen: event.timestamp,
                answers: {
                  [event.questionId]: {
                    choiceId: event.choiceId,
                    submittedAt: event.timestamp,
                    isCorrect: event.isCorrect,
                  },
                },
              },
          ];

        return {
          ...state,
          lastAnswerAck: null,
          lastAnswer: event,
          participants: updatedParticipants,
        };
      }
    case "quiz_finish":
      return {
        ...state,
        status: "finished",
        questionDeadline: null,
        questionStartedAt: null,
        questionLockedAt: null,
        questionRevealAt: null,
        questionRevealEndsAt: null,
      };
    case "admin_session_state":
      return {
        ...state,
        sessionId: event.sessionId,
        quizId: event.quizId,
        status: event.status,
        questionIndex: event.questionIndex,
        questionDeadline: event.questionDeadline,
        questionStartedAt: event.questionStartedAt ?? null,
        questionLockedAt: event.questionLockedAt ?? null,
        questionRevealAt: event.questionRevealAt ?? null,
        questionRevealEndsAt: event.questionRevealEndsAt ?? null,
        autoProgress: event.autoProgress,
        participants: event.participants,
        adminSnapshot: event,
      };
    default:
      return state;
  }
};

export interface UseQuizSessionOptions {
  sessionId: string;
  role: ClientRole;
  userId?: string;
  displayName?: string;
  participantKey?: string;
}

export const useQuizSession = (options: UseQuizSessionOptions) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const socketRef = useRef<QuizSocket | null>(null);
  const lastHeartbeat = useRef<number>(Date.now());
  const { sessionId, role, userId, displayName, participantKey } = options;

  useEffect(() => {
    dispatch({ type: "reset" });
    setConnected(false);
    setError(null);

    if (!sessionId) {
      return;
    }

    if (role === "participant" && !userId) {
      return;
    }

    const socket = createQuizSocket({
      sessionId,
      role,
      userId,
      displayName,
      participantKey,
      onOpen: () => {
        setConnected(true);
        setError(null);
      },
      onClose: () => {
        setConnected(false);
      },
      onError: () => {
        setError("リアルタイム接続で問題が発生しました");
      },
      onEvent: (event) => {
        lastHeartbeat.current = Date.now();
        dispatch({ type: "event", payload: event });
      },
    });

    socketRef.current = socket;

    return () => {
      socket?.close();
      socketRef.current = null;
    };
  }, [sessionId, role, userId, displayName, participantKey]);

  useEffect(() => {
    const target =
      state.status === "question"
        ? state.questionDeadline
        : state.status === "answers_locked"
          ? state.questionRevealAt
          : state.status === "reveal"
            ? state.questionRevealEndsAt
            : null;

    if (!target) {
      return;
    }

    setTick(0);

    const interval = setInterval(() => {
      setTick((prev) => prev + 1);
    }, 200);

    return () => clearInterval(interval);
  }, [state.status, state.questionDeadline, state.questionRevealAt, state.questionRevealEndsAt]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!socketRef.current) return;
      if (Date.now() - lastHeartbeat.current > 15000) {
        socketRef.current.requestSync();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const submitAnswer = useCallback((questionId: string, choiceId: string) => {
    socketRef.current?.submitAnswer(questionId, choiceId);
  }, []);

  const sendAdminAction = useCallback(
    (action: string, payload?: Record<string, unknown>) => {
      socketRef.current?.sendAdminAction(action, payload);
    },
    []
  );

  const requestSync = useCallback(() => {
    socketRef.current?.requestSync();
  }, []);

  const isConnected = useCallback(() => socketRef.current?.isConnected() ?? false, []);

  const derived = useMemo(() => {
    const countdownTarget =
      state.status === "question"
        ? state.questionDeadline
        : state.status === "answers_locked"
          ? state.questionRevealAt
          : state.status === "reveal"
            ? state.questionRevealEndsAt
            : null;
    const remainingMs = countdownTarget ? Math.max(0, countdownTarget - Date.now()) : null;
    const remainingSeconds = remainingMs === null ? null : Math.max(0, Math.ceil(remainingMs / 1000));
    return {
      ...state,
      remainingMs,
      remainingSeconds,
      countdownTarget,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, tick]);

  return {
    state: derived,
    submitAnswer,
    sendAdminAction,
    requestSync,
    isConnected,
    connected,
    error,
  };
};
