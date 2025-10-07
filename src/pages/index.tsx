import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { createSession, fetchQuizDetail, fetchQuizzes } from "../lib/api";
import type { QuizDetail, QuizSummary } from "../lib/api";

interface QuizWithQuestions extends QuizSummary {
  questions?: QuizDetail["questions"];
  open?: boolean;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState<QuizWithQuestions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState<string | null>(null);
  const [autoProgress, setAutoProgress] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const list = await fetchQuizzes();
        setQuizzes(list);
      } catch (err) {
        setError(err instanceof Error ? err.message : "クイズ一覧の取得に失敗しました");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleQuiz = async (quiz: QuizWithQuestions) => {
    if (quiz.open && quiz.questions) {
      setQuizzes((prev) => prev.map((q) => (q.id === quiz.id ? { ...q, open: false } : q)));
      return;
    }

    try {
      const detail = await fetchQuizDetail(quiz.id);
      setQuizzes((prev) =>
        prev.map((q) =>
          q.id === quiz.id
            ? { ...q, open: true, questions: detail.questions }
            : { ...q, open: q.open }
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "クイズ詳細の取得に失敗しました");
    }
  };

  const handleCreateSession = async (quizId: string) => {
    setCreating(quizId);
    setError(null);
    try {
      const session = await createSession(quizId, { autoProgress });
      router.push(`/admin/${session.sessionId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "セッションの作成に失敗しました");
    } finally {
      setCreating(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/70 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Quiz Admin Console</h1>
          <div className="flex items-center gap-3 text-sm">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={autoProgress}
                onChange={(e) => setAutoProgress(e.target.checked)}
                className="h-4 w-4"
              />
              自動進行
            </label>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-6 py-8">
        {error && <p className="mb-4 rounded bg-red-500/20 px-4 py-2 text-sm text-red-200">{error}</p>}
        {loading ? (
          <p className="text-sm text-slate-400">読み込み中...</p>
        ) : quizzes.length === 0 ? (
          <p className="text-sm text-slate-400">登録されたクイズがありません。API やシードでクイズを作成してください。</p>
        ) : (
          <div className="space-y-4">
            {quizzes.map((quiz) => (
              <section key={quiz.id} className="rounded-lg border border-slate-800 bg-slate-900/60 p-5 shadow">
                <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold">{quiz.title}</h2>
                    {quiz.description && <p className="text-sm text-slate-400">{quiz.description}</p>}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => toggleQuiz(quiz)}
                      className="rounded border border-slate-700 px-3 py-1 text-sm hover:bg-slate-800"
                    >
                      {quiz.open ? "詳細を閉じる" : "詳細を表示"}
                    </button>
                    <button
                      onClick={() => handleCreateSession(quiz.id)}
                      disabled={creating === quiz.id}
                      className="rounded bg-emerald-500 px-3 py-1 text-sm font-medium text-emerald-950 hover:bg-emerald-400 disabled:opacity-60"
                    >
                      {creating === quiz.id ? "作成中..." : "セッション開始"}
                    </button>
                  </div>
                </header>
                {quiz.open && quiz.questions && (
                  <ul className="mt-4 space-y-3 text-sm">
                    {quiz.questions.map((question, index) => (
                      <li key={question.id} className="rounded border border-slate-800 bg-slate-950/40 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-slate-300">
                          <span className="font-medium">Q{index + 1}</span>
                          <span className="flex items-center gap-3 text-xs sm:text-sm">
                            <span>制限 {question.timeLimitSec} 秒</span>
                            <span>待機 {question.revealDurationSec} 秒</span>
                          </span>
                        </div>
                        <p className="mt-2 text-slate-100">{question.text}</p>
                        <ol className="mt-2 space-y-1 text-slate-400">
                          {question.choices.map((choice) => (
                            <li key={choice.id} className="flex items-center gap-2">
                              <span className="inline-flex h-2 w-2 rounded-full bg-slate-600" />
                              {choice.text}
                              {choice.isCorrect && (
                                <span className="ml-2 rounded-full bg-emerald-500/20 px-2 text-xs text-emerald-300">正解</span>
                              )}
                            </li>
                          ))}
                        </ol>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
