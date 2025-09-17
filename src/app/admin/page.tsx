"use client"

import { useEffect, useMemo, useState } from "react";
import { useSession } from "@/lib/auth-client";

export default function AdminPage() {
  const { data: session, isPending } = useSession();
  const [rounds, setRounds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdmin = useMemo(() => session?.user?.roles?.includes?.("ADMIN") ?? false, [session]);

  const fetchRounds = async () => {
    try {
      setError(null);
      const res = await fetch("/api/rounds", { headers: { "Authorization": `Bearer ${localStorage.getItem("bearer_token")}` }});
      const data = await res.json();
      setRounds(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load rounds");
    }
  };

  useEffect(() => { fetchRounds(); }, []);

  const updateRound = async (roundId: number, status: "PENDING"|"ACTIVE"|"COMPLETED") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rounds", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("bearer_token")}`
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

  if (isPending) return <div className="p-6">Loading...</div>;
  if (!session?.user) return <div className="p-6">Please sign in.</div>;
  if (!isAdmin) return <div className="p-6">Admin access required.</div>;

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
          </div>
        ))}
      </div>

      {/* APIs */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">APIs</h2>
        <div className="mt-3 grid gap-4 sm:max-w-lg">
          <a href="/api/rounds" className="group rounded-lg border border-border p-4 hover:bg-accent">
            <h4 className="font-medium">API: Rounds</h4>
            <p className="mt-1 text-sm text-muted-foreground">Inspect current round states (JSON).</p>
          </a>
          <a href="/api/questions" className="group rounded-lg border border-border p-4 hover:bg-accent">
            <h4 className="font-medium">API: Questions</h4>
            <p className="mt-1 text-sm text-muted-foreground">Preview the 15 quiz questions with options.</p>
          </a>
        </div>
      </section>
    </div>
  );
}