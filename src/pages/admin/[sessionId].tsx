import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import {
  advanceSession,
  cancelSession,
  fetchSessionResults,
  fetchSessionState,
  startSession,
  type SessionResults,
} from "../../lib/api";
import { useQuizSession } from "../../hooks/useQuizSession";

export default function AdminSessionPage() {
  const router = useRouter();
  const { sessionId } = router.query as { sessionId?: string };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SessionResults | null>(null);
  const [skipIndex, setSkipIndex] = useState<string>("");

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
    if (!sessionId) return;
    if (state.status === "finished") {
      fetchSessionResults(sessionId)
        .then(setResults)
        .catch((err) => setError(err instanceof Error ? err.message : "結果の取得に失敗しました"));
    }
  }, [state.status, sessionId]);

  const participantLink = useMemo(() => {
    if (typeof window === "undefined" || !sessionId) return "";
    const origin = window.location.origin;
    return `${origin}/quiz/${sessionId}`;
  }, [sessionId]);

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
            <p className="text-sm text-slate-400">状態: {state.status}</p>
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
                      {state.remainingMs !== null && (
                        <span className="text-sm text-emerald-300">
                          残り {(state.remainingMs / 1000).toFixed(1)} 秒
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
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-400">まだ問題が開始されていません。</p>
                )}
              </div>

              <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                <h2 className="text-lg font-semibold">集計</h2>
                {state.summary ? (
                  <div className="mt-3 space-y-2 text-sm">
                    {Object.entries(state.summary.totals).map(([choiceId, count]) => (
                      <div key={choiceId} className="flex items-center justify-between">
                        <span>{choiceId}</span>
                        <span className="font-semibold">{count} 件</span>
                      </div>
                    ))}
                    <p className="text-xs text-emerald-300">
                      正解: {state.summary.correctChoiceIds.join(", ") || "未設定"}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-400">集計はまだありません。</p>
                )}
              </div>

              {results && (
                <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4">
                  <h2 className="text-lg font-semibold">最終結果</h2>
                  <ol className="mt-3 space-y-2 text-sm">
                    {results.participants.map((participant, index) => (
                      <li key={participant.userId} className="flex items-center justify-between">
                        <span>
                          #{index + 1} {participant.userId}
                        </span>
                        <span className="font-semibold">{participant.score} 点</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 text-sm">
            <h2 className="text-base font-semibold">参加者用リンク</h2>
            <p className="mt-2 break-all text-slate-300">{participantLink || "-"}</p>
            <p className="mt-2 text-xs text-slate-500">リンク先で名前を入力すると参加できます。</p>
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
