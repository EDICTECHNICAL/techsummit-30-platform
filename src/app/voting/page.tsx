"use client"

import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/auth-client";

export default function VotingPage() {
  const { data: session, isPending } = useSession();
  const [teams, setTeams] = useState<any[]>([]);
  const [fromTeamId, setFromTeamId] = useState<number | null>(null);
  const [toTeamId, setToTeamId] = useState<number | null>(null);
  const [value, setValue] = useState<1 | -1>(1);
  const [convCategory, setConvCategory] = useState<"MARKETING"|"CAPITAL"|"TEAM"|"STRATEGY">("MARKETING");
  const [msg, setMsg] = useState<string | null>(null);

  const isLeader = useMemo(() => session?.user?.roles?.includes?.("LEADER") ?? false, [session]);

  // Prefill from team id from session if present (leader votes on behalf of team)
  useEffect(() => {
    const sid = (session as any)?.user?.teamId;
    if (sid && !fromTeamId) setFromTeamId(Number(sid));
  }, [session, fromTeamId]);

  useEffect(() => {
    const load = async () => {
      const res = await fetch("/api/teams", { headers: { "Authorization": `Bearer ${localStorage.getItem("bearer_token")}` }});
      const data = await res.json();
      setTeams(Array.isArray(data) ? data : []);
      // Guess leader's team
      const leaderTeam = data.find((t: any) => t.leader?.userId === session?.user?.id);
      if (leaderTeam && !fromTeamId) setFromTeamId(leaderTeam.id);
    };
    if (session?.user) load();
  }, [session?.user, fromTeamId]);

  const castVote = async () => {
    if (!fromTeamId || !toTeamId) { setMsg("Select teams"); return; }
    setMsg(null);
    const res = await fetch("/api/votes", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("bearer_token")}` },
      body: JSON.stringify({ fromTeamId, toTeamId, value })
    });
    const data = await res.json();
    setMsg(res.ok ? `Vote recorded (value ${value})` : (data?.error || "Failed"));
  };

  const convertToken = async () => {
    if (!fromTeamId) { setMsg("No team detected"); return; }
    const res = await fetch("/api/tokens/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${localStorage.getItem("bearer_token")}` },
      body: JSON.stringify({ teamId: fromTeamId, category: convCategory })
    });
    const data = await res.json();
    setMsg(res.ok ? `Converted 1 ${convCategory} token → ${data.votesGained} vote` : (data?.error || "Failed"));
  };

  if (isPending) return <div className="p-6">Loading...</div>;
  if (!session?.user) return <div className="p-6">Please sign in.</div>;
  if (!isLeader) return <div className="p-6">Only the team leader can access the voting portal and vote on behalf of the team.</div>;

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <h1 className="text-2xl font-bold">Leader Voting Portal</h1>
      <p className="mt-1 text-sm text-muted-foreground">Leader-only access • You are voting on behalf of your team • Max 3 downvotes in total • Convert exactly 1 token per category to gain votes.</p>

      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold">Cast a Vote</h3>
          <div className="mt-3 grid gap-3">
            <div>
              <label className="text-sm">From Team (you)</label>
              <input type="number" value={fromTeamId ?? ''} onChange={(e)=>setFromTeamId(parseInt(e.target.value))} className="mt-1 w-40 rounded-md border border-input bg-background px-3 py-2 disabled:opacity-60" disabled={Boolean((session as any)?.user?.teamId)} />
              {Boolean((session as any)?.user?.teamId) && (
                <p className="mt-1 text-xs text-muted-foreground">Team ID is linked to your profile and cannot be changed.</p>
              )}
            </div>
            <div>
              <label className="text-sm">To Team</label>
              <select value={toTeamId ?? ''} onChange={(e)=>setToTeamId(parseInt(e.target.value))} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2">
                <option value={-1}>Select a team</option>
                {teams.filter((t)=>t.id!==fromTeamId).map((t)=> (
                  <option key={t.id} value={t.id}>{t.name} (#{t.id})</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <button onClick={()=>setValue(1)} className={`rounded-md border px-3 py-1 text-sm ${value===1?"bg-primary text-primary-foreground border-transparent":"border-border"}`}>Upvote</button>
              <button onClick={()=>setValue(-1)} className={`rounded-md border px-3 py-1 text-sm ${value===-1?"bg-primary text-primary-foreground border-transparent":"border-border"}`}>Downvote</button>
            </div>
            <button onClick={castVote} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Submit Vote</button>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-semibold">Convert Tokens → Votes</h3>
          <div className="mt-3 grid gap-3">
            <div>
              <label className="text-sm">Category</label>
              <select value={convCategory} onChange={(e)=>setConvCategory(e.target.value as any)} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2">
                <option value="MARKETING">Marketing</option>
                <option value="CAPITAL">Capital</option>
                <option value="TEAM">Team building</option>
                <option value="STRATEGY">Strategy</option>
              </select>
            </div>
            <button onClick={convertToken} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Convert 1 Token</button>
          </div>
        </div>
      </div>

      {msg && <p className="mt-6 rounded-md border border-border bg-card px-3 py-2 text-sm">{msg}</p>}
    </div>
  );
}