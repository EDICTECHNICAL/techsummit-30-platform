"use client"

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";

interface Team {
  id: number;
  name: string;
  college: string;
}

interface JudgeScore {
  id: number;
  judgeName: string;
  teamId: number;
  score: number;
  createdAt: string;
}

export default function JudgePage() {
  const { data: session, isPending } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [scores, setScores] = useState<JudgeScore[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isJudgeAuthenticated, setIsJudgeAuthenticated] = useState(false);

  // Form state
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [judgeScore, setJudgeScore] = useState<number>(80);
  const [judgeName, setJudgeName] = useState<string>('');

  const isAdmin = session?.user?.isAdmin;

  // Check for judge authentication cookie
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isJudge = document.cookie.includes("judge-auth=true") || document.cookie.includes("admin-auth=true");
      setIsJudgeAuthenticated(isJudge);
      if (!isJudge) {
        window.location.href = "/judge/login";
      }
    }
  }, []);

  useEffect(() => {
    if (session?.user?.name) {
      setJudgeName(session.user.name);
    } else if (isJudgeAuthenticated) {
      // Set a default judge name if not logged in via regular auth
      setJudgeName('Judge');
    }
    if (isJudgeAuthenticated) {
      loadData();
    }
  }, [session, isJudgeAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load teams
      const teamsRes = await fetch('/api/teams');
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData);
      }

      // Load all judge scores
      const scoresRes = await fetch('/api/judges/scores');
      if (scoresRes.ok) {
        const scoresData = await scoresRes.json();
        setScores(scoresData.scores || []);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setMsg('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const submitScore = async () => {
    if (!selectedTeamId || !judgeScore || !judgeName.trim()) {
      setMsg("Please fill in all fields");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/judges/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          judgeName: judgeName.trim(), 
          teamId: selectedTeamId, 
          score: judgeScore 
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        setMsg(`Score submitted successfully: ${judgeScore} points`);
        setSelectedTeamId(null);
        setJudgeScore(80);
        
        // Reload scores
        const scoresRes = await fetch('/api/judges/scores');
        if (scoresRes.ok) {
          const scoresData = await scoresRes.json();
          setScores(scoresData.scores || []);
        }
      } else {
        setMsg(data?.error || "Failed to submit score");
      }
    } catch (error) {
      setMsg("Failed to submit score");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    // Clear judge authentication cookie
    document.cookie = "judge-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/judge/login";
  };

  if (isPending || loading || !isJudgeAuthenticated) return <div className="p-6">Loading...</div>;
  if (!isJudgeAuthenticated) return <div className="p-6">Please sign in to access the judge panel.</div>;

  // Group scores by team for display
  const scoresByTeam = teams.map(team => {
    const teamScores = scores.filter(s => s.teamId === team.id);
    const totalScore = teamScores.reduce((sum, s) => sum + s.score, 0);
    const averageScore = teamScores.length > 0 ? totalScore / teamScores.length : 0;
    
    return {
      team,
      scores: teamScores,
      totalScore,
      averageScore: Math.round(averageScore * 100) / 100,
      judgeCount: teamScores.length
    };
  });

  const myScores = scores.filter(s => s.judgeName === judgeName.trim());
  const myTeamIds = new Set(myScores.map(s => s.teamId));
  const availableTeams = teams.filter(team => !myTeamIds.has(team.id));

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Judge Console</h1>
        <p className="text-muted-foreground mb-6">
          Submit scores for team presentations during the final round.
        </p>

        {/* Submit Score Form */}
        <div className="rounded-lg border bg-card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Submit Judge Score</h2>
          
          <div className="grid gap-4 md:grid-cols-4">
            <div>
              <label className="block text-sm font-medium mb-2">Judge Name</label>
              <input 
                type="text" 
                value={judgeName} 
                onChange={(e) => setJudgeName(e.target.value)}
                placeholder="Enter judge name"
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Team</label>
              <select 
                value={selectedTeamId || ''} 
                onChange={(e) => setSelectedTeamId(e.target.value ? parseInt(e.target.value) : null)}
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="">Select team...</option>
                {availableTeams.map(team => (
                  <option key={team.id} value={team.id}>
                    {team.name} ({team.college})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Score (Integer)</label>
              <input 
                type="number" 
                value={judgeScore} 
                onChange={(e) => setJudgeScore(parseInt(e.target.value) || 0)}
                placeholder="Enter score"
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              />
            </div>
            <div className="flex items-end">
              <button 
                onClick={submitScore}
                disabled={loading || !selectedTeamId || !judgeScore || !judgeName.trim()}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Submit Score'}
              </button>
            </div>
          </div>

          {availableTeams.length === 0 && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-800">
                You have scored all available teams as judge "{judgeName}".
              </p>
            </div>
          )}
        </div>

        {/* My Submitted Scores */}
        {myScores.length > 0 && (
          <div className="rounded-lg border bg-card p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Your Submitted Scores ({myScores.length})</h2>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {myScores.map((score) => {
                const team = teams.find(t => t.id === score.teamId);
                return (
                  <div key={score.id} className="rounded-lg border bg-muted p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">{team?.name || `Team #${score.teamId}`}</h3>
                        <p className="text-sm text-muted-foreground">{team?.college}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-green-600">{score.score} pts</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(score.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* All Team Scores Overview */}
        <div className="rounded-lg border bg-card p-6">
          <h2 className="text-xl font-semibold mb-4">Judge Scores Overview</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Team</th>
                  <th className="text-left p-2">College</th>
                  <th className="text-center p-2">Judges</th>
                  <th className="text-center p-2">Total Score</th>
                  <th className="text-center p-2">Average</th>
                  <th className="text-left p-2">Individual Scores</th>
                </tr>
              </thead>
              <tbody>
                {scoresByTeam.map(({ team, scores: teamScores, totalScore, averageScore, judgeCount }) => (
                  <tr key={team.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{team.name}</td>
                    <td className="p-2 text-muted-foreground">{team.college}</td>
                    <td className="p-2 text-center">{judgeCount}</td>
                    <td className="p-2 text-center font-bold text-green-600">{totalScore}</td>
                    <td className="p-2 text-center text-blue-600">{averageScore}</td>
                    <td className="p-2">
                      <div className="flex flex-wrap gap-1">
                        {teamScores.map(score => (
                          <span 
                            key={score.id}
                            className="bg-muted px-2 py-1 rounded text-xs"
                            title={`${score.judgeName}: ${score.score} pts`}
                          >
                            {score.judgeName}: {score.score}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Message Display */}
        {msg && (
          <div className={`mt-6 rounded-lg border p-4 ${
            msg.includes('successfully') || msg.includes('✅') 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : msg.includes('Failed') || msg.includes('❌')
              ? 'bg-red-50 border-red-200 text-red-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}>
            <p className="font-medium">{msg}</p>
            <button 
              onClick={() => setMsg(null)}
              className="mt-2 text-sm underline opacity-70 hover:opacity-100"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <button 
            onClick={loadData}
            disabled={loading}
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </button>
          <a 
            href="/admin" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
          >
            Admin Panel
          </a>
          <a 
            href="/final" 
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium"
          >
            Final Round
          </a>
          <button 
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}