// Durable Object and Worker entry point for the Party quiz application.
// Provides WebSocket scaffolding aligned with quiz-state-protocol.md and
// placeholder HTTP handlers for session control commands.

import { AnswerRepository, QuestionRepository, getDatabase, type DatabaseEnv } from "../src/server/db";
import { onRequest as quizzesIndexHandler } from "../functions/api/quizzes/index";
import { onRequest as quizDetailHandler } from "../functions/api/quizzes/[quizId]";
import { onRequest as quizSessionHandler } from "../functions/api/quizzes/[quizId]/sessions";
import { onRequest as usersIndexHandler } from "../functions/api/users/index";
import { onRequest as userDetailHandler } from "../functions/api/users/[userId]";
import { onRequest as quizInviteHandler } from "../functions/quiz/[publicId]";
import { onRequest as quizCurrentUserHandler } from "../functions/quiz/api/users/me";
import { onRequest as quizIdentifyHandler } from "../functions/quiz/api/users/identify";

interface Env extends DatabaseEnv {
  QUIZ_ROOM_DO: DurableObjectNamespace;
}

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.headers.get("Upgrade") === "websocket" && url.pathname.startsWith("/ws/sessions/")) {
      return handleSessionWebSocket(request, env);
    }

    if (url.pathname.startsWith("/api/quizzes")) {
      const response = await handleQuizRoutes(request, env, url);
      if (response) {
        return response;
      }
    }

    if (url.pathname.startsWith("/api/users")) {
      const response = await handleUserRoutes(request, env, url);
      if (response) {
        return response;
      }
    }

    if (url.pathname.startsWith("/quiz/api/")) {
      const response = await handleParticipantApi(request, env, url);
      if (response) {
        return response;
      }
    }

    const inviteMatch = url.pathname.match(/^\/quiz\/([0-9a-f-]{8}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{4}-[0-9a-f-]{12})$/i);
    if (inviteMatch) {
      const publicId = inviteMatch[1];
      return await invokePagesFunction(quizInviteHandler, request, env, { publicId });
    }

    if (url.pathname === "/healthz") {
      const response = new Response("ok", { status: 200 });
      return response;
    }

    if (url.pathname.startsWith("/api/sessions/")) {
      return await handleSessionApi(request, env);
    }

    return new Response("Not Found", { status: 404 });
  },
};

export default worker;

type PagesContext = Parameters<PagesFunction<Env>>[0];

const invokePagesFunction = async (
  handler: (context: PagesContext) => Response | Promise<Response>,
  request: Request,
  env: Env,
  params: Record<string, string>
): Promise<Response> => {
  const context = {
    request,
    env,
    params,
    functionPath: "",
    waitUntil: (promise: Promise<unknown>) => {
      void promise;
    },
    passThroughOnException: () => {},
    next: async () => new Response("Not Found", { status: 404 }),
    data: {},
  } as PagesContext;
  return await handler(context);
};

const normalizePathname = (pathname: string): string => {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "");
};

const handleQuizRoutes = async (request: Request, env: Env, url: URL): Promise<Response | null> => {
  const pathname = normalizePathname(url.pathname);

  if (pathname === "/api/quizzes") {
    return await invokePagesFunction(quizzesIndexHandler, request, env, {});
  }

  const sessionMatch = pathname.match(/^\/api\/quizzes\/([^/]+)\/sessions$/);
  if (sessionMatch) {
    const quizId = decodeURIComponent(sessionMatch[1]);
    return await invokePagesFunction(quizSessionHandler, request, env, { quizId });
  }

  const detailMatch = pathname.match(/^\/api\/quizzes\/([^/]+)$/);
  if (detailMatch) {
    const quizId = decodeURIComponent(detailMatch[1]);
    return await invokePagesFunction(quizDetailHandler, request, env, { quizId });
  }

  return null;
};

const handleUserRoutes = async (request: Request, env: Env, url: URL): Promise<Response | null> => {
  const pathname = normalizePathname(url.pathname);

  if (pathname === "/api/users") {
    return await invokePagesFunction(usersIndexHandler, request, env, {});
  }

  const detailMatch = pathname.match(/^\/api\/users\/([^/]+)$/);
  if (detailMatch) {
    const userId = decodeURIComponent(detailMatch[1]);
    return await invokePagesFunction(userDetailHandler, request, env, { userId });
  }

  return null;
};

const handleParticipantApi = async (request: Request, env: Env, url: URL): Promise<Response | null> => {
  const pathname = normalizePathname(url.pathname);

  if (pathname === "/quiz/api/users/me") {
    return await invokePagesFunction(quizCurrentUserHandler, request, env, {});
  }

  if (pathname === "/quiz/api/users/identify") {
    return await invokePagesFunction(quizIdentifyHandler, request, env, {});
  }

  return null;
};

async function handleSessionApi(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  // Expected pattern: /api/sessions/:sessionId/(start|advance|cancel|state)
  if (segments.length < 3) {
    return new Response(JSON.stringify({ error: { code: "invalid_path", message: "Missing session segment" } }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  const sessionId = segments[2];
  const action = segments[3] ?? "state";
  const stub = getSessionStub(env, sessionId);

  const requestInit: RequestInit = {
    method: request.method,
    headers: request.headers,
    body: request.body,
  };

  const targetUrl = new URL(url.toString());
  targetUrl.pathname = `/${action}`;

  return await stub.fetch(targetUrl.toString(), requestInit);
}

const getSessionStub = (env: Env, sessionId: string): DurableObjectStub => {
  const id = env.QUIZ_ROOM_DO.idFromName(sessionId);
  return env.QUIZ_ROOM_DO.get(id);
};

const normalizeAnswerSnapshot = (answer: ParticipantAnswerSnapshot): void => {
  if (typeof answer.elapsedMs !== "number" || !Number.isFinite(answer.elapsedMs)) {
    answer.elapsedMs = 0;
  }
  if (answer.elapsedMs < 0) {
    answer.elapsedMs = 0;
  }
};

const recalculateParticipantTotals = (participant: ParticipantStateSnapshot): void => {
  participant.answers ??= {};
  let score = 0;
  let totalElapsedMs = 0;
  for (const answer of Object.values(participant.answers)) {
    if (!answer) {
      continue;
    }
    normalizeAnswerSnapshot(answer);
    if (answer.isCorrect) {
      score += 1;
    }
    totalElapsedMs += answer.elapsedMs ?? 0;
  }
  participant.score = score;
  participant.totalElapsedMs = totalElapsedMs;
};

async function handleSessionWebSocket(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const segments = url.pathname.split("/").filter(Boolean);
  // Expected: /ws/sessions/:sessionId
  if (segments.length < 3) {
    return new Response("Missing session id", { status: 400 });
  }

  const sessionId = segments[2];
  const stub = getSessionStub(env, sessionId);
  const forwardUrl = new URL(`/ws/${sessionId}${url.search}`, "https://do.internal");
  const forwarded = new Request(forwardUrl.toString(), request);
  return await stub.fetch(forwarded);
}

type SessionStatus = "idle" | "lobby" | "question" | "answers_locked" | "reveal" | "finished";

type ClientRole = "participant" | "admin";

interface ParticipantAnswerSnapshot {
  choiceId: string;
  submittedAt: number;
  isCorrect?: boolean;
  elapsedMs?: number;
}

interface ParticipantStateSnapshot {
  userId: string;
  displayName: string;
  connected: boolean;
  lastSeen: number;
  answers: Record<string, ParticipantAnswerSnapshot>;
  score: number;
  totalElapsedMs: number;
}

interface AnswerSummarySnapshot {
  questionId: string;
  totals: Record<string, number>;
  correctChoiceIds: string[];
}

interface QuestionChoiceSnapshot {
  id: string;
  text: string;
  isCorrect: boolean;
}

interface QuestionContent {
  id: string;
  orderIndex: number;
  text: string;
  timeLimitSec: number;
  revealDurationSec: number;
  pendingResultSec: number;
  choices: QuestionChoiceSnapshot[];
}

interface SessionSnapshot {
  sessionId: string;
  quizId: string;
  status: SessionStatus;
  questionIndex: number;
  currentQuestionId: string | null;
  questionStartedAt: number | null;
  questionDeadline: number | null;
  questionLockedAt: number | null;
  questionRevealAt: number | null;
  questionRevealEndsAt: number | null;
  autoProgress: boolean;
  participants: Record<string, ParticipantStateSnapshot>;
  pendingResults: Record<string, AnswerSummarySnapshot>;
}

interface ConnectionContext {
  id: string;
  socket: WebSocket;
  role?: ClientRole;
  userId?: string;
}

interface JoinSessionMessage {
  type: "join_session";
  sessionId: string;
  role: ClientRole;
  userId?: string;
  displayName?: string;
  participantKey?: string;
}

interface RequestSyncMessage {
  type: "request_sync";
}

interface SubmitAnswerMessage {
  type: "submit_answer";
  questionId: string;
  choiceId: string;
}

interface HeartbeatMessage {
  type: "heartbeat";
  lastEventId?: string;
  stateSignature?: string;
}

interface AdminControlMessage {
  type: "admin_control";
  action: "startQuiz" | "forceEndQuestion" | "skipToQuestion" | string;
  questionIndex?: number;
}

type ClientMessage =
  | JoinSessionMessage
  | RequestSyncMessage
  | SubmitAnswerMessage
  | HeartbeatMessage
  | AdminControlMessage;

interface SessionReadyPayload {
  status: SessionStatus;
  quizId: string;
  questionIndex: number;
  questionDeadline: number | null;
  questionStartedAt: number | null;
  questionLockedAt: number | null;
  questionRevealAt: number | null;
  questionRevealEndsAt: number | null;
  autoProgress: boolean;
  participants: ParticipantStateSnapshot[];
}

interface QuestionEventPayload {
  questionIndex: number;
  deadline: number | null;
  question?: Record<string, unknown>;
}

interface AdminSessionStatePayload extends SessionReadyPayload {
  pendingResults: Record<string, AnswerSummarySnapshot>;
  questions: QuestionContent[];
}

function now(): number {
  return Date.now();
}

interface AlarmMetadata {
  type: "question_deadline" | "answers_locked_to_reveal" | "reveal_to_next";
  questionIndex: number;
  scheduledAt: number;
}

const DEFAULT_REVEAL_DURATION_MS = 5000;
const DEFAULT_PENDING_RESULT_MS = 5000;

const workerLog = (...args: unknown[]): void => {
  console.log("[QuizRoom]", ...args);
};

const workerError = (...args: unknown[]): void => {
  console.error("[QuizRoom]", ...args);
};

export class QuizRoomDurableObject {
  private readonly state: DurableObjectState;
  private readonly env: Env;
  private snapshot: SessionSnapshot;
  private readonly connections = new Map<string, ConnectionContext>();
  private questions: QuestionContent[] = [];
  private alarmMeta: AlarmMetadata | null = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
    this.snapshot = {
      sessionId: "",
      quizId: "",
      status: "idle",
      questionIndex: -1,
      currentQuestionId: null,
      questionStartedAt: null,
      questionDeadline: null,
      questionLockedAt: null,
      questionRevealAt: null,
      questionRevealEndsAt: null,
      autoProgress: true,
      participants: {},
      pendingResults: {},
    };

    this.state.blockConcurrencyWhile(async () => {
      const [storedSession, storedQuestions, storedAlarm] = await Promise.all([
        this.state.storage.get<SessionSnapshot>("session"),
        this.state.storage.get<QuestionContent[]>("questions"),
        this.state.storage.get<AlarmMetadata>("alarm_meta"),
      ]);

      if (storedSession) {
        this.snapshot = storedSession;
        this.snapshot.currentQuestionId ??= null;
        this.snapshot.questionLockedAt ??= null;
        this.snapshot.questionRevealAt ??= null;
        this.snapshot.questionRevealEndsAt ??= null;
        this.snapshot.pendingResults ??= {};
        this.snapshot.participants ??= {};
        this.snapshot.autoProgress ??= true;
        for (const participant of Object.values(this.snapshot.participants)) {
          participant.answers ??= {};
          for (const answer of Object.values(participant.answers)) {
            if (answer) {
              normalizeAnswerSnapshot(answer);
            }
          }
          recalculateParticipantTotals(participant);
        }
        workerLog("Restored session snapshot", {
          sessionId: this.snapshot.sessionId,
          status: this.snapshot.status,
          questionIndex: this.snapshot.questionIndex,
        });
      }

      if (storedQuestions) {
        this.questions = storedQuestions.map((question) => ({
          ...question,
          revealDurationSec: question.revealDurationSec ?? DEFAULT_REVEAL_DURATION_MS / 1000,
          pendingResultSec: question.pendingResultSec ?? DEFAULT_PENDING_RESULT_MS / 1000,
        }));
        workerLog("Restored question cache", { count: this.questions.length });
      }

      if (storedAlarm) {
        this.alarmMeta = storedAlarm;
        await this.state.storage.setAlarm(storedAlarm.scheduledAt);
        workerLog("Restored pending alarm", storedAlarm);
      }
    });
  }

  async fetch(request: Request): Promise<Response> {
    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocket(request);
    }

    const url = new URL(request.url);
    workerLog("HTTP request", { method: request.method, pathname: url.pathname });
    switch (url.pathname) {
      case "/initialize":
        return this.handleInitializeRequest(request);
      case "/state":
        return this.handleStateRequest();
      case "/start":
        return this.handleStartRequest();
      case "/advance":
        return this.handleAdvanceRequest(request);
      case "/cancel":
        return this.handleCancelRequest();
      default:
        workerError("Unknown DO endpoint", { method: request.method, pathname: url.pathname });
        return new Response(JSON.stringify({ error: { code: "not_found", message: "Unknown DO endpoint" } }), {
          status: 404,
          headers: { "content-type": "application/json" },
        });
    }
  }

  private async handleInitializeRequest(request: Request): Promise<Response> {
    const payload = await safeJson<Record<string, unknown>>(request);
    const sessionId = typeof payload?.sessionId === "string" ? payload.sessionId : undefined;
    const quizId = typeof payload?.quizId === "string" ? payload.quizId : undefined;
    const autoProgressPayload = typeof payload?.autoProgress === "boolean" ? payload.autoProgress : undefined;

    if (!sessionId || !quizId) {
      workerError("Initialize payload missing identifiers", { sessionId, quizId });
      return new Response(
        JSON.stringify({ error: { code: "invalid_payload", message: "sessionId and quizId are required" } }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    if (this.snapshot.sessionId && this.snapshot.sessionId !== sessionId) {
      workerError("Initialize conflict", {
        currentSessionId: this.snapshot.sessionId,
        requestedSessionId: sessionId,
      });
      return new Response(
        JSON.stringify({ error: { code: "session_conflict", message: "Session already bound to another ID" } }),
        { status: 409, headers: { "content-type": "application/json" } }
      );
    }

    const db = getDatabase(this.env);
    const questionRepo = new QuestionRepository(db);
    const questionRecords = await questionRepo.listByQuiz(quizId);

    if (questionRecords.length === 0) {
      workerError("Quiz has no questions", { quizId });
      return new Response(
        JSON.stringify({ error: { code: "quiz_empty", message: "Quiz has no questions" } }),
        { status: 422, headers: { "content-type": "application/json" } }
      );
    }

    workerLog("Initializing session", {
      sessionId,
      quizId,
      questionCount: questionRecords.length,
      autoProgress: autoProgressPayload,
    });
    const questions: QuestionContent[] = [];
    let order = 0;
    for (const record of questionRecords) {
      const choices = await questionRepo.getChoices(record.id);
      questions.push({
        id: record.id,
        orderIndex: order,
        text: record.text,
        timeLimitSec: record.time_limit_sec,
        revealDurationSec: record.reveal_duration_sec ?? DEFAULT_REVEAL_DURATION_MS / 1000,
        pendingResultSec: record.pending_result_sec ?? DEFAULT_PENDING_RESULT_MS / 1000,
        choices: choices.map((choice) => ({
          id: choice.id,
          text: choice.text,
          isCorrect: choice.is_correct === 1,
        })),
      });
      order += 1;
    }

    const resetTimestamp = now();
    for (const participant of Object.values(this.snapshot.participants)) {
      participant.answers = {};
      participant.lastSeen = resetTimestamp;
      recalculateParticipantTotals(participant);
    }

    this.snapshot.sessionId = sessionId;
    this.snapshot.quizId = quizId;
    this.snapshot.status = "lobby";
    this.snapshot.questionIndex = -1;
    this.snapshot.currentQuestionId = null;
    this.snapshot.questionStartedAt = null;
    this.snapshot.questionDeadline = null;
    this.snapshot.questionLockedAt = null;
    this.snapshot.questionRevealAt = null;
    this.snapshot.questionRevealEndsAt = null;
    this.snapshot.pendingResults = {};
    if (typeof autoProgressPayload === "boolean") {
      this.snapshot.autoProgress = autoProgressPayload;
    }
    this.questions = questions;

    await this.persistState();
    await this.setAlarmMetadata(null);

    for (const connection of this.connections.values()) {
      this.handleSyncRequest(connection);
    }

    workerLog("Session initialized", {
      sessionId: this.snapshot.sessionId,
      quizId: this.snapshot.quizId,
      autoProgress: this.snapshot.autoProgress,
      questionCount: this.questions.length,
    });

    return new Response(null, { status: 202 });
  }

  private async handleStateRequest(): Promise<Response> {
    return new Response(JSON.stringify(this.snapshot), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  private async handleStartRequest(): Promise<Response> {
    if (!this.snapshot.sessionId) {
      workerError("Start requested before initialization");
      return new Response(
        JSON.stringify({ error: { code: "session_not_initialized", message: "Initialize the session first" } }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    if (this.questions.length === 0) {
      workerError("Start requested with empty question list", { sessionId: this.snapshot.sessionId });
      return new Response(
        JSON.stringify({ error: { code: "quiz_empty", message: "No questions available" } }),
        { status: 412, headers: { "content-type": "application/json" } }
      );
    }

    if (this.snapshot.status !== "lobby" && this.snapshot.status !== "idle") {
      workerError("Start request in invalid state", {
        sessionId: this.snapshot.sessionId,
        status: this.snapshot.status,
      });
      return new Response(JSON.stringify({ error: { code: "session_conflict", message: "Session already started" } }), {
        status: 409,
        headers: { "content-type": "application/json" },
      });
    }

    workerLog("Starting quiz", {
      sessionId: this.snapshot.sessionId,
      totalQuestions: this.questions.length,
    });
    await this.startQuestion(0);
    workerLog("Quiz started", { sessionId: this.snapshot.sessionId });
    return new Response(null, { status: 202 });
  }

  private async handleAdvanceRequest(request: Request): Promise<Response> {
    if (!this.snapshot.sessionId) {
      workerError("Advance requested before initialization");
      return new Response(JSON.stringify({ error: { code: "session_not_initialized", message: "Session not initialized" } }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }

    const payload = await safeJson<Record<string, unknown>>(request);
    const action = payload?.action ?? "next";

    workerLog("Advance request", {
      sessionId: this.snapshot.sessionId,
      status: this.snapshot.status,
      action,
      questionIndex: this.snapshot.questionIndex,
      payload,
    });

    switch (action) {
      case "next":
        if (this.snapshot.status === "question") {
          await this.lockCurrentQuestion({ immediateReveal: true, skipPending: true, skipAutoProgress: true });
        } else if (this.snapshot.status === "answers_locked") {
          await this.revealCurrentQuestion({ skipAutoProgress: true });
        } else if (this.snapshot.status === "reveal") {
          await this.setAlarmMetadata(null);
        }

        if (this.hasNextQuestion()) {
          await this.startQuestion(this.snapshot.questionIndex + 1);
        } else {
          await this.finalizeQuiz();
        }
        break;
      case "skip":
        if (typeof payload?.questionIndex === "number") {
          if (this.snapshot.status === "question") {
            await this.lockCurrentQuestion({ immediateReveal: true, skipPending: true, skipAutoProgress: true });
          } else if (this.snapshot.status === "answers_locked") {
            await this.revealCurrentQuestion({ skipAutoProgress: true });
          } else if (this.snapshot.status === "reveal") {
            await this.setAlarmMetadata(null);
          }

          if (!this.getQuestion(payload.questionIndex)) {
            workerError("Skip action out of range", {
              requestedIndex: payload.questionIndex,
              total: this.questions.length,
            });
            return new Response(
              JSON.stringify({ error: { code: "invalid_action", message: "Question index out of range" } }),
              { status: 400, headers: { "content-type": "application/json" } }
            );
          }

          workerLog("Skipping to question", {
            sessionId: this.snapshot.sessionId,
            targetIndex: payload.questionIndex,
          });
          await this.startQuestion(payload.questionIndex);
        } else {
          workerError("Skip action missing index");
          return new Response(
            JSON.stringify({ error: { code: "invalid_payload", message: "questionIndex is required for skip" } }),
            { status: 400, headers: { "content-type": "application/json" } }
          );
        }
        break;
      case "forceEnd":
        workerLog("Force ending current question", {
          sessionId: this.snapshot.sessionId,
          questionIndex: this.snapshot.questionIndex,
        });
        if (this.snapshot.status === "question") {
          await this.lockCurrentQuestion({ immediateReveal: true, skipPending: true });
        } else if (this.snapshot.status === "answers_locked") {
          await this.revealCurrentQuestion();
        }
        break;
      default:
        workerError("Advance action unknown", { action });
        return new Response(JSON.stringify({ error: { code: "invalid_action", message: `Unknown action: ${action}` } }), {
          status: 400,
          headers: { "content-type": "application/json" },
        });
    }

    workerLog("Advance request processed", {
      sessionId: this.snapshot.sessionId,
      currentIndex: this.snapshot.questionIndex,
      status: this.snapshot.status,
    });

    return new Response(null, { status: 202 });
  }

  private async handleCancelRequest(): Promise<Response> {
    workerLog("Cancel request", { sessionId: this.snapshot.sessionId });
    await this.finalizeQuiz();
    workerLog("Session cancelled", { sessionId: this.snapshot.sessionId });
    return new Response(null, { status: 202 });
  }

  private handleWebSocket(request: Request): Response {
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair);
    const connectionId = crypto.randomUUID();
    const context: ConnectionContext = { id: connectionId, socket: server };
    try {
      const url = new URL(request.url);
      workerLog("WebSocket upgrade", { pathname: url.pathname, search: url.search });
    } catch {
      workerLog("WebSocket upgrade", { url: request.url });
    }

    server.accept();
    server.addEventListener("message", (event) => this.onMessage(context, event));
    server.addEventListener("close", () => this.onClose(context));
    server.addEventListener("error", () => this.onClose(context));

    this.connections.set(connectionId, context);
    workerLog("WebSocket connection accepted", {
      connectionId,
      totalConnections: this.connections.size,
    });

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }

  private async onMessage(context: ConnectionContext, event: MessageEvent): Promise<void> {
    const data = event.data;
    if (typeof data !== "string") {
      this.sendError(context, "invalid_payload", "Messages must be JSON strings");
      workerError("Non-string message received", { connectionId: context.id });
      return;
    }

    let message: ClientMessage;
    try {
      message = JSON.parse(data);
    } catch (error) {
      this.sendError(context, "invalid_json", "Unable to parse message JSON");
      workerError("Failed to parse message JSON", { connectionId: context.id, data, error });
      return;
    }

    workerLog("Message received", {
      connectionId: context.id,
      role: context.role,
      type: message.type,
    });

    switch (message.type) {
      case "join_session":
        await this.handleJoinSession(context, message);
        break;
      case "request_sync":
        this.handleSyncRequest(context);
        break;
      case "submit_answer":
        await this.handleSubmitAnswer(context, message);
        break;
      case "heartbeat":
        this.handleHeartbeat(context, message);
        break;
      case "admin_control":
        await this.handleAdminControl(context, message);
        break;
      default:
        this.sendError(context, "unknown_type", `Unsupported message type: ${(message as ClientMessage).type}`);
    }
  }

  private async handleJoinSession(context: ConnectionContext, message: JoinSessionMessage): Promise<void> {
    context.role = message.role;
    context.userId = message.userId;

    workerLog("Join session", {
      connectionId: context.id,
      sessionId: message.sessionId,
      role: message.role,
      userId: message.userId,
    });

    if (!this.snapshot.sessionId) {
      this.snapshot.sessionId = message.sessionId;
    }

    if (message.role === "participant" && message.userId) {
      const participant = this.snapshot.participants[message.userId] ?? {
        userId: message.userId,
        displayName: message.displayName ?? message.userId,
        connected: true,
        lastSeen: now(),
        answers: {},
        score: 0,
        totalElapsedMs: 0,
      };
      participant.connected = true;
      participant.lastSeen = now();
      participant.displayName = message.displayName ?? participant.displayName;
      participant.answers ??= {};
      recalculateParticipantTotals(participant);
      this.snapshot.participants[message.userId] = participant;
      await this.persistState();
      workerLog("Participant joined", {
        sessionId: this.snapshot.sessionId,
        userId: message.userId,
        displayName: participant.displayName,
      });
    }

    if (message.role === "admin") {
      await this.persistState();
      workerLog("Admin connected", {
        sessionId: this.snapshot.sessionId,
        connectionId: context.id,
      });
    }

    this.handleSyncRequest(context);
  }

  private handleSyncRequest(context: ConnectionContext): void {
    if (!context.socket || context.socket.readyState !== 1) {
      workerError("Sync request skipped due to socket state", {
        connectionId: context.id,
        readyState: context.socket?.readyState,
      });
      return;
    }

    workerLog("Syncing session state", {
      connectionId: context.id,
      role: context.role,
      sessionId: this.snapshot.sessionId,
    });

    const allParticipants = Object.values(this.snapshot.participants);
    const isParticipantClient = context.role === "participant" && Boolean(context.userId);
    const participants = isParticipantClient
      ? allParticipants.filter((participant) => participant.userId === context.userId)
      : allParticipants;

    if (isParticipantClient && participants.length === 0 && context.userId) {
      const participant = this.snapshot.participants[context.userId];
      if (participant) {
        participants.push(participant);
      }
    }
    const payload: SessionReadyPayload = {
      status: this.snapshot.status,
      quizId: this.snapshot.quizId,
      questionIndex: this.snapshot.questionIndex,
      questionDeadline: this.snapshot.questionDeadline,
      questionStartedAt: this.snapshot.questionStartedAt,
      questionLockedAt: this.snapshot.questionLockedAt,
      questionRevealAt: this.snapshot.questionRevealAt,
      questionRevealEndsAt: this.snapshot.questionRevealEndsAt,
      autoProgress: this.snapshot.autoProgress,
      participants,
    };

    this.send(context, { type: "session_ready", sessionId: this.snapshot.sessionId, timestamp: now(), ...payload });

    const currentQuestion = this.getCurrentQuestion();

    const activeStatuses: SessionStatus[] = ["question", "answers_locked", "reveal"];

    if (currentQuestion && activeStatuses.includes(this.snapshot.status)) {
      const questionPayload: QuestionEventPayload & { question: Record<string, unknown> } = {
        questionIndex: this.snapshot.questionIndex,
        deadline: this.snapshot.questionDeadline,
        question: this.toParticipantQuestion(currentQuestion),
      };
      this.send(context, { type: "question_start", sessionId: this.snapshot.sessionId, timestamp: now(), ...questionPayload });
    }

    if (currentQuestion && (this.snapshot.status === "answers_locked" || this.snapshot.status === "reveal")) {
      const lockedAt = this.snapshot.questionLockedAt ?? now();
      const revealAt = this.snapshot.questionRevealAt ?? lockedAt;
      this.send(context, {
        type: "question_locked",
        sessionId: this.snapshot.sessionId,
        timestamp: now(),
        questionIndex: this.snapshot.questionIndex,
        questionId: currentQuestion.id,
        lockedAt,
        revealAt,
      });
    }

    if (currentQuestion && this.snapshot.status === "reveal") {
      const lockedAt = this.snapshot.questionLockedAt ?? now();
      const revealAt = this.snapshot.questionRevealAt ?? lockedAt;
      const revealEndsAt = this.snapshot.questionRevealEndsAt ?? revealAt;
      const summary =
        this.snapshot.pendingResults[currentQuestion.id] ?? this.computeSummary(currentQuestion);

      this.send(context, {
        type: "question_reveal",
        sessionId: this.snapshot.sessionId,
        timestamp: now(),
        questionIndex: this.snapshot.questionIndex,
        questionId: currentQuestion.id,
        revealAt,
        revealEndsAt,
        totals: summary.totals,
        correctChoiceIds: summary.correctChoiceIds,
      });

      if (context.role === "participant" && context.userId) {
        const participant = this.snapshot.participants[context.userId];
        const answer = participant?.answers?.[currentQuestion.id];
        if (participant && answer) {
          normalizeAnswerSnapshot(answer);
          this.send(context, {
            type: "answer_result",
            sessionId: this.snapshot.sessionId,
            timestamp: now(),
            questionIndex: this.snapshot.questionIndex,
            isCorrect: Boolean(answer.isCorrect),
            correctChoiceId: summary.correctChoiceIds[0] ?? "",
            choiceId: answer.choiceId,
            questionId: currentQuestion.id,
            userId: participant.userId,
            elapsedMs: answer.elapsedMs ?? 0,
          });
        }
      }
    }

    if (context.role === "admin") {
      const adminPayload: AdminSessionStatePayload = {
        ...payload,
        questionStartedAt: this.snapshot.questionStartedAt,
        pendingResults: this.snapshot.pendingResults,
        questions: this.questions,
      };
      this.send(context, { type: "admin_session_state", sessionId: this.snapshot.sessionId, timestamp: now(), ...adminPayload });
    }
  }

  private serializeParticipantAnswersForSignature(
    answers: Record<string, ParticipantAnswerSnapshot> | undefined
  ): Array<[string, string, number, number | null]> {
    if (!answers) {
      return [];
    }
    return Object.entries(answers)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([questionId, answer]) => [
        questionId,
        answer.choiceId,
        answer.submittedAt,
        answer.isCorrect === undefined ? null : answer.isCorrect ? 1 : 0,
      ]);
  }

  private participantSignatureForClient(participant: ParticipantStateSnapshot | undefined): string {
    if (!participant) {
      return "missing";
    }
    return JSON.stringify([
      participant.userId,
      participant.connected ? 1 : 0,
      this.serializeParticipantAnswersForSignature(participant.answers),
    ]);
  }

  private adminParticipantsSignature(): string {
    return Object.values(this.snapshot.participants)
      .map((participant) => this.participantSignatureForClient(participant))
      .sort()
      .join("|");
  }

  private pendingResultsSignature(): string {
    return Object.entries(this.snapshot.pendingResults)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([questionId, summary]) =>
        JSON.stringify([
          questionId,
          Object.entries(summary.totals)
            .sort(([left], [right]) => left.localeCompare(right)),
          [...summary.correctChoiceIds].sort(),
        ])
      )
      .join("|");
  }

  private computeClientStateSignature(context: ConnectionContext): string {
    const base: Array<string | number | boolean | null> = [
      context.role ?? "guest",
      this.snapshot.status,
      this.snapshot.questionIndex,
      this.snapshot.questionDeadline ?? null,
      this.snapshot.questionStartedAt ?? null,
      this.snapshot.questionLockedAt ?? null,
      this.snapshot.questionRevealAt ?? null,
      this.snapshot.questionRevealEndsAt ?? null,
      this.snapshot.autoProgress,
    ];

    if (context.role === "participant" && context.userId) {
      base.push(this.participantSignatureForClient(this.snapshot.participants[context.userId]));
    } else if (context.role === "admin") {
      base.push(this.adminParticipantsSignature());
      base.push(this.pendingResultsSignature());
    }

    return JSON.stringify(base);
  }

  private async handleSubmitAnswer(context: ConnectionContext, message: SubmitAnswerMessage): Promise<void> {
    if (context.role !== "participant" || !context.userId) {
      this.sendError(context, "not_authorized", "Submit answer allowed for participants only");
      workerError("Answer submission rejected: unauthorized", {
        connectionId: context.id,
        role: context.role,
      });
      return;
    }

    const participant = this.snapshot.participants[context.userId];
    if (!participant) {
      this.sendError(context, "not_registered", "Participant not registered in session");
      workerError("Answer submission rejected: participant not registered", {
        sessionId: this.snapshot.sessionId,
        userId: context.userId,
      });
      return;
    }

    if (this.snapshot.status !== "question") {
      this.sendError(context, "answer_closed", "Answer window closed");
      workerError("Answer submission outside active question", {
        sessionId: this.snapshot.sessionId,
        userId: context.userId,
        status: this.snapshot.status,
      });
      return;
    }

    const question = this.getCurrentQuestion();
    if (!question || question.id !== message.questionId) {
      this.sendError(context, "invalid_action", "Question does not match current state");
      workerError("Answer submission for non-current question", {
        sessionId: this.snapshot.sessionId,
        userId: context.userId,
        messageQuestionId: message.questionId,
        currentQuestionId: question?.id,
      });
      return;
    }

    const correctChoiceIds = question.choices.filter((choice) => choice.isCorrect).map((choice) => choice.id);
    const isCorrect = correctChoiceIds.includes(message.choiceId);
    const submittedAt = now();
    const questionStartedAt = this.snapshot.questionStartedAt ?? submittedAt;
    const elapsedMs = Math.max(0, submittedAt - questionStartedAt);

    workerLog("Answer submitted", {
      sessionId: this.snapshot.sessionId,
      userId: context.userId,
      questionId: question.id,
      choiceId: message.choiceId,
      isCorrect,
      elapsedMs,
    });

    participant.answers ??= {};
    participant.answers[question.id] = {
      choiceId: message.choiceId,
      submittedAt,
      isCorrect,
      elapsedMs,
    };
    normalizeAnswerSnapshot(participant.answers[question.id]);
    recalculateParticipantTotals(participant);
    participant.lastSeen = submittedAt;
    this.snapshot.participants[context.userId] = participant;

    await this.persistState();

    const answerRepo = new AnswerRepository(getDatabase(this.env));
    await answerRepo.recordAnswer({
      id: crypto.randomUUID(),
      session_id: this.snapshot.sessionId,
      question_id: question.id,
      user_id: context.userId,
      choice_id: message.choiceId,
      submitted_at: new Date(submittedAt).toISOString(),
      elapsed_ms: elapsedMs,
      is_correct: isCorrect ? 1 : 0,
    });

    this.sendToParticipant(context.userId, {
      type: "answer_received",
      sessionId: this.snapshot.sessionId,
      timestamp: submittedAt,
      questionIndex: this.snapshot.questionIndex,
      questionId: question.id,
      choiceId: message.choiceId,
      elapsedMs,
      userId: context.userId,
    });
  }

  private handleHeartbeat(context: ConnectionContext, message: HeartbeatMessage): void {
    if (context.userId) {
      const participant = this.snapshot.participants[context.userId];
      if (participant) {
        participant.lastSeen = now();
      }
    }

    const serverSignature = this.computeClientStateSignature(context);
    if (message.stateSignature && message.stateSignature === serverSignature) {
      this.send(context, {
        type: "sync_ack",
        sessionId: this.snapshot.sessionId,
        timestamp: now(),
        stateSignature: serverSignature,
      });
      return;
    }

    this.handleSyncRequest(context);
    const updatedSignature = this.computeClientStateSignature(context);
    this.send(context, {
      type: "sync_ack",
      sessionId: this.snapshot.sessionId,
      timestamp: now(),
      stateSignature: updatedSignature,
    });
  }

  private async handleAdminControl(context: ConnectionContext, message: AdminControlMessage): Promise<void> {
    if (context.role !== "admin") {
      this.sendError(context, "not_authorized", "Admin control requires admin role");
      workerError("Admin control rejected: unauthorized", {
        connectionId: context.id,
        action: message.action,
      });
      return;
    }

    workerLog("Admin control", {
      sessionId: this.snapshot.sessionId,
      action: message.action,
      questionIndex: message.questionIndex,
    });

    switch (message.action) {
      case "startQuiz":
        await this.relayControlResponse(await this.handleStartRequest(), context);
        break;
      case "forceEndQuestion":
        await this.relayControlResponse(
          await this.handleAdvanceRequest(
            new Request("https://do/internal", { method: "POST", body: JSON.stringify({ action: "forceEnd" }), headers: { "content-type": "application/json" } })
          ),
          context
        );
        break;
      case "skipToQuestion":
        await this.relayControlResponse(
          await this.handleAdvanceRequest(
            new Request("https://do/internal", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ action: "skip", questionIndex: message.questionIndex }),
            })
          ),
          context
        );
        break;
      default:
        this.sendError(context, "invalid_action", `Unsupported admin action: ${message.action}`);
        workerError("Unsupported admin action", { action: message.action });
    }
  }

  private onClose(context: ConnectionContext): void {
    this.connections.delete(context.id);
    workerLog("Connection closed", {
      connectionId: context.id,
      role: context.role,
      remainingConnections: this.connections.size,
    });
    if (context.role === "participant" && context.userId) {
      const participant = this.snapshot.participants[context.userId];
      if (participant) {
        participant.connected = false;
        participant.lastSeen = now();
      }
    }
  }

  private async persistState(): Promise<void> {
    await Promise.all([
      this.state.storage.put("session", this.snapshot),
      this.state.storage.put("questions", this.questions),
    ]);
  }

  private send(context: ConnectionContext, payload: Record<string, unknown>): void {
    if (context.socket.readyState === 1) {
      context.socket.send(JSON.stringify(payload));
    }
  }

  private sendError(context: ConnectionContext, code: string, message: string): void {
    this.send(context, { type: "error", code, message, sessionId: this.snapshot.sessionId, timestamp: now() });
  }

  private broadcast(payload: Record<string, unknown>, audience: ClientRole | "all" = "all"): void {
    for (const connection of this.connections.values()) {
      if (audience === "all" || connection.role === audience) {
        this.send(connection, payload);
      }
    }
  }

  private sendToParticipant(userId: string, payload: Record<string, unknown>): void {
    for (const connection of this.connections.values()) {
      if (connection.role === "participant" && connection.userId === userId) {
        this.send(connection, payload);
      }
    }
  }

  private toParticipantQuestion(question: QuestionContent): Record<string, unknown> {
    return {
      id: question.id,
      text: question.text,
      choices: question.choices.map((choice) => ({ id: choice.id, text: choice.text })),
    };
  }

  private getQuestion(index: number): QuestionContent | undefined {
    if (index < 0 || index >= this.questions.length) {
      return undefined;
    }
    return this.questions[index];
  }

  private getCurrentQuestion(): QuestionContent | undefined {
    return this.getQuestion(this.snapshot.questionIndex);
  }

  private hasNextQuestion(): boolean {
    return this.snapshot.questionIndex + 1 < this.questions.length;
  }

  private async startQuestion(index: number): Promise<void> {
    const question = this.getQuestion(index);
    if (!question) {
      await this.finalizeQuiz();
      return;
    }

    await this.setAlarmMetadata(null);

    this.snapshot.status = "question";
    this.snapshot.questionIndex = index;
    this.snapshot.currentQuestionId = question.id;
    this.snapshot.questionStartedAt = now();
    this.snapshot.questionDeadline = question.timeLimitSec > 0 ? this.snapshot.questionStartedAt + question.timeLimitSec * 1000 : null;
    this.snapshot.questionLockedAt = null;
    this.snapshot.questionRevealAt = null;
    this.snapshot.questionRevealEndsAt = null;
    delete this.snapshot.pendingResults[question.id];

    workerLog("Question started", {
      sessionId: this.snapshot.sessionId,
      questionIndex: index,
      questionId: question.id,
      timeLimitSec: question.timeLimitSec,
      revealDurationSec: question.revealDurationSec,
      deadline: this.snapshot.questionDeadline,
    });

    await this.persistState();

    if (this.snapshot.questionDeadline) {
      await this.setAlarmMetadata({
        type: "question_deadline",
        questionIndex: index,
        scheduledAt: this.snapshot.questionDeadline,
      });
    }

    this.broadcastQuestionStart(question);
  }

  private async lockCurrentQuestion(options: { immediateReveal?: boolean; skipPending?: boolean; skipAutoProgress?: boolean } = {}): Promise<void> {
    const { immediateReveal = false, skipPending = false, skipAutoProgress = false } = options;

    if (this.snapshot.status !== "question") {
      workerLog("lockCurrentQuestion called outside question phase", {
        status: this.snapshot.status,
        sessionId: this.snapshot.sessionId,
      });
      if (immediateReveal && (this.snapshot.status === "answers_locked" || this.snapshot.status === "reveal")) {
        await this.revealCurrentQuestion({ skipAutoProgress });
      }
      return;
    }

    const question = this.getCurrentQuestion();
    if (!question) {
      await this.finalizeQuiz();
      return;
    }

    await this.setAlarmMetadata(null);

    const lockedAt = now();
    const pendingDelayMs = skipPending ? 0 : Math.max(0, (question.pendingResultSec ?? DEFAULT_PENDING_RESULT_MS / 1000) * 1000);
    const revealDurationMs = Math.max(0, (question.revealDurationSec ?? DEFAULT_REVEAL_DURATION_MS / 1000) * 1000);
    const revealAt = lockedAt + pendingDelayMs;
    const revealEndsAt = revealAt + revealDurationMs;

    this.snapshot.status = "answers_locked";
    this.snapshot.questionDeadline = null;
    this.snapshot.questionLockedAt = lockedAt;
    this.snapshot.questionRevealAt = revealAt;
    this.snapshot.questionRevealEndsAt = revealEndsAt;

    workerLog("Question locked", {
      sessionId: this.snapshot.sessionId,
      questionIndex: this.snapshot.questionIndex,
      questionId: question.id,
      lockedAt,
      revealAt,
      pendingDelayMs,
      immediateReveal,
    });

    await this.persistState();

    this.broadcastQuestionLocked(question, lockedAt, revealAt);

    if (!immediateReveal && pendingDelayMs > 0) {
      await this.setAlarmMetadata({
        type: "answers_locked_to_reveal",
        questionIndex: this.snapshot.questionIndex,
        scheduledAt: revealAt,
      });
      workerLog("Scheduled reveal after pending window", {
        sessionId: this.snapshot.sessionId,
        questionIndex: this.snapshot.questionIndex,
        scheduledAt: revealAt,
      });
      return;
    }

    await this.revealCurrentQuestion({ skipAutoProgress });
  }

  private async revealCurrentQuestion(options: { skipAutoProgress?: boolean } = {}): Promise<void> {
    const { skipAutoProgress = false } = options;
    if (this.snapshot.status !== "answers_locked" && this.snapshot.status !== "question") {
      workerLog("revealCurrentQuestion called in non-lock state", {
        status: this.snapshot.status,
        sessionId: this.snapshot.sessionId,
      });
      if (this.snapshot.status === "reveal" && skipAutoProgress) {
        await this.setAlarmMetadata(null);
      }
      return;
    }

    const question = this.getCurrentQuestion();
    if (!question) {
      await this.finalizeQuiz();
      return;
    }

    await this.setAlarmMetadata(null);

    const revealAt = this.snapshot.questionRevealAt ?? now();
    const revealEndsAt =
      this.snapshot.questionRevealEndsAt ??
      revealAt + Math.max(0, (question.revealDurationSec ?? DEFAULT_REVEAL_DURATION_MS / 1000) * 1000);

    const summary = this.computeSummary(question);
    this.snapshot.status = "reveal";
    this.snapshot.questionLockedAt ??= revealAt;
    this.snapshot.questionRevealAt = revealAt;
    this.snapshot.questionRevealEndsAt = revealEndsAt;
    this.snapshot.pendingResults[question.id] = summary;

    workerLog("Question reveal", {
      sessionId: this.snapshot.sessionId,
      questionIndex: this.snapshot.questionIndex,
      questionId: question.id,
      revealAt,
      revealEndsAt,
      totals: summary.totals,
      correctChoices: summary.correctChoiceIds,
      skipAutoProgress,
    });

    await this.persistState();

    this.broadcastQuestionReveal(question, summary, revealAt, revealEndsAt);
    this.broadcastAnswerResults(question, summary);

    if (!skipAutoProgress && this.snapshot.autoProgress) {
      if (this.hasNextQuestion()) {
        if (revealEndsAt <= now()) {
          workerLog("Auto-progressing immediately to next question after reveal", {
            sessionId: this.snapshot.sessionId,
            nextIndex: this.snapshot.questionIndex + 1,
          });
          await this.startQuestion(this.snapshot.questionIndex + 1);
        } else {
          await this.setAlarmMetadata({
            type: "reveal_to_next",
            questionIndex: this.snapshot.questionIndex,
            scheduledAt: revealEndsAt,
          });
          workerLog("Scheduled auto-progress after reveal", {
            sessionId: this.snapshot.sessionId,
            delayMs: Math.max(0, revealEndsAt - now()),
            nextIndex: this.snapshot.questionIndex + 1,
          });
        }
      } else {
        if (revealEndsAt <= now()) {
          await this.finalizeQuiz();
        } else {
          await this.setAlarmMetadata({
            type: "reveal_to_next",
            questionIndex: this.snapshot.questionIndex,
            scheduledAt: revealEndsAt,
          });
        }
      }
    }
  }

  private computeSummary(question: QuestionContent): AnswerSummarySnapshot {
    const totals: Record<string, number> = {};
    for (const participant of Object.values(this.snapshot.participants)) {
      const answer = participant.answers?.[question.id];
      if (!answer) {
        continue;
      }
      totals[answer.choiceId] = (totals[answer.choiceId] ?? 0) + 1;
    }

    const correctChoiceIds = question.choices.filter((choice) => choice.isCorrect).map((choice) => choice.id);

    return {
      questionId: question.id,
      totals,
      correctChoiceIds,
    };
  }

  private async finalizeQuiz(): Promise<void> {
    await this.setAlarmMetadata(null);
    this.snapshot.status = "finished";
    this.snapshot.questionDeadline = null;
    this.snapshot.currentQuestionId = null;
    this.snapshot.questionStartedAt = null;
    this.snapshot.questionLockedAt = null;
    this.snapshot.questionRevealAt = null;
    this.snapshot.questionRevealEndsAt = null;
    await this.persistState();
    workerLog("Quiz finalized", { sessionId: this.snapshot.sessionId });
    this.broadcast({ type: "quiz_finish", sessionId: this.snapshot.sessionId, timestamp: now() }, "all");
  }

  private broadcastQuestionStart(question: QuestionContent): void {
    const payload: QuestionEventPayload & { question: Record<string, unknown> } = {
      questionIndex: this.snapshot.questionIndex,
      deadline: this.snapshot.questionDeadline,
      question: this.toParticipantQuestion(question),
    };
    workerLog("Broadcasting question_start", {
      sessionId: this.snapshot.sessionId,
      questionIndex: this.snapshot.questionIndex,
    });
    this.broadcast({ type: "question_start", sessionId: this.snapshot.sessionId, timestamp: now(), ...payload }, "all");
  }

  private broadcastQuestionLocked(question: QuestionContent, lockedAt: number, revealAt: number): void {
    workerLog("Broadcasting question_locked", {
      sessionId: this.snapshot.sessionId,
      questionIndex: this.snapshot.questionIndex,
      lockedAt,
      revealAt,
    });
    this.broadcast(
      {
        type: "question_locked",
        sessionId: this.snapshot.sessionId,
        timestamp: now(),
        questionIndex: this.snapshot.questionIndex,
        questionId: question.id,
        lockedAt,
        revealAt,
      },
      "all"
    );
  }

  private broadcastQuestionReveal(
    question: QuestionContent,
    summary: AnswerSummarySnapshot,
    revealAt: number,
    revealEndsAt: number
  ): void {
    workerLog("Broadcasting question_reveal", {
      sessionId: this.snapshot.sessionId,
      questionIndex: this.snapshot.questionIndex,
      revealAt,
      revealEndsAt,
      totals: summary.totals,
    });
    this.broadcast(
      {
        type: "question_reveal",
        sessionId: this.snapshot.sessionId,
        timestamp: now(),
        questionIndex: this.snapshot.questionIndex,
        questionId: question.id,
        revealAt,
        revealEndsAt,
        totals: summary.totals,
        correctChoiceIds: summary.correctChoiceIds,
      },
      "all"
    );
  }

  private broadcastAnswerResults(question: QuestionContent, summary: AnswerSummarySnapshot): void {
    const correctChoiceId = summary.correctChoiceIds[0] ?? "";
    for (const participant of Object.values(this.snapshot.participants)) {
      const answer = participant.answers?.[question.id];
      if (!answer) {
        continue;
      }
      normalizeAnswerSnapshot(answer);
      const payload = {
        type: "answer_result",
        sessionId: this.snapshot.sessionId,
        timestamp: now(),
        questionIndex: this.snapshot.questionIndex,
        isCorrect: Boolean(answer.isCorrect),
        correctChoiceId,
        choiceId: answer.choiceId,
        questionId: question.id,
        userId: participant.userId,
        elapsedMs: answer.elapsedMs ?? 0,
      };
      this.sendToParticipant(participant.userId, payload);
    }
  }

  private async relayControlResponse(response: Response, context: ConnectionContext): Promise<void> {
    if (response.status < 400) {
      return;
    }

    let message = `Action failed (status ${response.status})`;
    try {
      const data = (await response.clone().json()) as { error?: { message?: string } };
      message = data.error?.message ?? message;
    } catch {
      try {
        const text = await response.clone().text();
        if (text) {
          message = text;
        }
      } catch {
        // ignore
      }
    }

    workerError("Admin control action failed", {
      sessionId: this.snapshot.sessionId,
      status: response.status,
      message,
    });
    this.sendError(context, "action_failed", message);
  }

  private async setAlarmMetadata(meta: AlarmMetadata | null): Promise<void> {
    this.alarmMeta = meta;
    if (meta) {
      await this.state.storage.put("alarm_meta", meta);
      await this.state.storage.setAlarm(meta.scheduledAt);
      workerLog("Alarm scheduled", meta);
    } else {
      await this.state.storage.delete("alarm_meta");
      await this.state.storage.deleteAlarm();
      workerLog("Alarm cleared", { sessionId: this.snapshot.sessionId });
    }
  }

  async alarm(): Promise<void> {
    const meta = this.alarmMeta ?? (await this.state.storage.get<AlarmMetadata>("alarm_meta"));
    if (!meta) {
      workerLog("Alarm triggered with no metadata", { sessionId: this.snapshot.sessionId });
      return;
    }

    await this.setAlarmMetadata(null);

    workerLog("Alarm firing", {
      sessionId: this.snapshot.sessionId,
      meta,
      status: this.snapshot.status,
      questionIndex: this.snapshot.questionIndex,
    });

    switch (meta.type) {
      case "question_deadline":
        if (this.snapshot.status === "question" && this.snapshot.questionIndex === meta.questionIndex) {
          await this.lockCurrentQuestion();
        }
        break;
      case "answers_locked_to_reveal":
        if (
          (this.snapshot.status === "answers_locked" || this.snapshot.status === "question") &&
          this.snapshot.questionIndex === meta.questionIndex
        ) {
          await this.revealCurrentQuestion();
        }
        break;
      case "reveal_to_next":
        if (this.snapshot.status === "reveal" && this.hasNextQuestion()) {
          await this.startQuestion(this.snapshot.questionIndex + 1);
        } else if (!this.hasNextQuestion()) {
          await this.finalizeQuiz();
        }
        break;
      default:
        break;
    }
  }
}

async function safeJson<T = unknown>(request: Request): Promise<T | null> {
  const text = await request.text();
  if (!text) {
    workerLog("safeJson received empty body", {});
    return null;
  }
  try {
    return JSON.parse(text) as T;
  } catch (error) {
    workerError("safeJson failed to parse body", { error });
    return null;
  }
}
