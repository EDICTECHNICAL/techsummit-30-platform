"use client"

import { useEffect, useMemo, useState } from "react";
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
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const isLeader = useMemo(() => session?.user?.roles?.includes?.("LEADER") ?? false, [session]);

  // Prefill teamId from session if available (leader answers on behalf of team)
  useEffect(() => {
    const sid = (session as any)?.user?.teamId;
    if (sid && !teamId) setTeamId(Number(sid));
  }, [session, teamId]);

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
    if (!teamId) { setMessage("Please enter your team ID"); return; }
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
      setMessage(`Submitted! Score: ${data.calculatedScore}`);
    } catch (e: any) {
      setMessage(e?.message || "Failed to submit");
    } finally {
      setSubmitting(false);
    }
  };

  if (isPending) return <div className="p-6">Loading...</div>;
  if (!session?.user) return <div className="p-6">Please sign in.</div>;
  if (!isLeader) return <div className="p-6">Only the team leader can access the quiz portal. Your leader will answer on behalf of your team.</div>;

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Leader Quiz Portal</h1>
        <div className="rounded-md border border-border px-3 py-1 text-sm">Time Left: {Math.floor(timeLeft/60)}:{String(timeLeft%60).padStart(2,'0')}</div>
      </div>
      <p className="text-sm text-muted-foreground">Leader-only access • You are answering on behalf of your team • 15 questions • 30 mins • Max 60 points • Token trade-offs per option</p>

      <div className="mt-4">
        <label className="text-sm">Your Team ID</label>
        <input
          type="number"
          className="mt-1 w-40 rounded-md border border-input bg-background px-3 py-2 disabled:opacity-60"
          value={teamId ?? ""}
          onChange={(e)=>setTeamId(parseInt(e.target.value))}
          placeholder="e.g., 1"
          disabled={Boolean((session as any)?.user?.teamId)}
        />
        {Boolean((session as any)?.user?.teamId) && (
          <p className="mt-1 text-xs text-muted-foreground">Team ID is linked to your profile and cannot be changed.</p>
        )}
      </div>

      <div className="mt-6 space-y-5">
        {questions.sort((a,b)=>a.order-b.order).map((q) => (
          <div key={q.id} className="rounded-lg border border-border bg-card p-4">
            <p className="font-medium">Q{q.order}. {q.text}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {q.options.sort((a,b)=>a.order-b.order).map((opt) => (
                <label key={opt.id} className="flex cursor-pointer items-center gap-3 rounded-md border border-border p-2 hover:bg-accent">
                  <input
                    type="radio"
                    name={`q-${q.id}`}
                    checked={answers[q.id] === opt.id}
                    onChange={() => setAnswers((prev) => ({ ...prev, [q.id]: opt.id }))}
                  />
                  <span className="text-sm">{opt.text}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {message && <p className="mt-4 rounded-md border border-border bg-card px-3 py-2 text-sm">{message}</p>}

      <button onClick={submitQuiz} disabled={submitting} className="mt-6 inline-flex items-center rounded-md bg-primary px-5 py-2.5 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50">{submitting?"Submitting...":"Submit Quiz"}</button>
    </div>
  );
}