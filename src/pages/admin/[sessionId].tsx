import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  advanceSession,
  cancelSession,
  fetchSessionState,
  fetchUsers,
  startSession,
  type UserProfile,
} from "../../lib/api";
import { useQuizSession } from "../../hooks/useQuizSession";

export default function AdminSessionPage() {
  const router = useRouter();
  const { sessionId } = router.query as { sessionId?: string };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [skipIndex, setSkipIndex] = useState<string>("");
  const [participants, setParticipants] = useState<UserProfile[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(true);
  const [participantsError, setParticipantsError] = useState<string | null>(null);

  const { state, sendAdminAction, requestSync, connected } = useQuizSession({
    sessionId: sessionId ?? "",
    role: "admin",
  });

  useEffect(() => {
    if (!sessionId) return;
    const load = async () => {
      try {
        await fetchSessionState(sessionId);
      } catch (err) {
        setError(err instanceof Error ? err.message : "セッション状態の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [sessionId]);

  useEffect(() => {
    const loadParticipants = async () => {
      try {
        const users = await fetchUsers();
        setParticipants(users);
        setParticipantsError(null);
      } catch (err) {
        setParticipantsError(err instanceof Error ? err.message : "参加者の取得に失敗しました");
      } finally {
        setParticipantsLoading(false);
      }
    };
    loadParticipants();
  }, []);

  const participantLinks = useMemo(() => {
    if (typeof window === "undefined") return [];
    const origin = window.location.origin;
    return participants.map((participant) => ({
      ...participant,
      url: `${origin}/quiz/${participant.publicId}`,
    }));
  }, [participants]);

  const participantNameMap = useMemo(() => {
    const map = new Map<string, string>();
    participants.forEach((participant) => map.set(participant.id, participant.displayName));
    state.participants.forEach((participant) => map.set(participant.userId, participant.displayName));
    return map;
  }, [participants, state.participants]);

  const currentScores = useMemo(() => {
    const scoreMap = new Map<
      string,
      {
        userId: string;
        displayName: string;
        score: number;
      }
    >();

    participants.forEach((participant) => {
      scoreMap.set(participant.id, {
        userId: participant.id,
        displayName: participant.displayName,
        score: 0,
      });
    });

    state.participants.forEach((participant) => {
      const answers = Object.values(participant.answers ?? {});
      const score = answers.reduce((total, answer) => (answer.isCorrect ? total + 1 : total), 0);
      const displayName = participantNameMap.get(participant.userId) ?? participant.displayName ?? participant.userId;
      scoreMap.set(participant.userId, {
        userId: participant.userId,
        displayName,
        score,
      });
    });

    return Array.from(scoreMap.values()).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.displayName.localeCompare(b.displayName);
    });
  }, [participants, state.participants, participantNameMap]);

  const statusLabel = useMemo(() => {
    switch (state.status) {
      case "question":
        return "回答受付中";
      case "answers_locked":
        return "集計中";
      case "reveal":
        return "結果表示中";
      case "finished":
        return "終了";
      case "lobby":
        return "待機中";
      default:
        return state.status;
    }
  }, [state.status]);

  const countdownLabel = useMemo(() => {
    if (state.remainingSeconds === null) {
      return null;
    }
    switch (state.status) {
      case "question":
        return `残り ${state.remainingSeconds} 秒`;
      case "answers_locked":
        return `結果まで ${state.remainingSeconds} 秒`;
      case "reveal":
        return `次の処理まで ${state.remainingSeconds} 秒`;
      default:
        return null;
    }
  }, [state.status, state.remainingSeconds]);

  if (!sessionId) {
    return <p className="p-6 text-sm text-slate-400">セッションIDが指定されていません。</p>;
  }

  const handleAdvance = async (action: "next" | "forceEnd") => {
    try {
      if (action === "next") {
        await advanceSession(sessionId, { action: "next" });
      } else {
        await advanceSession(sessionId, { action: "forceEnd" });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "操作に失敗しました");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Session {sessionId}</h1>
            <p className="text-sm text-slate-400">状態: {statusLabel}</p>
            {countdownLabel && (
              <p
                className={
                  state.status === "question"
                    ? "text-xs text-emerald-300"
                    : state.status === "answers_locked"
                      ? "text-xs text-amber-300"
                      : "text-xs text-sky-300"
                }
              >
                {countdownLabel}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-400">
            <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-red-400"}`} />
            {connected ? "WebSocket 接続中" : "再接続中..."}
            <button onClick={requestSync} className="rounded border border-slate-700 px-3 py-1 hover:bg-slate-800">
              再同期
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-6xl gap-6 px-6 py-8 md:grid-cols-[2fr_1fr]">
        <section className="space-y-4">
          {error && <p className="rounded bg-red-500/20 px-3 py-2 text-sm text-red-200">{error}</p>}
          {loading ? (
            <p className="text-sm text-slate-400">読み込み中...</p>
          ) : (
            <>
              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 shadow">
                <h2 className="text-lg font-semibold">操作パネル</h2>
                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <button
                    onClick={() =>
                      startSession(sessionId).catch((err) => setError(err instanceof Error ? err.message : "開始に失敗しました"))
                    }
                    className="rounded bg-emerald-500 px-4 py-2 font-medium text-emerald-950 hover:bg-emerald-400"
                  >
                    クイズ開始
                  </button>
                  <button
                    onClick={() => handleAdvance("forceEnd")}
                    className="rounded border border-amber-400 px-4 py-2 text-amber-200 hover:bg-amber-400/10"
                  >
                    現在の問題を終了
                  </button>
                  <button
                    onClick={() => handleAdvance("next")}
                    className="rounded border border-blue-400 px-4 py-2 text-blue-200 hover:bg-blue-400/10"
                  >
                    次の問題へ
                  </button>
                  <div className="flex items-center gap-2">
                    <input
                      value={skipIndex}
                      onChange={(e) => setSkipIndex(e.target.value)}
                      placeholder="問題番号"
                      className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                    />
                    <button
                      onClick={() => {
                        const index = Number(skipIndex);
                        if (!Number.isNaN(index)) {
                          sendAdminAction("skipToQuestion", { questionIndex: index });
                          setSkipIndex("");
                        }
                      }}
                      className="rounded border border-purple-400 px-3 py-1 text-purple-200 hover:bg-purple-400/10"
                    >
                      指定へスキップ
                    </button>
                  </div>
                  <button
                    onClick={() =>
                      cancelSession(sessionId).catch((err) => setError(err instanceof Error ? err.message : "終了に失敗しました"))
                    }
                    className="rounded border border-red-400 px-4 py-2 text-red-200 hover:bg-red-400/10"
                  >
                    セッション終了
                  </button>
                </div>
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                <h2 className="text-lg font-semibold">現在の問題</h2>
                {state.question ? (
                  <div className="mt-3 space-y-3">
                    <div className="flex items-center gap-3 text-slate-300">
                      <span className="rounded bg-slate-800 px-2 py-1 text-xs uppercase">Q{state.questionIndex + 1}</span>
                      {countdownLabel && (
                        <span
                          className={
                            state.status === "question"
                              ? "text-sm text-emerald-300"
                              : state.status === "answers_locked"
                                ? "text-sm text-amber-300"
                                : "text-sm text-sky-300"
                          }
                        >
                          {countdownLabel}
                        </span>
                      )}
                    </div>
                    <p className="text-base text-slate-100">{state.question.text}</p>
                    <ul className="space-y-2 text-sm text-slate-300">
                      {state.question.choices.map((choice) => (
                        <li key={choice.id} className="flex items-center gap-2">
                          <span className="inline-flex h-2 w-2 rounded-full bg-slate-500" />
                          {choice.text}
                        </li>
                      ))}
                    </ul>
                    {state.status === "answers_locked" && (
                      <p className="text-sm text-slate-400">回答受付は終了し、集計中です。</p>
                    )}
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-400">まだ問題が開始されていません。</p>
                )}
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                <h2 className="text-lg font-semibold">集計</h2>
                {currentScores.length > 0 ? (
                  <ol className="mt-3 space-y-2 text-sm">
                    {currentScores.map((participant) => (
                      <li key={participant.userId} className="flex items-center justify-between">
                        <span>{participant.displayName}</span>
                        <span className="font-semibold">{participant.score} 点</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-3 text-sm text-slate-400">まだ参加者がいません。</p>
                )}
              </div>

            </>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm">
            <h2 className="text-base font-semibold">参加者用リンク</h2>
            {participantsLoading ? (
              <p className="mt-2 text-slate-400">読み込み中...</p>
            ) : participantsError ? (
              <p className="mt-2 text-red-300">{participantsError}</p>
            ) : participantLinks.length === 0 ? (
              <p className="mt-2 text-slate-400">登録された参加者がいません。</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {participantLinks.map((participant) => (
                  <li key={participant.id} className="space-y-1 rounded border border-slate-800 bg-slate-950/50 p-3">
                    <p className="text-slate-200">{participant.displayName}</p>
                    <p className="break-all text-xs text-slate-400">{participant.url}</p>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-slate-500">ユーザーごとに固有のリンクを配布してください。</p>
          </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
            <h2 className="text-base font-semibold">参加者</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {state.participants.length === 0 && <li className="text-slate-400">まだ参加者はいません。</li>}
              {state.participants.map((participant) => (
                <li key={participant.userId} className="flex items-center justify-between rounded border border-slate-800 bg-slate-950/50 px-3 py-2">
                  <div>
                    <p className="font-medium text-slate-100">{participant.displayName}</p>
                    <p className="text-xs text-slate-500">ID: {participant.userId}</p>
                  </div>
                  <span
                    className={`text-xs ${participant.connected ? "text-emerald-300" : "text-slate-500"}`}
                  >
                    {participant.connected ? "接続中" : "離脱"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}
