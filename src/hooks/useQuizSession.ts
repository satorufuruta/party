import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { createQuizSocket, type QuizSocket } from "../lib/realtime";
import type { SocketEvent, QuestionPayload, SessionStatus, ParticipantState, ClientRole } from "../lib/types";

interface SessionState {
  sessionId: string;
  quizId: string;
  status: SessionStatus;
  questionIndex: number;
  questionDeadline: number | null;
  question?: QuestionPayload;
  autoProgress: boolean;
  participants: ParticipantState[];
  summary?: {
    totals: Record<string, number>;
    correctChoiceIds: string[];
  } | null;
  adminSnapshot?: SocketEvent & { type: "admin_session_state" };
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
  autoProgress: true,
  participants: [],
  summary: null,
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
        autoProgress: event.autoProgress,
        participants: event.participants,
        summary: null,
      };
    case "question_start":
      return {
        ...state,
        status: "question",
        questionIndex: event.questionIndex,
        questionDeadline: event.deadline,
        question: event.question,
        summary: null,
      };
    case "question_end":
      return {
        ...state,
        status: "reveal",
      };
    case "question_summary":
      return {
        ...state,
        summary: {
          totals: event.totals,
          correctChoiceIds: event.correctChoiceIds,
        },
      };
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
          lastAnswer: event,
          participants: updatedParticipants,
        };
      }
    case "quiz_finish":
      return {
        ...state,
        status: "finished",
        questionDeadline: null,
      };
    case "admin_session_state":
      return {
        ...state,
        sessionId: event.sessionId,
        quizId: event.quizId,
        status: event.status,
        questionIndex: event.questionIndex,
        questionDeadline: event.questionDeadline,
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
  const socketRef = useRef<QuizSocket | null>(null);
  const lastHeartbeat = useRef<number>(Date.now());

  useEffect(() => {
    dispatch({ type: "reset" });
    setConnected(false);
    setError(null);

    if (!options.sessionId) {
      return;
    }

    if (options.role === "participant" && !options.userId) {
      return;
    }

    const socket = createQuizSocket({
      ...options,
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
  }, [options.sessionId, options.role, options.userId, options.displayName, options.participantKey]);

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
    const remainingMs = state.questionDeadline ? Math.max(0, state.questionDeadline - Date.now()) : null;
    return {
      ...state,
      remainingMs,
    };
  }, [state]);

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
