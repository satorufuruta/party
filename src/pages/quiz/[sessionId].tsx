import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { fetchSessionResults, registerParticipant, type SessionResults } from "../../lib/api";
import { useQuizSession } from "../../hooks/useQuizSession";

interface ParticipantProfile {
  userId: string;
  displayName: string;
}

const storageKey = (sessionId: string) => `party:session:${sessionId}:participant`;

export default function ParticipantPage() {
  const router = useRouter();
  const { sessionId } = router.query as { sessionId?: string };
  const [name, setName] = useState("");
  const [profile, setProfile] = useState<ParticipantProfile | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SessionResults | null>(null);

  useEffect(() => {
    if (!sessionId || typeof window === "undefined") return;
    const stored = window.localStorage.getItem(storageKey(sessionId));
    if (stored) {
      setProfile(JSON.parse(stored));
    }
  }, [sessionId]);

  const { state, submitAnswer, connected, error: socketError } = useQuizSession({
    sessionId: sessionId ?? "",
    role: "participant",
    userId: profile?.userId,
    displayName: profile?.displayName,
  });

  useEffect(() => {
    if (!sessionId) return;
    if (state.status === "finished") {
      fetchSessionResults(sessionId)
        .then(setResults)
        .catch((err) => setError(err instanceof Error ? err.message : "結果の取得に失敗しました"));
    }
  }, [state.status, sessionId]);

  const selfParticipant = useMemo(() => {
    if (!profile) return null;
    return state.participants.find((p) => p.userId === profile.userId) ?? null;
  }, [profile, state.participants]);

  const currentQuestionId = state.question?.id;
  const currentAnswer = currentQuestionId ? selfParticipant?.answers?.[currentQuestionId] : undefined;

  const handleJoin = async (event: FormEvent) => {
    event.preventDefault();
    if (!sessionId) return;
    if (!name.trim()) {
      setError("名前を入力してください");
      return;
    }
    try {
      const response = await registerParticipant(sessionId, { name: name.trim(), displayName: name.trim() });
      const profileData: ParticipantProfile = { userId: response.userId, displayName: response.displayName };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(storageKey(sessionId), JSON.stringify(profileData));
      }
      setProfile(profileData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "参加登録に失敗しました");
    }
  };

  const joinStep = !profile;

  if (!sessionId) {
    return <p className="p-6 text-sm text-slate-400">セッションIDが指定されていません。</p>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-8">
        <header className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold">Party Quiz</h1>
          <p className="text-sm text-slate-400">セッション {sessionId}</p>
          <div className="mx-auto flex items-center gap-2 text-xs text-slate-500">
            <span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-red-400"}`} />
            {connected ? "接続中" : "接続待機中"}
          </div>
        </header>

        <main className="mt-8 flex-1">
          {error && <p className="mb-4 rounded bg-red-500/20 px-3 py-2 text-sm text-red-200">{error}</p>}
          {socketError && <p className="mb-4 rounded bg-red-500/20 px-3 py-2 text-sm text-red-200">{socketError}</p>}

          {joinStep ? (
            <form onSubmit={handleJoin} className="mx-auto mt-12 max-w-sm space-y-4 rounded-lg border border-slate-800 bg-slate-900/60 p-6">
              <label className="flex flex-col gap-2 text-sm text-slate-300">
                表示名
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="例: 山田 太郎"
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-base text-slate-100"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded bg-emerald-500 px-4 py-2 font-semibold text-emerald-950 hover:bg-emerald-400"
              >
                参加する
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
                <header className="flex items-center justify-between text-sm text-slate-400">
                  <span>ステータス: {state.status}</span>
                  {state.remainingMs !== null && state.status === "question" && (
                    <span className="text-emerald-300">残り {(state.remainingMs / 1000).toFixed(1)} 秒</span>
                  )}
                </header>
                {state.question ? (
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="text-sm text-slate-400">第 {state.questionIndex + 1} 問</p>
                      <h2 className="mt-2 text-lg font-semibold">{state.question.text}</h2>
                    </div>
                    <div className="space-y-3">
                      {state.question.choices.map((choice) => {
                        const isSelected = currentAnswer?.choiceId === choice.id;
                        return (
                          <button
                            key={choice.id}
                            onClick={() => {
                              if (!currentQuestionId || currentAnswer) return;
                              submitAnswer(currentQuestionId, choice.id);
                            }}
                            disabled={!!currentAnswer || state.status !== "question"}
                            className={`w-full rounded border px-4 py-3 text-left text-base transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70 ${
                              isSelected ? "border-emerald-400 bg-emerald-400/10" : "border-slate-700 bg-slate-900"
                            }`}
                          >
                            {choice.text}
                          </button>
                        );
                      })}
                    </div>
                    {currentAnswer && (
                      <p className={`text-sm font-medium ${currentAnswer.isCorrect ? "text-emerald-300" : "text-red-300"}`}>
                        {currentAnswer.isCorrect ? "正解です！" : "残念ながら不正解です"}
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="mt-6 text-sm text-slate-400">問題が開始されるまでお待ちください。</p>
                )}
              </section>

              {state.status === "reveal" && state.summary && (
                <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-5 text-sm">
                  <h3 className="text-base font-semibold">結果</h3>
                  <p className="mt-2 text-emerald-300">
                    正解: {state.summary.correctChoiceIds.join(", ") || "-"}
                  </p>
                  <ul className="mt-2 space-y-1 text-slate-300">
                    {Object.entries(state.summary.totals).map(([choiceId, total]) => (
                      <li key={choiceId} className="flex items-center justify-between">
                        <span>{choiceId}</span>
                        <span>{total} 人</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {results && (
                <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-5 text-sm">
                  <h3 className="text-base font-semibold">最終スコア</h3>
                  <ol className="mt-3 space-y-2">
                    {results.participants.map((participant, index) => (
                      <li key={participant.userId} className="flex items-center justify-between">
                        <span>
                          #{index + 1} {participant.userId}
                        </span>
                        <span className="font-semibold">{participant.score} 点</span>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
