import { FormEvent, useEffect, useMemo, useState } from "react";
import { ApiError, fetchCurrentUser, identifyParticipant, type UserProfile } from "../../lib/api";
import { useQuizSession } from "../../hooks/useQuizSession";

const SESSION_ID = process.env.NEXT_PUBLIC_DEFAULT_SESSION_ID ?? "";

export default function ParticipantPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userLoading, setUserLoading] = useState(true);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);

  const [familyName, setFamilyName] = useState("");
  const [givenName, setGivenName] = useState("");
  const [identifyError, setIdentifyError] = useState<string | null>(null);
  const [identifyLoading, setIdentifyLoading] = useState(false);

  const [error] = useState<string | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      setUserLoading(true);
      try {
        const profile = await fetchCurrentUser();
        setUser(profile);
        setNeedsLogin(false);
        setUserError(null);
      } catch (err) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
          setUser(null);
          setNeedsLogin(true);
          setUserError(null);
        } else {
          setUser(null);
          setNeedsLogin(false);
          setUserError(err instanceof Error ? err.message : "参加者情報の取得に失敗しました");
        }
      } finally {
        setUserLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleIdentify = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!familyName.trim() || !givenName.trim()) {
      setIdentifyError("苗字と名前を入力してください。");
      return;
    }
    setIdentifyLoading(true);
    setIdentifyError(null);
    try {
      const profile = await identifyParticipant(familyName, givenName);
      setUser(profile);
      setNeedsLogin(false);
      setUserError(null);
      setFamilyName("");
      setGivenName("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setIdentifyError("参加者情報が見つかりませんでした。入力内容をご確認ください。");
      } else {
        setIdentifyError(err instanceof Error ? err.message : "参加者の確認に失敗しました。");
      }
    } finally {
      setIdentifyLoading(false);
    }
  };

  const { state, submitAnswer, connected, error: socketError } = useQuizSession({
    sessionId: SESSION_ID,
    role: "participant",
    userId: user?.id,
    displayName: user?.displayName,
  });

  const selfParticipant = useMemo(() => {
    if (!user) return null;
    return state.participants.find((participant) => participant.userId === user.id) ?? null;
  }, [user, state.participants]);

  const currentQuestionId = state.question?.id ?? null;
  const currentAnswer = currentQuestionId ? selfParticipant?.answers?.[currentQuestionId] : undefined;

  const statusLabel = useMemo(() => {
    switch (state.status) {
      case "question":
        return "回答受付中";
      case "answers_locked":
        return "集計中";
      case "reveal":
        return "結果発表中";
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
        return `次の問題まで ${state.remainingSeconds} 秒`;
      default:
        return null;
    }
  }, [state.status, state.remainingSeconds]);

  if (!SESSION_ID) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-8">
          <header className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold">Party Quiz</h1>
            <p className="text-sm text-red-300">環境変数 NEXT_PUBLIC_DEFAULT_SESSION_ID が設定されていません。</p>
          </header>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-8">
        <header className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold">Party Quiz</h1>
          <p className="text-sm text-slate-400">セッション {SESSION_ID}</p>
          <div className="mx-auto flex items-center gap-2 text-xs text-slate-500">
            <span
              className={`h-2 w-2 rounded-full ${
                user
                  ? connected
                    ? "bg-emerald-400"
                    : "bg-amber-400"
                  : needsLogin
                    ? "bg-slate-500"
                    : "bg-red-400"
              }`}
            />
            {user
              ? connected
                ? "接続中"
                : "接続待機中"
              : needsLogin
                ? "参加者確認待ち"
                : "参加者情報を確認中"}
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {userLoading
              ? "参加者情報を確認しています..."
              : userError
                ? userError
                : user
                  ? `参加者: ${user.displayName}`
                  : needsLogin
                    ? "参加には苗字と名前を入力してください。"
                    : "参加者情報が見つかりません。"}
          </div>
        </header>

        <main className="mt-8 flex-1">
          {needsLogin ? (
            <section className="mx-auto max-w-md rounded-lg border border-slate-800 bg-slate-900/60 p-6">
              <h2 className="text-lg font-semibold text-slate-100">クイズに参加する</h2>
              <p className="mt-2 text-sm text-slate-400">
                お名前を入力して「クイズに参加」を押してください。同じ端末では3時間、このページを開くだけで参加できます。
              </p>
              <form className="mt-6 space-y-4" onSubmit={handleIdentify}>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col text-sm text-slate-300">
                    <span className="text-xs text-slate-500">苗字</span>
                    <input
                      type="text"
                      value={familyName}
                      onChange={(event) => setFamilyName(event.target.value)}
                      className="mt-1 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-400 focus:outline-none"
                      autoComplete="family-name"
                      required
                    />
                  </label>
                  <label className="flex flex-col text-sm text-slate-300">
                    <span className="text-xs text-slate-500">名前</span>
                    <input
                      type="text"
                      value={givenName}
                      onChange={(event) => setGivenName(event.target.value)}
                      className="mt-1 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-emerald-400 focus:outline-none"
                      autoComplete="given-name"
                      required
                    />
                  </label>
                </div>
                {identifyError && (
                  <p className="rounded border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                    {identifyError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={identifyLoading}
                  className="w-full rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {identifyLoading ? "確認中..." : "クイズに参加"}
                </button>
              </form>
            </section>
          ) : userLoading ? (
            <p className="mt-12 text-center text-sm text-slate-400">読み込み中...</p>
          ) : userError ? (
            <p className="mt-12 text-center text-sm text-red-300">{userError}</p>
          ) : !user ? (
            <p className="mt-12 text-center text-sm text-slate-400">参加者情報が見つかりません。</p>
          ) : (
            <div className="space-y-6">
              {error && (
                <p className="mb-4 rounded bg-red-500/20 px-3 py-2 text-sm text-red-200">
                  {error}
                </p>
              )}
              {socketError && (
                <p className="mb-4 rounded bg-red-500/20 px-3 py-2 text-sm text-red-200">
                  {socketError}
                </p>
              )}

              <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-5">
                <header className="flex items-center justify-between text-sm text-slate-400">
                  <span>ステータス: {statusLabel}</span>
                  {countdownLabel && (
                    <span
                      className={
                        state.status === "question"
                          ? "text-emerald-300"
                          : state.status === "answers_locked"
                            ? "text-amber-300"
                            : "text-sky-300"
                      }
                    >
                      {countdownLabel}
                    </span>
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
                    {state.status === "answers_locked" && (
                      <p className="text-sm text-slate-300">
                        回答受付は終了しました。結果が表示されるまでお待ちください。
                      </p>
                    )}
                    {currentAnswer && state.status === "answers_locked" && (
                      <p className="text-sm font-medium text-slate-300">回答を受け付けました。</p>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 rounded border border-slate-800 bg-slate-950/50 p-6 text-center text-sm text-slate-400">
                    {state.status === "lobby" ? "現在待機中です。開始までお待ちください。" : "次の問題を待機しています。"}
                  </div>
                )}
              </section>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
