"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface ScoreboardTeam {
  rank: number;
  teamId: number;
  teamName: string;
  college: string;
  quizScore: number;
  originalVotes: number;
  tokenVotes: number;
  totalVotes: number;
  upvotes: number;
  downvotes: number;
  peerRatingAvg: number;
  peerRatingCount: number;
  judgeScoreTotal: number;
  judgeScoreAvg: number;
  judgeCount: number;
  finalScore: number;
  hasQuizSubmission: boolean;
  hasTokenConversion: boolean;
  components: {
    quiz: { score: number; weight: number; contribution: number };
    voting: { originalVotes: number; tokenVotes: number; totalVotes: number; normalizedVotes: number; weight: number; contribution: number };
    peerRating: { average: number; normalized: number; count: number; weight: number; contribution: number };
    judgeScore: { total: number; average: number; count: number; weight: number; contribution: number };
  };
}

interface ScoreboardData {
  scoreboard: ScoreboardTeam[];
  metadata: {
    totalTeams: number;
    generatedAt: string;
    weights: Record<string, number>;
    tieBreakers: string[];
    participation: {
      quizSubmissions: number;
      votingParticipation: number;
      peerRatings: number;
      judgeScores: number;
    };
    scoringExplanation: Record<string, string>;
  };
}

export default function ScoreboardPage() {
  const [data, setData] = useState<ScoreboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchScoreboard = async () => {
    try {
      setError(null);
      const res = await fetch("/api/scoreboard", {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      const json = await res.json();
      
      if (!res.ok) {
        throw new Error(json?.error || "Failed to load scoreboard");
      }
      
      setData(json);
      setLastUpdated(new Date());
    } catch (e: any) {
      console.error('Scoreboard fetch error:', e);
      setError(e?.message || "Failed to load scoreboard");
    }
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchScoreboard();
      setLoading(false);
    };
    load();
  }, []);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchScoreboard();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getRankBadgeColor = (rank: number) => {
    switch (rank) {
      case 1: return "bg-yellow-500 text-white";
      case 2: return "bg-gray-400 text-white";
      case 3: return "bg-amber-600 text-white";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
    if (percentage >= 80) return "text-green-600 dark:text-green-400";
    if (percentage >= 60) return "text-yellow-600 dark:text-yellow-400";
    if (percentage >= 40) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading scoreboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="text-center py-12">
          <div className="text-destructive text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-destructive mb-2">Error Loading Scoreboard</h2>
          <p className="text-muted-foreground mb-6">{error}</p>
          <div className="space-x-4">
            <button
              onClick={() => window.location.reload()}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
            >
              Retry
            </button>
            <Link
              href="/"
              className="bg-muted text-muted-foreground px-4 py-2 rounded-md hover:bg-muted/90"
            >
              Go Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!data || !data.scoreboard || data.scoreboard.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="text-center py-12">
          <div className="text-muted-foreground text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold mb-2">No Teams Found</h2>
          <p className="text-muted-foreground mb-6">The scoreboard will appear here once teams start participating.</p>
          <Link
            href="/"
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const topTeams = data.scoreboard.slice(0, 3);
  const remainingTeams = data.scoreboard.slice(3);
  const maxFinalScore = data.scoreboard[0]?.finalScore || 0;

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3">
              🏆 Live Scoreboard
            </h1>
            <p className="text-muted-foreground mt-1">
              Competition rankings • {data.metadata.totalTeams} teams competing
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="autoRefresh"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-input"
              />
              <label htmlFor="autoRefresh" className="text-sm text-muted-foreground">
                Auto-refresh
              </label>
            </div>
            <button
              onClick={fetchScoreboard}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 text-sm"
            >
              Refresh
            </button>
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="bg-muted text-muted-foreground px-4 py-2 rounded-md hover:bg-muted/90 text-sm"
            >
              {showDetails ? 'Hide' : 'Show'} Details
            </button>
          </div>
        </div>

        {/* Last Updated */}
        {lastUpdated && (
          <div className="text-xs text-muted-foreground mb-6">
            Last updated: {lastUpdated.toLocaleString()}
          </div>
        )}

        {/* Top 3 Teams */}
        {topTeams.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {topTeams.map((team) => (
              <div
                key={team.teamId}
                className={`relative rounded-xl border p-6 ${
                  team.rank === 1
                    ? 'border-yellow-500 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900'
                    : team.rank === 2
                    ? 'border-gray-400 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900'
                    : 'border-amber-600 bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900'
                }`}
              >
                <div className={`absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${getRankBadgeColor(team.rank)}`}>
                  {team.rank}
                </div>
                <div className="text-center">
                  <h3 className="font-bold text-lg mb-1">{team.teamName}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{team.college}</p>
                  <div className="text-3xl font-bold mb-2 text-primary">
                    {team.finalScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Quiz: {team.quizScore}</div>
                    <div>Votes: {team.totalVotes}</div>
                    <div>Peer: {team.peerRatingAvg.toFixed(1)}</div>
                    <div>Judge: {team.judgeScoreTotal}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Full Scoreboard Table */}
        <div className="rounded-lg border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-4 font-semibold">Rank</th>
                  <th className="text-left p-4 font-semibold">Team</th>
                  <th className="text-left p-4 font-semibold">College</th>
                  <th className="text-center p-4 font-semibold">Quiz</th>
                  <th className="text-center p-4 font-semibold">Votes</th>
                  <th className="text-center p-4 font-semibold">Peer Avg</th>
                  <th className="text-center p-4 font-semibold">Judge Total</th>
                  <th className="text-center p-4 font-semibold">Final Score</th>
                </tr>
              </thead>
              <tbody>
                {data.scoreboard.map((team, index) => (
                  <tr key={team.teamId} className={`border-t ${index < 3 ? 'bg-accent/20' : ''}`}>
                    <td className="p-4">
                      <div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${getRankBadgeColor(team.rank)}`}>
                        {team.rank}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="font-medium">{team.teamName}</div>
                      {!team.hasQuizSubmission && (
                        <div className="text-xs text-orange-600 dark:text-orange-400">No quiz</div>
                      )}
                    </td>
                    <td className="p-4 text-muted-foreground">{team.college}</td>
                    <td className="p-4 text-center">
                      <div className={`font-medium ${getScoreColor(team.quizScore, 60)}`}>
                        {team.quizScore}
                      </div>
                      {showDetails && <div className="text-xs text-muted-foreground">/60</div>}
                    </td>
                    <td className="p-4 text-center">
                      <div className="font-medium">{team.totalVotes}</div>
                      {showDetails && (
                        <div className="text-xs text-muted-foreground">
                          {team.originalVotes}+{team.tokenVotes}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className={`font-medium ${getScoreColor(team.peerRatingAvg, 10)}`}>
                        {team.peerRatingAvg > 0 ? team.peerRatingAvg.toFixed(1) : '-'}
                      </div>
                      {showDetails && (
                        <div className="text-xs text-muted-foreground">
                          ({team.peerRatingCount} ratings)
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="font-medium">{team.judgeScoreTotal}</div>
                      {showDetails && (
                        <div className="text-xs text-muted-foreground">
                          ({team.judgeCount} judges)
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className={`text-lg font-bold ${getScoreColor(team.finalScore, maxFinalScore)}`}>
                        {team.finalScore.toFixed(1)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Scoring Information */}
        {showDetails && data.metadata && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-4">Scoring Weights</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Quiz Score</span>
                  <span className="font-medium">×{data.metadata.weights.quiz}</span>
                </div>
                <div className="flex justify-between">
                  <span>Voting</span>
                  <span className="font-medium">×{data.metadata.weights.voting}</span>
                </div>
                <div className="flex justify-between">
                  <span>Peer Rating</span>
                  <span className="font-medium">×{data.metadata.weights.peerRating}</span>
                </div>
                <div className="flex justify-between">
                  <span>Judge Score</span>
                  <span className="font-medium">×{data.metadata.weights.judgeScore}</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold mb-4">Participation Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Quiz Submissions</span>
                  <span className="font-medium">{data.metadata.participation.quizSubmissions}/{data.metadata.totalTeams}</span>
                </div>
                <div className="flex justify-between">
                  <span>Voting Participation</span>
                  <span className="font-medium">{data.metadata.participation.votingParticipation}/{data.metadata.totalTeams}</span>
                </div>
                <div className="flex justify-between">
                  <span>Peer Ratings</span>
                  <span className="font-medium">{data.metadata.participation.peerRatings}</span>
                </div>
                <div className="flex justify-between">
                  <span>Judge Scores</span>
                  <span className="font-medium">{data.metadata.participation.judgeScores}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-muted-foreground space-y-2">
          <p className="text-sm">
            Tie-breakers: {data.metadata.tieBreakers?.join(' • ') || 'Quiz score, then original votes'}
          </p>
          <p className="text-xs">
            Generated at: {new Date(data.metadata.generatedAt).toLocaleString()}
          </p>
          <div className="flex justify-center gap-4 mt-4">
            <Link
              href="/"
              className="text-primary hover:underline text-sm"
            >
              ← Back to Home
            </Link>
            <Link
              href="/dashboard"
              className="text-primary hover:underline text-sm"
            >
              Dashboard →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}