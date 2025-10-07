// Durable Object and Worker entry point for the Party quiz application.
// Provides WebSocket scaffolding aligned with quiz-state-protocol.md and
// placeholder HTTP handlers for session control commands.

import {
  AnswerRepository,
  QuestionRepository,
  getDatabase,
  type DatabaseEnv,
} from "../src/server/db";

interface Env extends DatabaseEnv {
  QUIZ_ROOM_DO: DurableObjectNamespace;
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (request.headers.get("Upgrade") === "websocket" && url.pathname.startsWith("/ws/sessions/")) {
      return handleSessionWebSocket(request, env);
    }

    if (url.pathname === "/healthz") {
      return new Response("ok", { status: 200 });
    }

    if (url.pathname.startsWith("/api/sessions/")) {
      return handleSessionApi(request, env);
    }

    return new Response("Not Found", { status: 404 });
  },
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

type SessionStatus = "idle" | "lobby" | "question" | "reveal" | "finished";

type ClientRole = "participant" | "admin";

interface ParticipantAnswerSnapshot {
  choiceId: string;
  submittedAt: number;
  isCorrect?: boolean;
}

interface ParticipantStateSnapshot {
  userId: string;
  displayName: string;
  connected: boolean;
  lastSeen: number;
  answers: Record<string, ParticipantAnswerSnapshot>;
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
  autoProgress: boolean;
  participants: ParticipantStateSnapshot[];
}

interface QuestionEventPayload {
  questionIndex: number;
  deadline: number | null;
  question?: Record<string, unknown>;
}

interface AnswerResultPayload {
  questionIndex: number;
  isCorrect: boolean;
  correctChoiceId: string;
  choiceId: string;
  questionId: string;
  userId: string;
}

interface QuestionSummaryPayload {
  questionIndex: number;
  totals: Record<string, number>;
  correctChoiceIds: string[];
}

interface AdminSessionStatePayload extends SessionReadyPayload {
  questionStartedAt: number | null;
  pendingResults: Record<string, AnswerSummarySnapshot>;
  questions: QuestionContent[];
}

function now(): number {
  return Date.now();
}

interface AlarmMetadata {
  type: "question_deadline" | "reveal_to_next";
  questionIndex: number;
  scheduledAt: number;
}

const DEFAULT_REVEAL_DURATION_MS = 5000;

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
        this.snapshot.pendingResults ??= {};
        this.snapshot.participants ??= {};
        this.snapshot.autoProgress ??= true;
        for (const participant of Object.values(this.snapshot.participants)) {
          participant.answers ??= {};
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
        choices: choices.map((choice) => ({
          id: choice.id,
          text: choice.text,
          isCorrect: choice.is_correct === 1,
        })),
      });
      order += 1;
    }

    this.snapshot.sessionId = sessionId;
    this.snapshot.quizId = quizId;
    this.snapshot.status = "lobby";
    this.snapshot.questionIndex = -1;
    this.snapshot.currentQuestionId = null;
    this.snapshot.questionStartedAt = null;
    this.snapshot.questionDeadline = null;
    this.snapshot.pendingResults = {};
    if (typeof autoProgressPayload === "boolean") {
      this.snapshot.autoProgress = autoProgressPayload;
    }
    this.questions = questions;

    await this.persistState();
    await this.setAlarmMetadata(null);

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
          await this.finishCurrentQuestion({ skipAutoProgress: true });
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
            await this.finishCurrentQuestion({ skipAutoProgress: true });
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
        await this.finishCurrentQuestion();
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
        this.handleHeartbeat(context);
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
      };
      participant.connected = true;
      participant.lastSeen = now();
      participant.displayName = message.displayName ?? participant.displayName;
      participant.answers ??= {};
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

    const participants = Object.values(this.snapshot.participants);
    const payload: SessionReadyPayload = {
      status: this.snapshot.status,
      quizId: this.snapshot.quizId,
      questionIndex: this.snapshot.questionIndex,
      questionDeadline: this.snapshot.questionDeadline,
      autoProgress: this.snapshot.autoProgress,
      participants,
    };

    this.send(context, { type: "session_ready", sessionId: this.snapshot.sessionId, timestamp: now(), ...payload });

    const currentQuestion = this.getCurrentQuestion();

    if (this.snapshot.status === "question" && currentQuestion) {
      const questionPayload: QuestionEventPayload & { question: Record<string, unknown> } = {
        questionIndex: this.snapshot.questionIndex,
        deadline: this.snapshot.questionDeadline,
        question: this.toParticipantQuestion(currentQuestion),
      };
      this.send(context, { type: "question_start", sessionId: this.snapshot.sessionId, timestamp: now(), ...questionPayload });
    }

    if (this.snapshot.status === "reveal" && currentQuestion) {
      const summary = this.snapshot.pendingResults[currentQuestion.id];

      this.send(context, {
        type: "question_end",
        sessionId: this.snapshot.sessionId,
        timestamp: now(),
        questionIndex: this.snapshot.questionIndex,
      });

      if (summary) {
        const summaryPayload: QuestionSummaryPayload = {
          questionIndex: this.snapshot.questionIndex,
          totals: summary.totals,
          correctChoiceIds: summary.correctChoiceIds,
        };
        this.send(context, { type: "question_summary", sessionId: this.snapshot.sessionId, timestamp: now(), ...summaryPayload });
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

    workerLog("Answer submitted", {
      sessionId: this.snapshot.sessionId,
      userId: context.userId,
      questionId: question.id,
      choiceId: message.choiceId,
      isCorrect,
    });

    participant.answers ??= {};
    participant.answers[question.id] = {
      choiceId: message.choiceId,
      submittedAt,
      isCorrect,
    };
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
    });

    this.send(context, {
      type: "answer_result",
      sessionId: this.snapshot.sessionId,
      timestamp: submittedAt,
      questionIndex: this.snapshot.questionIndex,
      isCorrect,
      correctChoiceId: correctChoiceIds[0] ?? "",
      choiceId: message.choiceId,
      questionId: question.id,
      userId: context.userId,
    });
  }

  private handleHeartbeat(context: ConnectionContext): void {
    if (!context.userId) {
      return;
    }
    const participant = this.snapshot.participants[context.userId];
    if (!participant) {
      return;
    }
    participant.lastSeen = now();
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

  private async finishCurrentQuestion(options: { skipAutoProgress?: boolean } = {}): Promise<void> {
    const { skipAutoProgress = false } = options;
    if (this.snapshot.status !== "question") {
      workerLog("finishCurrentQuestion called outside question phase", {
        status: this.snapshot.status,
        sessionId: this.snapshot.sessionId,
      });
      return;
    }

    const question = this.getCurrentQuestion();
    if (!question) {
      await this.finalizeQuiz();
      return;
    }

    await this.setAlarmMetadata(null);

    const summary = this.computeSummary(question);
    this.snapshot.status = "reveal";
    this.snapshot.questionDeadline = null;
    this.snapshot.pendingResults[question.id] = summary;

    workerLog("Question finished", {
      sessionId: this.snapshot.sessionId,
      questionIndex: this.snapshot.questionIndex,
      questionId: question.id,
      skipAutoProgress,
      totals: summary.totals,
      correctChoices: summary.correctChoiceIds,
    });

    await this.persistState();

    this.broadcastQuestionEnd(question, summary);

    if (!skipAutoProgress && this.snapshot.autoProgress) {
      const revealDelayMs = Math.max(
        0,
        (question.revealDurationSec ?? DEFAULT_REVEAL_DURATION_MS / 1000) * 1000
      );

      if (this.hasNextQuestion()) {
        if (revealDelayMs === 0) {
          workerLog("Auto-progressing immediately to next question", {
            sessionId: this.snapshot.sessionId,
            nextIndex: this.snapshot.questionIndex + 1,
          });
          await this.startQuestion(this.snapshot.questionIndex + 1);
        } else {
          await this.setAlarmMetadata({
            type: "reveal_to_next",
            questionIndex: this.snapshot.questionIndex,
            scheduledAt: now() + revealDelayMs,
          });
          workerLog("Scheduled auto-progress", {
            sessionId: this.snapshot.sessionId,
            delayMs: revealDelayMs,
            nextIndex: this.snapshot.questionIndex + 1,
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

  private broadcastQuestionEnd(question: QuestionContent, summary: AnswerSummarySnapshot): void {
    workerLog("Broadcasting question_end", {
      sessionId: this.snapshot.sessionId,
      questionIndex: this.snapshot.questionIndex,
    });
    this.broadcast(
      { type: "question_end", sessionId: this.snapshot.sessionId, timestamp: now(), questionIndex: this.snapshot.questionIndex },
      "all"
    );
    workerLog("Broadcasting question_summary", {
      sessionId: this.snapshot.sessionId,
      questionIndex: this.snapshot.questionIndex,
      totals: summary.totals,
    });
    this.broadcast(
      {
        type: "question_summary",
        sessionId: this.snapshot.sessionId,
        timestamp: now(),
        questionIndex: this.snapshot.questionIndex,
        totals: summary.totals,
        correctChoiceIds: summary.correctChoiceIds,
      },
      "all"
    );
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
    const setAlarm = this.state.storage.setAlarm as unknown as (time?: number) => Promise<void>;
    if (meta) {
      await this.state.storage.put("alarm_meta", meta);
      await setAlarm(meta.scheduledAt);
      workerLog("Alarm scheduled", meta);
    } else {
      await this.state.storage.delete("alarm_meta");
      await setAlarm();
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
          await this.finishCurrentQuestion();
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
