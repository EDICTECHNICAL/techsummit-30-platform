"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

interface LeaderboardTeam {
  rank: number;
  teamId: number;
  teamName: string;
  college: string;
  tokens: {
    marketing: number;
    capital: number;
    team: number;
    strategy: number;
    total: number;
  };
  tokenActivity: {
    earned: number;
    spent: number;
    remaining: number;
  };
  voting: {
    originalVotes: number;
    votesFromTokens: number;
    totalVotes: number;
  };
  peerRating: {
    average: number;
    count: number;
  };
  judgeScores: {
    total: number;
    average: number;
    count: number;
  };
  finalCumulativeScore: number;
  hasQuizSubmission: boolean;
}

interface LeaderboardData {
  leaderboard: LeaderboardTeam[];
  metadata: {
    totalTeams: number;
    generatedAt: string;
    focus: string;
    rankingCriteria: string[];
    participation: {
      quizSubmissions: number;
      votingParticipation: number;
      peerRatings: number;
      tokenSpending: number;
    };
    explanation: Record<string, string>;
  };
}

export default function ScoreboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
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

  if (!data || !data.leaderboard || data.leaderboard.length === 0) {
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

  const topTeams = data.leaderboard.slice(0, 3);
  const remainingTeams = data.leaderboard.slice(3);
  const maxFinalScore = data.leaderboard[0]?.finalCumulativeScore || 0;

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
            <Link
              href="/dashboard"
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md hover:bg-secondary/90 text-sm flex items-center gap-2"
            >
              ← Back to Dashboard
            </Link>
            <ThemeToggle />
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
                    {team.finalCumulativeScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Tokens: {team.tokens?.total || 0}</div>
                    <div>Votes: {team.voting?.totalVotes || 0}</div>
                    <div>Peer: {team.peerRating?.average ? team.peerRating.average.toFixed(1) : '0.0'}</div>
                    <div>Judge: {team.judgeScores?.total || 0}</div>
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
                  <th className="text-center p-4 font-semibold">Marketing</th>
                  <th className="text-center p-4 font-semibold">Capital</th>
                  <th className="text-center p-4 font-semibold">Team Tokens</th>
                  <th className="text-center p-4 font-semibold">Strategy</th>
                  <th className="text-center p-4 font-semibold">Total Votes</th>
                  <th className="text-center p-4 font-semibold">Peer Rating</th>
                  <th className="text-center p-4 font-semibold">Judge Score</th>
                  <th className="text-center p-4 font-semibold">Final Score</th>
                </tr>
              </thead>
              <tbody>
                {data.leaderboard.map((team: LeaderboardTeam, index: number) => (
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
                      <div className="font-medium text-blue-500">
                        {team.tokens.marketing}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="font-medium text-green-500">
                        {team.tokens.capital}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="font-medium text-purple-500">
                        {team.tokens.team}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="font-medium text-orange-500">
                        {team.tokens.strategy}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <div className="font-medium">{team.voting.totalVotes}</div>
                      {showDetails && (
                        <div className="text-xs text-muted-foreground">
                          {team.voting.originalVotes}+{team.voting.votesFromTokens}
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="font-medium">
                        {team.peerRating?.average && team.peerRating.average > 0 ? team.peerRating.average.toFixed(1) : '-'}
                      </div>
                      {showDetails && (
                        <div className="text-xs text-muted-foreground">
                          ({team.peerRating?.count || 0} ratings)
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="font-medium">{team.judgeScores?.total || 0}</div>
                      {showDetails && (
                        <div className="text-xs text-muted-foreground">
                          ({team.judgeScores?.count || 0} judges)
                        </div>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className={`text-lg font-bold ${getScoreColor(team.finalCumulativeScore, maxFinalScore)}`}>
                        {team.finalCumulativeScore.toFixed(1)}
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
              <h3 className="font-semibold mb-4">Scoring System</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Token Categories</span>
                  <span className="font-medium">Marketing + Capital + Team + Strategy</span>
                </div>
                <div className="flex justify-between">
                  <span>Judge Scores</span>
                  <span className="font-medium">Total judge evaluation</span>
                </div>
                <div className="flex justify-between">
                  <span>Final Score</span>
                  <span className="font-medium">Token Score + Judge Score</span>
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
                  <span>Token Activity</span>
                  <span className="font-medium">{data.metadata.participation.tokenSpending}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 text-muted-foreground space-y-2">
          <p className="text-sm">
            Ranking: {data.metadata.rankingCriteria?.join(' • ') || 'Cumulative score, then total votes'}
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