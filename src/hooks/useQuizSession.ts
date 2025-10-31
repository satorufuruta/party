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
    case "sync_ack":
      return state;
    default:
      return state;
  }
};

const serializeParticipantAnswers = (answers: ParticipantState["answers"] | undefined): Array<[string, string, number, number | null]> => {
  if (!answers) return [];
  return Object.entries(answers)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([questionId, answer]) => [
      questionId,
      answer.choiceId,
      answer.submittedAt,
      answer.isCorrect === undefined ? null : answer.isCorrect ? 1 : 0,
    ]);
};

const participantStateSignature = (participant: ParticipantState | undefined): string => {
  if (!participant) {
    return "missing";
  }
  return JSON.stringify([
    participant.userId,
    participant.connected ? 1 : 0,
    serializeParticipantAnswers(participant.answers),
  ]);
};

const summarySignature = (
  summary: SessionState["summary"]
): string => {
  if (!summary) return "";
  const totals = Object.entries(summary.totals)
    .sort(([a], [b]) => a.localeCompare(b));
  const correct = [...summary.correctChoiceIds].sort();
  return JSON.stringify([totals, correct]);
};

const buildStateSignature = (role: ClientRole, state: SessionState, userId?: string): string => {
  const parts: Array<string | number | null | boolean> = [
    role,
    state.status,
    state.questionIndex,
    state.questionDeadline ?? null,
    state.questionStartedAt ?? null,
    state.questionLockedAt ?? null,
    state.questionRevealAt ?? null,
    state.questionRevealEndsAt ?? null,
    state.autoProgress,
  ];

  if (role === "participant") {
    parts.push(participantStateSignature(userId ? state.participants.find((participant) => participant.userId === userId) : undefined));
  } else if (role === "admin") {
    const participantsDigest = state.participants
      .map(participantStateSignature)
      .sort()
      .join("|");
    parts.push(participantsDigest);
    parts.push(summarySignature(state.summary ?? null));
  }

  return JSON.stringify(parts);
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
  const lastEventAtRef = useRef<number>(Date.now());
  const lastHeartbeatSentAtRef = useRef<number>(0);
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
        lastEventAtRef.current = Date.now();
        lastHeartbeatSentAtRef.current = 0;
      },
      onClose: () => {
        setConnected(false);
        lastHeartbeatSentAtRef.current = 0;
      },
      onError: () => {
        setError("リアルタイム接続で問題が発生しました");
      },
      onEvent: (event) => {
        lastEventAtRef.current = Date.now();
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

  const stateSignature = useMemo(() => buildStateSignature(role, state, userId), [role, state, userId]);
  const stateSignatureRef = useRef(stateSignature);
  useEffect(() => {
    stateSignatureRef.current = stateSignature;
  }, [stateSignature]);

  useEffect(() => {
    const interval = setInterval(() => {
      const socket = socketRef.current;
      if (!socket) return;
      const nowTs = Date.now();
      if (nowTs - lastEventAtRef.current <= 15000) {
        return;
      }
      if (nowTs - lastHeartbeatSentAtRef.current < 5000) {
        return;
      }
      socket.sendHeartbeat(stateSignatureRef.current);
      lastHeartbeatSentAtRef.current = nowTs;
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
