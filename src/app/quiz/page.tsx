"use client"



import { useEffect, useMemo, useState, useRef } from "react";
import VotingLayout from "@/components/ui/VotingLayout";
import { useSession } from "@/lib/auth-client";

type Option = { id: number; text: string; order: number };
type Question = { id: number; text: string; order: number; options: Option[] };

// Advanced modular QuizComponent
type QuizComponentProps = {
  questions: Question[];
  answers: Record<number, number>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  currentQ: number;
  setCurrentQ: React.Dispatch<React.SetStateAction<number>>;
  message: string | null;
  submitQuiz: () => void;
  submitting: boolean;
  quizActive: boolean;
  timeLeft: number;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
};

const QuizComponent: React.FC<QuizComponentProps> = ({
  questions,
  answers,
  setAnswers,
  currentQ,
  setCurrentQ,
  message,
  submitQuiz,
  submitting,
  quizActive,
  timeLeft,
  isFullscreen,
  toggleFullscreen
}) => {
  return (
    <VotingLayout header="Leader Quiz Portal" subheader="Leader-only access • You are answering on behalf of your team • 15 questions • 30 mins • Max 60 points • Token trade-offs per option" showRules={false}>
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-white">
        <div className="flex items-center gap-3">
          <button
            className="ml-2 rounded-md border border-border px-2 py-1 text-xs hover:bg-accent text-white"
            onClick={toggleFullscreen}
          >{isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}</button>
        </div>
        <div className="rounded-md border border-border px-3 py-1 text-sm text-white">Time Left: {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</div>
      </div>
      <div className="mt-8 flex gap-8 items-start text-white">
        {/* Sidebar grid navigation */}
        <div className="flex flex-col gap-3">
          {questions.map((q: Question, idx: number) => (
            <button
              key={q.id}
              className={`rounded-lg border px-4 py-3 text-base font-semibold transition-all duration-150 text-white ${currentQ===idx?"bg-primary text-primary-foreground border-primary":"bg-card border-border hover:bg-accent"} ${answers[q.id]?"ring-2 ring-primary":""}`}
              onClick={() => setCurrentQ(idx)}
            >Q{q.order}</button>
          ))}
        </div>
        {/* Main question area */}
        <div className="flex-1 text-white">
          <div className="flex items-center justify-between mb-2">
            <button
              className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent text-white"
              onClick={() => setCurrentQ(currentQ > 0 ? currentQ - 1 : 0)}
              disabled={currentQ === 0}
            >Prev</button>
            <span className="text-sm text-white">Question {questions[currentQ]?.order ?? currentQ+1} / 15</span>
            <button
              className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent text-white"
              onClick={() => setCurrentQ(currentQ < questions.length - 1 ? currentQ + 1 : currentQ)}
              disabled={currentQ === questions.length - 1}
            >Next</button>
          </div>
          {questions.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4 text-white">
              <p className="font-medium text-white">Q{questions[currentQ].order}. {questions[currentQ].text}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {questions[currentQ].options.sort((a: Option, b: Option) => a.order - b.order).map((opt: Option) => (
                  <label key={opt.id} className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-2 hover:bg-accent text-white">
                    <input
                      type="radio"
                      name={`q-${questions[currentQ].id}`}
                      checked={answers[questions[currentQ].id] === opt.id}
                      onChange={() => setAnswers((prev: Record<number, number>) => ({ ...prev, [questions[currentQ].id]: opt.id }))}
                    />
                    <span className="text-sm text-white">{opt.text}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {/* Submission and feedback */}
          {message && <p className="mt-4 rounded-md border border-border bg-card px-3 py-2 text-sm text-white">{message}</p>}
          <button
            onClick={submitQuiz}
            disabled={submitting || Object.keys(answers).length !== 15 || !quizActive}
            className="mt-6 inline-flex items-center rounded-md bg-primary px-5 py-2.5 font-medium text-white hover:opacity-90 disabled:opacity-50"
          >{quizActive ? (submitting?"Submitting...":"Submit Quiz") : "Quiz Not Active"}</button>
        </div>
      </div>
    </VotingLayout>
  );
};

export default function QuizPage() {
  const { data: session, isPending } = useSession();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<number, number>>({}); // questionId -> optionId
  const [teamId, setTeamId] = useState<number | null>(null);
  const [quizActive, setQuizActive] = useState<boolean>(true);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [currentQ, setCurrentQ] = useState(0); // question navigation
  const [isFullscreen, setIsFullscreen] = useState(false);
  const quizRef = useRef<HTMLDivElement>(null);


  // All hooks at top, never conditionally
  // Only one useEffect for clearing timer after submit

  useEffect(() => {
    if (!quizRef.current) return;
    const handleFsChange = () => {
      setIsFullscreen(document.fullscreenElement === quizRef.current);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  useEffect(() => {
    const sid = (session as any)?.user?.teamId;
    if (sid && !teamId) setTeamId(Number(sid));
  }, [session, teamId]);

  useEffect(() => {
    const fetchQuizStatus = async () => {
      try {
        const res = await fetch("/api/rounds");
        const rounds = await res.json();
        const quizRound = rounds.find((r: any) => r.name === "QUIZ");
        setQuizActive(quizRound?.status === "ACTIVE");
      } catch {
        setQuizActive(false);
      }
    };
    fetchQuizStatus();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/questions");
      const data = await res.json();
      setQuestions(data);
    };
    fetchData();
  }, []);

  // Persist timer in localStorage so it doesn't reset on refresh
  useEffect(() => {
    // On mount, restore timer
    const stored = localStorage.getItem('quiz_time_left');
    if (stored && !showResult) {
      setTimeLeft(Number(stored));
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        const next = t > 0 ? t - 1 : 0;
        localStorage.setItem('quiz_time_left', String(next));
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [showResult]);

    useEffect(() => {
      if (showResult) localStorage.removeItem('quiz_time_left');
    }, [showResult]);

    const toggleFullscreen = () => {
      if (!quizRef.current) return;
      if (!isFullscreen) quizRef.current.requestFullscreen();
      else document.exitFullscreen();
    };

    const isLeader = useMemo(() => session?.user?.roles?.includes?.("LEADER") ?? false, [session]);
  const submitQuiz = async () => {
    if (!quizActive) { setMessage("Quiz is not active. Please wait for admin to start."); return; }
    if (!teamId) { setMessage("Team ID not found. Please sign in again."); return; }
    if (Object.keys(answers).length !== 15) { setMessage("Answer all 15 questions"); return; }
    setSubmitting(true);
    setMessage(null);
    try {
      const payload = {
        teamId,
        answers: Object.entries(answers).map(([qid, oid]) => ({ questionId: Number(qid), optionId: oid })),
        durationSeconds: 30 * 60 - timeLeft,
      };
      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("bearer_token")}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Submission failed");
      setResult(data);
      setShowResult(true);
      setMessage(null);
    } catch (e: any) {
      setMessage(e?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };


  useEffect(() => {
    if (showResult) localStorage.removeItem('quiz_time_left');
  }, [showResult]);

  if (isPending) return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="max-w-lg w-full rounded-lg border border-border bg-card p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Loading...</h2>
      </div>
    </div>
  );
  if (!session?.user) return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <div className="max-w-lg w-full rounded-lg border border-border bg-card p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Please sign in</h2>
        <p className="mb-4 text-muted-foreground">Sign in to access the quiz portal.</p>
        <a href="/sign-in" className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">Sign In</a>
      </div>
    </div>
  );

  if (showResult && result) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="relative mx-auto max-w-3xl px-6 py-16">
            <div className="flex flex-col items-start gap-6">
              <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground ring-1 ring-border">Round 1 • Quiz Submitted</span>
              <h1 className="text-3xl font-bold tracking-tight">Quiz Results</h1>
              <p className="max-w-xl text-muted-foreground">Your team’s answers have been submitted. See your score and token breakdown below.</p>
            </div>
          </div>
        </section>
        {/* Results Card */}
        <section className="mx-auto max-w-3xl px-6 pb-16">
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Score: <span className="font-semibold">{result.calculatedScore}</span> / 60</h2>
            <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
              <div>Marketing Tokens: <span className="font-semibold">{result.tokens?.marketing}</span></div>
              <div>Capital Tokens: <span className="font-semibold">{result.tokens?.capital}</span></div>
              <div>Team Tokens: <span className="font-semibold">{result.tokens?.team}</span></div>
              <div>Strategy Tokens: <span className="font-semibold">{result.tokens?.strategy}</span></div>
            </div>
            <button className="mt-4 rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:opacity-90" onClick={()=>window.location.href="/dashboard"}>Go to Dashboard</button>
          </div>
        </section>
      </div>
    );
  }

  // Main quiz UI
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-3xl px-6 py-16">
          <div className="flex flex-col items-start gap-6">
            <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground ring-1 ring-border">Round 1 • Leader Quiz Portal</span>
            <h1 className="text-3xl font-bold tracking-tight">Techpreneur Summit 3.0 Quiz</h1>
            <p className="max-w-xl text-muted-foreground">Answer 15 questions in 30 minutes. Each option trades off tokens in Marketing, Capital, Team, and Strategy. Leader-only access.</p>
          </div>
        </div>
      </section>
      {/* QuizComponent UI */}
      <section className="mx-auto max-w-3xl px-6 pb-16" ref={quizRef}>
        <QuizComponent
          questions={questions}
          answers={answers}
          setAnswers={setAnswers}
          currentQ={currentQ}
          setCurrentQ={setCurrentQ}
          message={message}
          submitQuiz={submitQuiz}
          submitting={submitting}
          quizActive={quizActive}
          timeLeft={timeLeft}
          isFullscreen={isFullscreen}
          toggleFullscreen={toggleFullscreen}
        />
      </section>
    </div>
  );
}