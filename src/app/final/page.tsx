"use client"

import { useMemo, useState } from "react";
import { useSession } from "@/lib/auth-client";

export default function FinalPage() {
  const { data: session, isPending } = useSession();
  const [fromTeamId, setFromTeamId] = useState<number | null>(null);
  const [toTeamId, setToTeamId] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(7);
  const [msg, setMsg] = useState<string | null>(null);

  const isLeader = useMemo(() => session?.user?.roles?.includes?.("LEADER") ?? false, [session]);
  const isAdmin = useMemo(() => session?.user?.roles?.includes?.("ADMIN") ?? false, [session]);

  const submitRating = async () => {
    if (!fromTeamId || !toTeamId) { setMsg("Enter both team IDs"); return; }
    const res = await fetch("/api/final/ratings", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("bearer_token")}` },
      body: JSON.stringify({ fromTeamId, toTeamId, rating })
    });
    const data = await res.json();
    setMsg(res.ok ? `Rated team #${toTeamId} with ${rating}` : (data?.error || "Failed"));
  };

  const registerPitch = async () => {
    if (!fromTeamId) { setMsg("Enter your team ID"); return; }
    const res = await fetch("/api/final/pitches", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("bearer_token")}` },
      body: JSON.stringify({ teamId: fromTeamId })
    });
    const data = await res.json();
    setMsg(res.ok ? `Final pitch registered for team #${fromTeamId}` : (data?.error || "Failed"));
  };

  const submitJudgeScore = async (teamId: number, score: number) => {
    const res = await fetch("/api/judges/scores", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("bearer_token")}` },
      body: JSON.stringify({ judgeName: session?.user?.name || "Judge", teamId, score })
    });
    const data = await res.json();
    setMsg(res.ok ? `Judge score submitted for team #${teamId}` : (data?.error || "Failed"));
  };

  if (isPending) return <div className="p-6">Loading...</div>;
  if (!session?.user) return <div className="p-6">Please sign in.</div>;

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <h1 className="text-2xl font-bold">Round 3: Finals</h1>
      <p className="mt-1 text-sm text-muted-foreground">Rate peers (3–10, integers) after pitches. Judges can submit scores. Original votes are the tie-breaker.</p>

      {isLeader && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold">Submit Peer Rating</h3>
            <div className="mt-3 grid gap-3">
              <div>
                <label className="text-sm">From Team (you)</label>
                <input type="number" value={fromTeamId ?? ''} onChange={(e)=>setFromTeamId(parseInt(e.target.value))} className="mt-1 w-40 rounded-md border border-input bg-background px-3 py-2" />
              </div>
              <div>
                <label className="text-sm">To Team</label>
                <input type="number" value={toTeamId ?? ''} onChange={(e)=>setToTeamId(parseInt(e.target.value))} className="mt-1 w-40 rounded-md border border-input bg-background px-3 py-2" />
              </div>
              <div>
                <label className="text-sm">Rating (3–10)</label>
                <input type="number" min={3} max={10} value={rating} onChange={(e)=>setRating(parseInt(e.target.value))} className="mt-1 w-40 rounded-md border border-input bg-background px-3 py-2" />
              </div>
              <button onClick={submitRating} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Submit Rating</button>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-card p-4">
            <h3 className="font-semibold">Register Final Pitch</h3>
            <p className="mt-2 text-sm text-muted-foreground">Register when your team is ready to present the 5-minute deck.</p>
            <button onClick={registerPitch} className="mt-3 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Register</button>
          </div>
        </div>
      )}

      {isAdmin && (
        <div className="mt-10 rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold">Judges Panel</h3>
          <JudgeForm onSubmit={submitJudgeScore} />
        </div>
      )}

      {msg && <p className="mt-6 rounded-md border border-border bg-card px-3 py-2 text-sm">{msg}</p>}
    </div>
  );
}

function JudgeForm({ onSubmit }: { onSubmit: (teamId: number, score: number) => void }) {
  const [teamId, setTeamId] = useState<number | null>(null);
  const [score, setScore] = useState<number>(80);
  return (
    <div className="mt-3 grid gap-3 sm:grid-cols-3">
      <div>
        <label className="text-sm">Team ID</label>
        <input type="number" value={teamId ?? ''} onChange={(e)=>setTeamId(parseInt(e.target.value))} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" />
      </div>
      <div>
        <label className="text-sm">Score (integer)</label>
        <input type="number" value={score} onChange={(e)=>setScore(parseInt(e.target.value))} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2" />
      </div>
      <div className="flex items-end">
        <button onClick={()=> teamId && onSubmit(teamId, score)} className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Submit Judge Score</button>
      </div>
    </div>
  );
}