"use client"

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

export default function AdminPage() {
  const [rounds, setRounds] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [currentPitchTeamId, setCurrentPitchTeamId] = useState<number | null>(null);
  const [votingActive, setVotingActive] = useState(false);
  const [allPitchesCompleted, setAllPitchesCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for admin session cookie
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAdmin = document.cookie.includes("admin-auth=true");
      if (!isAdmin) {
        window.location.href = "/admin/login";
      }
    }
  }, []);

  const fetchRounds = async () => {
    try {
      setError(null);
      const res = await fetch("/api/rounds");
      const data = await res.json();
      setRounds(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load rounds");
    }
  };

  useEffect(() => { fetchRounds(); }, []);
  useEffect(() => {
    const fetchTeams = async () => {
      const res = await fetch("/api/teams");
      const data = await res.json();
      setTeams(Array.isArray(data) ? data : []);
    };
    fetchTeams();
  }, []);
  // Control currently pitching team and voting status
  const setPitchTeam = async (teamId: number) => {
    setCurrentPitchTeamId(teamId);
    setVotingActive(false);
    const team = teams.find(t => t.id === teamId);
    await fetch("/api/voting/current", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ teamId, teamName: team?.name })
    });
  };

  const startVoting = async () => {
    setVotingActive(true);
    await fetch("/api/voting/current", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ votingActive: true })
    });
  };

  const endVoting = async () => {
    setVotingActive(false);
    await fetch("/api/voting/current", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ votingActive: false })
    });
  };

  const completeAllPitches = async () => {
    setAllPitchesCompleted(true);
    await fetch("/api/voting/current", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ allPitchesCompleted: true })
    });
  };

  const updateRound = async (roundId: number, status: "PENDING"|"ACTIVE"|"COMPLETED") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rounds", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ roundId, status })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || "Failed to update round");
      }
      await fetchRounds();
    } catch (e: any) {
      setError(e?.message || "Failed to update round");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <h1 className="text-2xl font-bold">Admin Console</h1>
      <p className="mt-1 text-sm text-muted-foreground">Control round status and timings.</p>
      {error && <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rounds.map((r) => (
          <div key={r.id} className="rounded-lg border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{r.name}</h3>
                <p className="text-xs text-muted-foreground">Day {r.day} • Status: <span className="font-medium">{r.status}</span></p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button disabled={loading} onClick={() => updateRound(r.id, "PENDING")} className="rounded-md border border-border px-3 py-1 text-sm hover:bg-accent disabled:opacity-50">Set Pending</button>
              <button disabled={loading} onClick={() => updateRound(r.id, "ACTIVE")} className="rounded-md border border-border px-3 py-1 text-sm hover:bg-accent disabled:opacity-50">Start</button>
              <button disabled={loading} onClick={() => updateRound(r.id, "COMPLETED")} className="rounded-md border border-border px-3 py-1 text-sm hover:bg-accent disabled:opacity-50">Complete</button>
            </div>
            {r.name === "VOTING" && r.status === "ACTIVE" && (
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Voting Control</h4>
                <div className="mb-2">
                  <label className="block text-sm mb-1">Select Pitching Team</label>
                  <select value={currentPitchTeamId ?? ''} onChange={e => setPitchTeam(Number(e.target.value))} className="w-full rounded-md border px-3 py-2">
                    <option value={''} className="text-black dark:text-white">-- Select Team --</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id} className="text-black dark:text-white">{t.name} (#{t.id})</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button onClick={startVoting} disabled={!currentPitchTeamId || votingActive} className="rounded-md bg-green-600 px-4 py-2 text-white font-bold disabled:opacity-50">Start 30s Voting</button>
                  <button onClick={endVoting} disabled={!votingActive} className="rounded-md bg-red-600 px-4 py-2 text-white font-bold disabled:opacity-50">End Voting</button>
                  <button onClick={completeAllPitches} disabled={allPitchesCompleted} className="rounded-md bg-purple-600 px-4 py-2 text-white font-bold disabled:opacity-50">Complete All Pitches</button>
                </div>
                <div className="mt-2 text-xs text-muted-foreground">Voting will be enabled for the selected team for 30 seconds. After all teams have pitched, enable vote conversion.</div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* APIs */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">APIs</h2>
        <div className="mt-3 grid gap-4 sm:max-w-lg">
          <Link href="/api/rounds" className="group rounded-lg border border-border p-4 hover:bg-accent">
            <h4 className="font-medium">API: Rounds</h4>
            <p className="mt-1 text-sm text-muted-foreground">Inspect current round states (JSON).</p>
          </Link>
          <Link href="/api/questions" className="group rounded-lg border border-border p-4 hover:bg-accent">
            <h4 className="font-medium">API: Questions</h4>
            <p className="mt-1 text-sm text-muted-foreground">Preview the 15 quiz questions with options.</p>
          </Link>
        </div>
      </section>
    </div>
  );
}