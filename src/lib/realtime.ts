import type { ClientRole, SocketEvent } from "./types";

export interface QuizSocketOptions {
  sessionId: string;
  role: ClientRole;
  userId?: string;
  displayName?: string;
  participantKey?: string;
  workerUrl?: string;
  autoReconnect?: boolean;
  onEvent?: (event: SocketEvent) => void;
  onError?: (error: Event) => void;
  onOpen?: () => void;
  onClose?: () => void;
}

export interface QuizSocket {
  submitAnswer: (questionId: string, choiceId: string) => void;
  requestSync: () => void;
  sendAdminAction: (action: string, payload?: Record<string, unknown>) => void;
  sendHeartbeat: (stateSignature?: string) => void;
  close: () => void;
  isConnected: () => boolean;
}

const getWorkerBaseUrl = () => {
  if (typeof window === "undefined") {
    return "";
  }
  return window.location.origin;
};

export const createQuizSocket = (options: QuizSocketOptions): QuizSocket | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const baseUrl = options.workerUrl ?? getWorkerBaseUrl();
  const resolvedBase = baseUrl || window.location.origin;
  const wsUrl = new URL(`/ws/sessions/${options.sessionId}`, resolvedBase);
  if (wsUrl.protocol === "http:") {
    wsUrl.protocol = "ws:";
  } else if (wsUrl.protocol === "https:") {
    wsUrl.protocol = "wss:";
  }
  wsUrl.searchParams.set("role", options.role);
  if (options.userId) wsUrl.searchParams.set("userId", options.userId);
  if (options.displayName) wsUrl.searchParams.set("displayName", options.displayName);
  if (options.participantKey) wsUrl.searchParams.set("participantKey", options.participantKey);

  let socket = new WebSocket(wsUrl);
  let closedByUser = false;
  let reconnectAttempts = 0;
  const autoReconnect = options.autoReconnect ?? true;

  const setupSocket = () => {
    socket.addEventListener("open", () => {
      reconnectAttempts = 0;
      options.onOpen?.();
      const joinPayload = {
        type: "join_session",
        sessionId: options.sessionId,
        role: options.role,
        userId: options.userId,
        displayName: options.displayName,
        participantKey: options.participantKey,
      };
      socket.send(JSON.stringify(joinPayload));
    });

    socket.addEventListener("message", (event) => {
      try {
        const data = JSON.parse(event.data as string) as SocketEvent;
        options.onEvent?.(data);
      } catch (error) {
        console.error("Failed to parse socket event", error);
      }
    });

    socket.addEventListener("error", (error) => {
      options.onError?.(error);
    });

    socket.addEventListener("close", () => {
      options.onClose?.();
      if (!closedByUser && autoReconnect) {
        reconnectAttempts += 1;
        const delay = Math.min(5000, 500 * reconnectAttempts);
        setTimeout(() => {
          socket = new WebSocket(wsUrl);
          setupSocket();
        }, delay);
      }
    });
  };

  setupSocket();

  const send = (payload: Record<string, unknown>) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(payload));
    }
  };

  return {
    submitAnswer: (questionId, choiceId) => {
      send({ type: "submit_answer", questionId, choiceId });
    },
    requestSync: () => {
      send({ type: "request_sync" });
    },
    sendHeartbeat: (stateSignature) => {
      const payload: Record<string, unknown> = { type: "heartbeat" };
      if (stateSignature) {
        payload.stateSignature = stateSignature;
      }
      send(payload);
    },
    sendAdminAction: (action, payload = {}) => {
      send({ type: "admin_control", action, ...payload });
    },
    close: () => {
      closedByUser = true;
      socket.close();
    },
    isConnected: () => socket.readyState === WebSocket.OPEN,
  };
};
