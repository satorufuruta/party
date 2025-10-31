import { FormEvent, useEffect, useMemo, useState } from "react";
import { ApiError, fetchCurrentUser, identifyParticipant, type UserProfile } from "../../lib/api";
import { useQuizSession } from "../../hooks/useQuizSession";

const SESSION_ID = process.env.NEXT_PUBLIC_DEFAULT_SESSION_ID ?? "";

const CHOICE_COLORS = [
  { background: "#1D74E6", text: "#FFFFFF" },
  { background: "#5B9F17", text: "#FFFFFF" },
  { background: "#DFE331", text: "#1F2937" },
  { background: "#D54343", text: "#FFFFFF" },
] as const;

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
  const [pendingChoiceId, setPendingChoiceId] = useState<string | null>(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

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

  useEffect(() => {
    setPendingChoiceId(currentAnswer?.choiceId ?? null);
    setSubmittingAnswer(false);
  }, [state.question?.id]);

  useEffect(() => {
    if (currentAnswer) {
      setPendingChoiceId(currentAnswer.choiceId);
      setSubmittingAnswer(false);
    }
  }, [currentAnswer]);

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

  useEffect(() => {
    if (state.status !== "question") {
      setSubmittingAnswer(false);
    }
  }, [state.status]);

  const answeredChoiceId = currentAnswer?.choiceId ?? null;
  const submissionLocked = submittingAnswer || !!answeredChoiceId || state.status !== "question";
  const activeChoiceId = answeredChoiceId ?? pendingChoiceId;
  const showSubmitButton = state.status === "question" && !answeredChoiceId;
  const submitButtonDisabled = !pendingChoiceId || submittingAnswer || !currentQuestionId;

  if (!SESSION_ID) {
    return (
      <div className="min-h-screen bg-slate-100 text-slate-900">
        <div className="mx-auto flex min-h-screen max-w-3xl flex-col px-5 py-8">
          <header className="flex flex-col gap-2 text-center">
            <h1 className="text-2xl font-semibold">Party Quiz</h1>
            <p className="text-sm text-red-500">環境変数 NEXT_PUBLIC_DEFAULT_SESSION_ID が設定されていません。</p>
          </header>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-4xl flex-col px-4 pb-12 pt-8 sm:px-6 lg:px-8">
        <header className="space-y-4">
          <div className="rounded-3xl bg-white px-6 py-6 shadow-xl ring-1 ring-slate-900/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Party Quiz</h1>
              <span className="text-sm font-medium text-slate-500">セッション {SESSION_ID}</span>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                  <span
                    className={`h-2.5 w-2.5 rounded-full ${
                      user
                        ? connected
                          ? "bg-emerald-400"
                          : "bg-amber-400"
                        : needsLogin
                          ? "bg-slate-400"
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
                </span>
                <span>
                  ステータス: <span className="font-semibold text-slate-700">{statusLabel}</span>
                </span>
              </div>
              {countdownLabel && (
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    state.status === "question"
                      ? "bg-blue-50 text-blue-600"
                      : state.status === "answers_locked"
                        ? "bg-amber-50 text-amber-600"
                        : "bg-emerald-50 text-emerald-600"
                  }`}
                >
                  {countdownLabel}
                </span>
              )}
            </div>
            <div className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
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
          </div>
        </header>

        <main className="mt-8 flex-1">
          {needsLogin ? (
            <section className="mx-auto max-w-md rounded-3xl bg-white px-6 py-6 shadow-xl ring-1 ring-slate-900/5">
              <h2 className="text-lg font-semibold text-slate-900">クイズに参加する</h2>
              <p className="mt-2 text-sm text-slate-500">
                お名前を入力して「クイズに参加」を押してください。同じ端末では3時間、このページを開くだけで参加できます。
              </p>
              <form className="mt-6 space-y-4" onSubmit={handleIdentify}>
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col text-sm text-slate-700">
                    <span className="text-xs font-medium text-slate-500">苗字</span>
                    <input
                      type="text"
                      value={familyName}
                      onChange={(event) => setFamilyName(event.target.value)}
                      className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      autoComplete="family-name"
                      required
                    />
                  </label>
                  <label className="flex flex-col text-sm text-slate-700">
                    <span className="text-xs font-medium text-slate-500">名前</span>
                    <input
                      type="text"
                      value={givenName}
                      onChange={(event) => setGivenName(event.target.value)}
                      className="mt-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200"
                      autoComplete="given-name"
                      required
                    />
                  </label>
                </div>
                {identifyError && (
                  <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                    {identifyError}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={identifyLoading}
                  className="w-full rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {identifyLoading ? "確認中..." : "クイズに参加"}
                </button>
              </form>
            </section>
          ) : userLoading ? (
            <p className="mt-12 text-center text-sm text-slate-500">読み込み中...</p>
          ) : userError ? (
            <p className="mt-12 text-center text-sm text-red-500">{userError}</p>
          ) : !user ? (
            <p className="mt-12 text-center text-sm text-slate-500">参加者情報が見つかりません。</p>
          ) : (
            <div className="space-y-6">
              {error && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {error}
                </p>
              )}
              {socketError && (
                <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                  {socketError}
                </p>
              )}

              <section className="rounded-3xl bg-white px-6 py-6 shadow-xl ring-1 ring-slate-900/5">
                {state.question ? (
                  <div className="space-y-6">
                    <div className="rounded-2xl bg-slate-50 px-4 py-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        第 {state.questionIndex + 1} 問
                      </p>
                      <h2 className="mt-3 text-xl font-semibold text-slate-900">{state.question.text}</h2>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {state.question.choices.map((choice, index) => {
                        const palette = CHOICE_COLORS[index % CHOICE_COLORS.length];
                        const textClass = palette.text === "#FFFFFF" ? "text-white" : "text-slate-900";
                        const label = String.fromCharCode(65 + index);
                        const isActive = activeChoiceId === choice.id;
                        const isFinalized = answeredChoiceId === choice.id;
                        return (
                          <button
                            key={choice.id}
                            type="button"
                            onClick={() => {
                              if (submissionLocked || !currentQuestionId) return;
                              setPendingChoiceId(choice.id);
                            }}
                            aria-pressed={isActive}
                            disabled={submissionLocked && !isFinalized}
                            style={{ backgroundColor: palette.background }}
                            className={`transform group relative flex min-h-[140px] flex-col justify-center rounded-3xl px-6 py-6 text-left text-lg font-semibold leading-snug shadow-lg transition-transform duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/70 disabled:cursor-not-allowed ${
                              textClass
                            } ${
                              isActive
                                ? isFinalized
                                  ? "ring-4 ring-white/90"
                                  : "ring-4 ring-white/75 ring-offset-2 ring-offset-white"
                                : "ring-4 ring-transparent"
                            } ${
                              submissionLocked && !isFinalized ? "opacity-90" : "hover:-translate-y-1 hover:shadow-2xl"
                            }`}
                          >
                            <span className="absolute left-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white text-sm font-semibold text-slate-700 shadow">
                              {label}
                            </span>
                            <span className="break-words pr-2 text-base font-semibold leading-relaxed sm:text-lg sm:leading-relaxed">
                              {choice.text}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    {showSubmitButton && (
                      <div className="flex flex-col items-center gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            if (submitButtonDisabled || !currentQuestionId || !pendingChoiceId) return;
                            setSubmittingAnswer(true);
                            submitAnswer(currentQuestionId, pendingChoiceId);
                          }}
                          disabled={submitButtonDisabled}
                          className="w-full max-w-xs rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
                        >
                          {submittingAnswer ? "送信中..." : "回答する"}
                        </button>
                        <p className="text-xs text-slate-500">
                          {pendingChoiceId
                            ? "内容に問題なければ「回答する」を押してください。"
                            : "選択肢を選んで「回答する」を押してください。"}
                        </p>
                      </div>
                    )}
                    {state.status === "answers_locked" && (
                      <p className="text-sm text-slate-600">
                        回答受付は終了しました。結果が表示されるまでお待ちください。
                      </p>
                    )}
                    {currentAnswer && state.status === "answers_locked" && (
                      <p className="text-sm font-medium text-slate-700">回答を受け付けました。</p>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
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
