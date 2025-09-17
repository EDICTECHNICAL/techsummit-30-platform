"use client"

import { useEffect, useState } from "react";

export default function ScoreboardPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch("/api/scoreboard");
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error || "Failed to load scoreboard");
        setData(json);
      } catch (e: any) {
        setError(e?.message || "Failed to load scoreboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-destructive">{error}</div>;

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <h1 className="text-2xl font-bold">Live Scoreboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">Top teams ranked by final score. Tie-breaker: original votes.</p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="p-2">Rank</th>
              <th className="p-2">Team</th>
              <th className="p-2">College</th>
              <th className="p-2">Quiz</th>
              <th className="p-2">Votes</th>
              <th className="p-2">Peer Avg</th>
              <th className="p-2">Judge Total</th>
              <th className="p-2">Final</th>
            </tr>
          </thead>
          <tbody>
            {data?.scoreboard?.map((row: any) => (
              <tr key={row.teamId} className="border-t border-border">
                <td className="p-2 font-medium">{row.rank}</td>
                <td className="p-2">{row.teamName}</td>
                <td className="p-2 text-muted-foreground">{row.college}</td>
                <td className="p-2">{row.quizScore}</td>
                <td className="p-2">{row.totalVotes} <span className="text-xs text-muted-foreground">(orig {row.originalVotes}, token {row.tokenVotes})</span></td>
                <td className="p-2">{row.peerRatingAvg}</td>
                <td className="p-2">{row.judgeScoreTotal}</td>
                <td className="p-2 font-semibold">{row.finalScore}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}