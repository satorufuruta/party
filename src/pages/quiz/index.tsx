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

  const revealFeedback = useMemo(() => {
    if (state.status !== "reveal" || !state.question) {
      return null;
    }
    const summary = state.summary;
    if (!summary) {
      return {
        variant: "pending" as const,
        title: "結果を集計しています",
        description: "もう少しお待ちください。",
      };
    }
    const correctChoices = new Set(summary.correctChoiceIds);
    const correctLabels = state.question.choices
      .map((choice, index) => (correctChoices.has(choice.id) ? String.fromCharCode(65 + index) : null))
      .filter((label): label is string => !!label);

    if (!answeredChoiceId) {
      return {
        variant: "neutral" as const,
        title: "正解発表",
        description: correctLabels.length
          ? `正解は ${correctLabels.join(" / ")} です。今回は未回答でした。`
          : "正解情報を取得できませんでした。",
      };
    }

    const selectedIndex = state.question.choices.findIndex((choice) => choice.id === answeredChoiceId);
    const selectedLabel = selectedIndex >= 0 ? String.fromCharCode(65 + selectedIndex) : null;
    const isCorrect = correctChoices.has(answeredChoiceId);

    if (isCorrect) {
      return {
        variant: "correct" as const,
        title: "正解です！",
        description: selectedLabel
          ? `${selectedLabel} を選択しました。`
          : "正しい選択肢を選びました。",
        footer: correctLabels.length > 1 ? `正解: ${correctLabels.join(" / ")}` : undefined,
      };
    }

    return {
      variant: "incorrect" as const,
      title: "残念、不正解でした！",
      description: selectedLabel
        ? `${selectedLabel} を選択しました。`
        : "今回の回答は正解ではありませんでした。",
      footer: correctLabels.length ? `正解: ${correctLabels.join(" / ")}` : undefined,
    };
  }, [state.status, state.summary, state.question, answeredChoiceId]);

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
          <div className="rounded-3xl bg-white px-6 py-3 shadow-xl ring-1 ring-slate-900/5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">披露宴クイズ</h1>
            </div>
            {countdownLabel && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
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
              </div>
            )}

            <div className="mt-2 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
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

        <main className="mt-3 flex-1">
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

              <section className="rounded-3xl bg-white px-6 py-4 shadow-xl ring-1 ring-slate-900/5">
                {state.question ? (
                  <div className="space-y-3">
                    <div className="rounded-2xl bg-slate-50 px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        第 {state.questionIndex + 1} 問
                      </p>
                      <h2 className="mt-2 text-xl font-semibold text-slate-900">{state.question.text}</h2>
                    </div>
                    {revealFeedback && (
                      <div
                        className={`rounded-2xl border px-4 py-2 text-sm sm:text-base ${
                          revealFeedback.variant === "correct"
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : revealFeedback.variant === "incorrect"
                              ? "border-rose-200 bg-rose-50 text-rose-700"
                              : revealFeedback.variant === "pending"
                                ? "border-amber-200 bg-amber-50 text-amber-700"
                                : "border-slate-200 bg-slate-50 text-slate-600"
                        }`}
                      >
                        <p className="text-base font-semibold sm:text-lg">{revealFeedback.title}</p>
                        {revealFeedback.description && (
                          <p className="mt-1 text-sm sm:text-base">{revealFeedback.description}</p>
                        )}
                        {revealFeedback.footer && (
                          <p
                            className={`mt-2 text-xs font-medium sm:text-sm ${
                              revealFeedback.variant === "correct"
                                ? "text-emerald-600"
                                : revealFeedback.variant === "incorrect"
                                  ? "text-rose-600"
                                  : "text-slate-500"
                            }`}
                          >
                            {revealFeedback.footer}
                          </p>
                        )}
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                      {state.question.choices.map((choice, index) => {
                        const palette = CHOICE_COLORS[index % CHOICE_COLORS.length];
                        const textClass = palette.text === "#FFFFFF" ? "text-white" : "text-slate-900";
                        const label = String.fromCharCode(65 + index);
                        const isActive = activeChoiceId === choice.id;
                        const inactiveDimmed = !!activeChoiceId && activeChoiceId !== choice.id;
                        return (
                          <button
                            key={choice.id}
                            type="button"
                            onClick={() => {
                              if (submissionLocked || !currentQuestionId) return;
                              setPendingChoiceId(choice.id);
                            }}
                            aria-pressed={isActive}
                            disabled={submissionLocked}
                            style={{ backgroundColor: palette.background }}
                            className={`transform group relative flex aspect-[3/2] w-full flex-col items-center justify-center rounded-3xl px-6 py-6 text-center text-lg font-semibold leading-snug shadow-lg transition-transform duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-white/70 disabled:cursor-not-allowed ${
                              textClass
                            } ${
                              isActive
                                ? "scale-[1.03] shadow-[0_28px_60px_-16px rgba(15,23,42,0.65)]"
                                : "shadow-lg hover:-translate-y-1 hover:shadow-2xl"
                            } ${inactiveDimmed ? "opacity-40" : "opacity-100"}`}
                          >
                            <span className="text-3xl font-extrabold tracking-wide" style={{ color: palette.text }}>
                              {label}
                            </span>
                            <span className="sr-only">{choice.text}</span>
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
                    {state.status === "question" && answeredChoiceId && (
                      <p className="text-sm font-medium text-slate-700">回答を受け付けました。</p>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 rounded-2xl bg-slate-50 px-6 py-8 text-center text-sm text-slate-500">
                    {"クイズ開始までお待ちください！"}
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
