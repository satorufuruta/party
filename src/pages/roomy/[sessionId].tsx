import { useCallback, useEffect, useMemo, useState } from "react";
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
  const [rankingOpen, setRankingOpen] = useState(false);
  const [revealedCount, setRevealedCount] = useState(0);

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

  const formatElapsedSeconds = useCallback((ms?: number) => {
    if (typeof ms !== "number" || !Number.isFinite(ms)) {
      return "-";
    }
    const seconds = Math.max(0, ms) / 1000;
    if (seconds >= 10) {
      return `${seconds.toFixed(1)} 秒`;
    }
    return `${seconds.toFixed(2)} 秒`;
  }, []);

  const currentScores = useMemo(() => {
    const scoreMap = new Map<
      string,
      {
        userId: string;
        displayName: string;
        score: number;
        totalElapsedMs: number;
      }
    >();

    participants.forEach((participant) => {
      scoreMap.set(participant.id, {
        userId: participant.id,
        displayName: participant.displayName,
        score: 0,
        totalElapsedMs: 0,
      });
    });

    state.participants.forEach((participant) => {
      const answers = Object.values(participant.answers ?? {});
      const score =
        typeof participant.score === "number"
          ? participant.score
          : answers.reduce((total, answer) => (answer?.isCorrect ? total + 1 : total), 0);
      const totalElapsedMs =
        typeof participant.totalElapsedMs === "number"
          ? participant.totalElapsedMs
          : answers.reduce(
              (total, answer) =>
                total + (answer && typeof answer.elapsedMs === "number" && answer.elapsedMs >= 0 ? answer.elapsedMs : 0),
              0
            );
      const displayName = participantNameMap.get(participant.userId) ?? participant.displayName ?? participant.userId;
      scoreMap.set(participant.userId, {
        userId: participant.userId,
        displayName,
        score,
        totalElapsedMs,
      });
    });

    return Array.from(scoreMap.values()).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.totalElapsedMs !== b.totalElapsedMs) return a.totalElapsedMs - b.totalElapsedMs;
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

  const topThree = useMemo(() => currentScores.slice(0, 3), [currentScores]);

  const rankedParticipants = useMemo(() => {
    const rankLabels = ["第1位", "第2位", "第3位"];
    const base = topThree.map((participant, index) => ({
      label: rankLabels[index] ?? `第${index + 1}位`,
      participant,
      rank: index + 1,
    }));
    const revealOrder = [...base].sort((a, b) => b.rank - a.rank);
    const revealStepMap = new Map<number, number>();
    revealOrder.forEach((entry, index) => {
      revealStepMap.set(entry.rank, index + 1);
    });
    return base.map((entry) => ({
      ...entry,
      revealStep: revealStepMap.get(entry.rank) ?? base.length,
    }));
  }, [topThree]);

  const openRanking = useCallback(() => {
    setRankingOpen(true);
    setRevealedCount(0);
    if (typeof document !== "undefined" && typeof document.documentElement.requestFullscreen === "function") {
      document.documentElement.requestFullscreen().catch(() => {
        // Ignore fullscreen failures (e.g. unsupported browser)
      });
    }
  }, []);

  const closeRanking = useCallback(() => {
    setRankingOpen(false);
    if (typeof document !== "undefined" && document.fullscreenElement && typeof document.exitFullscreen === "function") {
      document.exitFullscreen().catch(() => {
        // Ignore exit failures
      });
    }
  }, []);

  useEffect(() => {
    if (!rankingOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Enter") {
        event.preventDefault();
        setRevealedCount((prev) => {
          const limit = rankedParticipants.length;
          return prev >= limit ? limit : prev + 1;
        });
      }
      if (event.key === "Escape") {
        event.preventDefault();
        closeRanking();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [rankingOpen, rankedParticipants.length, closeRanking]);

  const allRevealed = rankedParticipants.length > 0 && revealedCount >= rankedParticipants.length;

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
                <button
                  type="button"
                  onClick={openRanking}
                  className="flex w-full items-center justify-between gap-4 rounded border border-transparent bg-slate-900/30 px-3 py-2 text-left transition hover:border-slate-600 hover:bg-slate-900/60 focus:outline-none focus:ring-2 focus:ring-slate-500"
                >
                  <span className="text-lg font-semibold text-slate-100">集計</span>
                  <span className="text-xs text-slate-400">Enterでトップ3を順次表示</span>
                </button>
                {currentScores.length > 0 ? (
                  <ol className="mt-3 space-y-2 text-sm">
                    {currentScores.map((participant) => (
                      <li key={participant.userId} className="flex items-center justify-between">
                        <span>{participant.displayName}</span>
                        <div className="text-right">
                          <span className="block font-semibold">{participant.score} 点</span>
                          <span className="block text-xs text-slate-400">合計 {formatElapsedSeconds(participant.totalElapsedMs)}</span>
                        </div>
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

      {rankingOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-100">
          <div className="flex items-center justify-between px-6 py-4">
            <p className="text-sm text-slate-400">Enter で順位を進める / Esc で閉じる</p>
            <button
              type="button"
              onClick={closeRanking}
              className="rounded border border-slate-700 px-3 py-1 text-xs font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800/80"
            >
              閉じる
            </button>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center gap-12 px-6 text-center">
            {rankedParticipants.length === 0 ? (
              <p className="text-xl text-slate-400">表示できる参加者がいません。</p>
            ) : (
              <div className="flex flex-col items-center gap-10">
                {rankedParticipants.map((entry) => {
                  const isVisible = revealedCount >= entry.revealStep;
                  if (!isVisible) {
                    return null;
                  }

                  const accentColor = entry.rank === 1 ? "text-amber-300" : entry.rank === 2 ? "text-slate-100" : "text-slate-300";
                  return (
                    <div
                      key={entry.rank}
                      className="max-w-3xl rounded-xl border border-slate-800 bg-slate-950/60 px-10 py-8 shadow-xl"
                    >
                      <p className="text-sm uppercase tracking-[0.4em] text-slate-500">{entry.label}</p>
                      <p className={`mt-3 text-6xl font-bold ${accentColor}`}>{entry.participant.displayName}</p>
                      <p className="mt-4 text-2xl font-semibold text-emerald-300">{entry.participant.score} 点</p>
                      <p className="mt-1 text-sm text-slate-400">回答所要時間合計 {formatElapsedSeconds(entry.participant.totalElapsedMs)}</p>
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-sm text-slate-400">
              {rankedParticipants.length === 0
                ? "Escキーで終了"
                : allRevealed
                  ? "Escキーで終了"
                  : revealedCount === 0
                    ? "Enterキーで発表を開始"
                    : "Enterキーで次の順位を表示"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
