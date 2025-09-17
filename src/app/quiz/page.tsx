"use client"

import { useEffect, useMemo, useState, useRef } from "react";
import { useSession } from "@/lib/auth-client";

type Question = {
  id: number;
  text: string;
  order: number;
  options: { id: number; text: string; order: number }[];
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
  // Fullscreen logic
  useEffect(() => {
    if (!quizRef.current) return;
    const handleFsChange = () => {
      setIsFullscreen(document.fullscreenElement === quizRef.current);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!quizRef.current) return;
    if (!isFullscreen) quizRef.current.requestFullscreen();
    else document.exitFullscreen();
  };

  const isLeader = useMemo(() => session?.user?.roles?.includes?.("LEADER") ?? false, [session]);

  // Prefill teamId from session if available (leader answers on behalf of team)
  useEffect(() => {
    const sid = (session as any)?.user?.teamId;
    if (sid && !teamId) setTeamId(Number(sid));
  }, [session, teamId]);

  // Fetch quiz round status
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

  useEffect(() => {
    const timer = setInterval(() => setTimeLeft((t) => (t > 0 ? t - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, []);

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

  if (isPending) return <div className="p-6">Loading...</div>;
  if (!session?.user) return <div className="p-6">Please sign in.</div>;

  // Result UI
  if (showResult && result) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6 flex flex-col items-center justify-center">
        <div className="max-w-lg w-full rounded-lg border border-border bg-card p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Quiz Submitted!</h2>
          <p className="mb-2 text-lg">Score: <span className="font-semibold">{result.calculatedScore}</span> / 60</p>
          <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
            <div>Marketing Tokens: <span className="font-semibold">{result.tokens?.marketing}</span></div>
            <div>Capital Tokens: <span className="font-semibold">{result.tokens?.capital}</span></div>
            <div>Team Tokens: <span className="font-semibold">{result.tokens?.team}</span></div>
            <div>Strategy Tokens: <span className="font-semibold">{result.tokens?.strategy}</span></div>
          </div>
          <button className="mt-4 rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:opacity-90" onClick={()=>window.location.href="/dashboard"}>Go to Dashboard</button>
        </div>
      </div>
    );
  }

  // Main quiz UI
  return (
    <div ref={quizRef} className="min-h-screen bg-background text-foreground p-6">
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Leader Quiz Portal</h1>
          <button
            className="ml-2 rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
            onClick={toggleFullscreen}
          >{isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}</button>
        </div>
        <div className="rounded-md border border-border px-3 py-1 text-sm">Time Left: {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</div>
      </div>
      <p className="text-sm text-muted-foreground">Leader-only access • You are answering on behalf of your team • 15 questions • 30 mins • Max 60 points • Token trade-offs per option</p>

      <div className="mt-8 flex gap-8 items-start">
        {/* Sidebar grid navigation */}
        <div className="flex flex-col gap-3">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              className={`rounded-lg border px-4 py-3 text-base font-semibold transition-all duration-150 ${currentQ===idx?"bg-primary text-primary-foreground border-primary":"bg-card border-border hover:bg-accent text-muted-foreground"} ${answers[q.id]?"ring-2 ring-primary":""}`}
              onClick={()=>setCurrentQ(idx)}
            >Q{q.order}</button>
          ))}
        </div>

        {/* Main question area */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <button
              className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
              onClick={()=>setCurrentQ((q)=>q>0?q-1:0)}
              disabled={currentQ===0}
            >Prev</button>
            <span className="text-sm">Question {questions[currentQ]?.order ?? currentQ+1} / 15</span>
            <button
              className="rounded-md border border-border px-2 py-1 text-xs hover:bg-accent"
              onClick={()=>setCurrentQ((q)=>q<questions.length-1?q+1:q)}
              disabled={currentQ===questions.length-1}
            >Next</button>
          </div>
          {questions.length > 0 && (
            <div className="rounded-lg border border-border bg-card p-4">
              <p className="font-medium">Q{questions[currentQ].order}. {questions[currentQ].text}</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {questions[currentQ].options.sort((a,b)=>a.order-b.order).map((opt) => (
                  <label key={opt.id} className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-2 hover:bg-accent">
                    <input
                      type="radio"
                      name={`q-${questions[currentQ].id}`}
                      checked={answers[questions[currentQ].id] === opt.id}
                      onChange={() => setAnswers((prev) => ({ ...prev, [questions[currentQ].id]: opt.id }))}
                    />
                    <span className="text-sm">{opt.text}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Submission and feedback */}
          {message && <p className="mt-4 rounded-md border border-border bg-card px-3 py-2 text-sm">{message}</p>}

          <button
            onClick={submitQuiz}
            disabled={submitting || Object.keys(answers).length !== 15 || !quizActive}
            className="mt-6 inline-flex items-center rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >{quizActive ? (submitting?"Submitting...":"Submit Quiz") : "Quiz Not Active"}</button>
        </div>
      </div>
    </div>
  );
}