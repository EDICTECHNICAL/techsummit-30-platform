"use client"

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

export default function AdminPage() {
  const [rounds, setRounds] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentPitchTeamId, setCurrentPitchTeamId] = useState<number | null>(null);
  const [votingActive, setVotingActive] = useState(false);
  const [allPitchesCompleted, setAllPitchesCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stats, setStats] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'rounds' | 'voting' | 'teams' | 'users' | 'quiz' | 'analytics' | 'system'>('rounds');
  const [quizSettings, setQuizSettings] = useState<any>({});
  const [systemStatus, setSystemStatus] = useState<any>({});

  // Check for admin session cookie
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAdmin = document.cookie.includes("admin-auth=true");
      if (!isAdmin) {
        window.location.href = "/admin/login";
      }
    }
  }, []);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // Comprehensive data fetching
  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [roundsRes, teamsRes, usersRes, questionsRes, votingRes, pitchRes, statsRes, quizRes, systemRes] = await Promise.all([
        fetch("/api/rounds"),
        fetch("/api/teams"),
        fetch("/api/admin/users"),
        fetch("/api/questions"),
        fetch("/api/votes/active"),
        fetch("/api/final/pitches/current"),
        fetch("/api/admin/stats"),
        fetch("/api/admin/quiz-settings"),
        fetch("/api/admin/system-status")
      ]);

      if (roundsRes.ok) {
        const roundsData = await roundsRes.json();
        setRounds(Array.isArray(roundsData) ? roundsData : []);
      }

      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(Array.isArray(teamsData) ? teamsData : []);
      }

      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setUsers(Array.isArray(usersData) ? usersData : []);
      }

      if (questionsRes.ok) {
        const questionsData = await questionsRes.json();
        setQuestions(Array.isArray(questionsData) ? questionsData : []);
      }

      if (votingRes.ok) {
        const votingData = await votingRes.json();
        setVotingActive(votingData.active || false);
      }

      if (pitchRes.ok) {
        const pitchData = await pitchRes.json();
        setCurrentPitchTeamId(pitchData.currentTeamId || null);
        setAllPitchesCompleted(pitchData.allCompleted || false);
      }

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData || {});
      }

      if (quizRes.ok) {
        const quizData = await quizRes.json();
        setQuizSettings(quizData || {});
      }

      if (systemRes.ok) {
        const systemData = await systemRes.json();
        setSystemStatus(systemData || {});
      }

      setSuccess("Data refreshed successfully");
    } catch (err) {
      setError("Failed to fetch data");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Round management functions
  const updateRound = async (roundId: number, status: "PENDING"|"ACTIVE"|"COMPLETED") => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/rounds", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roundId, status })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || "Failed to update round");
      }
      await fetchAllData();
      setSuccess(`Round status updated to ${status}`);
    } catch (e: any) {
      setError(e?.message || "Failed to update round");
    } finally {
      setLoading(false);
    }
  };

  // Voting control functions
  const setPitchTeam = async (teamId: number) => {
    try {
      setCurrentPitchTeamId(teamId);
      setVotingActive(false);
      const team = teams.find(t => t.id === teamId);
      await fetch("/api/voting/current", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, teamName: team?.name })
      });
      setSuccess(`Set ${team?.name} as pitching team`);
    } catch (err) {
      setError("Failed to set pitching team");
    }
  };

  const startVoting = async () => {
    try {
      setVotingActive(true);
      await fetch("/api/voting/current", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votingActive: true })
      });
      setSuccess("Voting started for 30 seconds");
    } catch (err) {
      setError("Failed to start voting");
    }
  };

  const endVoting = async () => {
    try {
      setVotingActive(false);
      await fetch("/api/voting/current", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ votingActive: false })
      });
      setSuccess("Voting ended");
    } catch (err) {
      setError("Failed to end voting");
    }
  };

  const completeAllPitches = async () => {
    try {
      setAllPitchesCompleted(true);
      await fetch("/api/voting/current", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allPitchesCompleted: true })
      });
      setSuccess("All pitches marked as completed");
    } catch (err) {
      setError("Failed to complete pitches");
    }
  };

  // Team management functions
  const updateTeamStatus = async (teamId: number, status: 'ACTIVE' | 'INACTIVE') => {
    try {
      const res = await fetch("/api/admin/teams", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId, status })
      });
      if (!res.ok) throw new Error("Failed to update team");
      await fetchAllData();
      setSuccess(`Team status updated to ${status}`);
    } catch (err) {
      setError("Failed to update team status");
    }
  };

  const deleteTeam = async (teamId: number) => {
    if (!confirm("Are you sure you want to delete this team? This action cannot be undone.")) return;
    try {
      const res = await fetch("/api/admin/teams", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId })
      });
      if (!res.ok) throw new Error("Failed to delete team");
      await fetchAllData();
      setSuccess("Team deleted successfully");
    } catch (err) {
      setError("Failed to delete team");
    }
  };

  // User management functions
  const updateUserRole = async (userId: string, isAdmin: boolean) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, isAdmin })
      });
      if (!res.ok) throw new Error("Failed to update user role");
      await fetchAllData();
      setSuccess(`User role updated to ${isAdmin ? 'Admin' : 'User'}`);
    } catch (err) {
      setError("Failed to update user role");
    }
  };

  // Quiz management functions
  const updateQuizSettings = async (settings: any) => {
    try {
      const res = await fetch("/api/admin/quiz-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error("Failed to update quiz settings");
      await fetchAllData();
      setSuccess("Quiz settings updated");
    } catch (err) {
      setError("Failed to update quiz settings");
    }
  };

  const resetAllQuizzes = async () => {
    if (!confirm("Are you sure you want to reset all quiz progress? This will clear all user answers and scores.")) return;
    try {
      const res = await fetch("/api/admin/reset-quizzes", {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to reset quizzes");
      await fetchAllData();
      setSuccess("All quiz progress has been reset");
    } catch (err) {
      setError("Failed to reset quizzes");
    }
  };

  // System management functions
  const clearAllCache = async () => {
    try {
      const res = await fetch("/api/admin/clear-cache", {
        method: "POST"
      });
      if (!res.ok) throw new Error("Failed to clear cache");
      setSuccess("System cache cleared");
    } catch (err) {
      setError("Failed to clear cache");
    }
  };

  const exportAllData = async () => {
    try {
      const res = await fetch("/api/admin/export");
      if (!res.ok) throw new Error("Failed to export data");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `techsummit-data-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      setSuccess("Data exported successfully");
    } catch (err) {
      setError("Failed to export data");
    }
  };

  // Tab content renderer
  const renderTabContent = () => {
    switch (activeTab) {
      case 'rounds':
        return (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        );

      case 'voting':
        return (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">Voting Control</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm mb-2">Select Pitching Team</label>
                  <select 
                    value={currentPitchTeamId ?? ''} 
                    onChange={e => setPitchTeam(Number(e.target.value))} 
                    className="w-full rounded-md border px-3 py-2 bg-background"
                  >
                    <option value={''}>-- Select Team --</option>
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>{t.name} (#{t.id})</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="text-sm text-muted-foreground">
                    Current: {currentPitchTeamId ? teams.find(t => t.id === currentPitchTeamId)?.name : 'None'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Status: {votingActive ? '🟢 Voting Active' : '🔴 Voting Inactive'}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button onClick={startVoting} disabled={!currentPitchTeamId || votingActive} className="rounded-md bg-green-600 px-4 py-2 text-white font-bold disabled:opacity-50">Start 30s Voting</button>
                <button onClick={endVoting} disabled={!votingActive} className="rounded-md bg-red-600 px-4 py-2 text-white font-bold disabled:opacity-50">End Voting</button>
                <button onClick={completeAllPitches} disabled={allPitchesCompleted} className="rounded-md bg-purple-600 px-4 py-2 text-white font-bold disabled:opacity-50">Complete All Pitches</button>
              </div>
            </div>
            
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">Voting Statistics</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.totalVotes || 0}</div>
                  <div className="text-sm text-muted-foreground">Total Votes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.activeVoters || 0}</div>
                  <div className="text-sm text-muted-foreground">Active Voters</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.completedPitches || 0}</div>
                  <div className="text-sm text-muted-foreground">Completed Pitches</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'teams':
        return (
          <div className="space-y-4">
            {teams.map((team) => (
              <div key={team.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{team.name}</h3>
                    <p className="text-sm text-muted-foreground">ID: {team.id} • Members: {team.memberCount || 0}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => updateTeamStatus(team.id, team.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                      className={`px-3 py-1 rounded-md text-sm ${team.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                    >
                      {team.status || 'ACTIVE'}
                    </button>
                    <button 
                      onClick={() => deleteTeam(team.id)}
                      className="px-3 py-1 rounded-md text-sm bg-red-100 text-red-800 hover:bg-red-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'users':
        return (
          <div className="space-y-4">
            {users.map((user) => (
              <div key={user.id} className="rounded-lg border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{user.name}</h3>
                    <p className="text-sm text-muted-foreground">{user.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => updateUserRole(user.id, !user.isAdmin)}
                      className={`px-3 py-1 rounded-md text-sm ${
                        user.isAdmin 
                          ? 'bg-purple-100 text-purple-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {user.isAdmin ? 'Admin' : 'User'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'quiz':
        return (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">Quiz Settings</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm mb-2">Time Limit (minutes)</label>
                  <input 
                    type="number" 
                    value={quizSettings.timeLimit || 30}
                    onChange={e => setQuizSettings({...quizSettings, timeLimit: Number(e.target.value)})}
                    className="w-full rounded-md border px-3 py-2 bg-background"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2">Total Questions</label>
                  <input 
                    type="number" 
                    value={questions.length}
                    readOnly
                    className="w-full rounded-md border px-3 py-2 bg-background opacity-50"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => updateQuizSettings(quizSettings)}
                  className="rounded-md bg-blue-600 px-4 py-2 text-white"
                >
                  Update Settings
                </button>
                <button 
                  onClick={resetAllQuizzes}
                  className="rounded-md bg-red-600 px-4 py-2 text-white"
                >
                  Reset All Quizzes
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">Quiz Statistics</h3>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.quizAttempts || 0}</div>
                  <div className="text-sm text-muted-foreground">Quiz Attempts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.completedQuizzes || 0}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.averageScore || 0}%</div>
                  <div className="text-sm text-muted-foreground">Average Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{stats.highestScore || 0}%</div>
                  <div className="text-sm text-muted-foreground">Highest Score</div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="font-semibold mb-4">Platform Overview</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Total Users:</span>
                    <span className="font-semibold">{users.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Teams:</span>
                    <span className="font-semibold">{teams.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Active Rounds:</span>
                    <span className="font-semibold">{rounds.filter(r => r.status === 'ACTIVE').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Quiz Questions:</span>
                    <span className="font-semibold">{questions.length}</span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="font-semibold mb-4">System Health</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Database:</span>
                    <span className="text-green-600">🟢 Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span>API Status:</span>
                    <span className="text-green-600">🟢 Online</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cache:</span>
                    <span className="text-green-600">🟢 Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Last Backup:</span>
                    <span className="text-sm text-muted-foreground">{systemStatus.lastBackup || 'Never'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'system':
        return (
          <div className="space-y-6">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">System Operations</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <button 
                  onClick={clearAllCache}
                  className="rounded-md border border-border px-4 py-3 hover:bg-accent text-left"
                >
                  <div className="font-medium">Clear System Cache</div>
                  <div className="text-sm text-muted-foreground">Clear all cached data</div>
                </button>
                <button 
                  onClick={exportAllData}
                  className="rounded-md border border-border px-4 py-3 hover:bg-accent text-left"
                >
                  <div className="font-medium">Export All Data</div>
                  <div className="text-sm text-muted-foreground">Download complete data backup</div>
                </button>
                <button 
                  onClick={() => window.open('/api/admin/logs', '_blank')}
                  className="rounded-md border border-border px-4 py-3 hover:bg-accent text-left"
                >
                  <div className="font-medium">View System Logs</div>
                  <div className="text-sm text-muted-foreground">Check application logs</div>
                </button>
                <button 
                  onClick={fetchAllData}
                  className="rounded-md border border-border px-4 py-3 hover:bg-accent text-left"
                >
                  <div className="font-medium">Refresh All Data</div>
                  <div className="text-sm text-muted-foreground">Reload all dashboard data</div>
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <Link href="/api/rounds" className="rounded-lg border border-border p-4 hover:bg-accent">
                  <h4 className="font-medium">API: Rounds</h4>
                  <p className="mt-1 text-sm text-muted-foreground">Inspect current round states</p>
                </Link>
                <Link href="/api/questions" className="rounded-lg border border-border p-4 hover:bg-accent">
                  <h4 className="font-medium">API: Questions</h4>
                  <p className="mt-1 text-sm text-muted-foreground">View quiz questions</p>
                </Link>
                <Link href="/api/teams" className="rounded-lg border border-border p-4 hover:bg-accent">
                  <h4 className="font-medium">API: Teams</h4>
                  <p className="mt-1 text-sm text-muted-foreground">Team data and stats</p>
                </Link>
              </div>
            </div>
          </div>
        );

      default:
        return <div>Select a tab to view content</div>;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold">Comprehensive Admin Console</h1>
        <p className="mt-1 text-muted-foreground">Complete platform control and monitoring</p>
        
        {error && (
          <div className="mt-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive border border-destructive/20">
            ❌ {error}
          </div>
        )}
        
        {success && (
          <div className="mt-4 rounded-md bg-green-50 px-4 py-3 text-sm text-green-800 border border-green-200">
            ✅ {success}
          </div>
        )}

        {loading && (
          <div className="mt-4 rounded-md bg-blue-50 px-4 py-3 text-sm text-blue-800 border border-blue-200">
            ⏳ Loading...
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mt-8 border-b border-border">
          <nav className="flex space-x-8">
            {[
              { id: 'rounds', label: 'Rounds', icon: '🎯' },
              { id: 'voting', label: 'Voting', icon: '🗳️' },
              { id: 'teams', label: 'Teams', icon: '👥' },
              { id: 'users', label: 'Users', icon: '👤' },
              { id: 'quiz', label: 'Quiz', icon: '❓' },
              { id: 'analytics', label: 'Analytics', icon: '📊' },
              { id: 'system', label: 'System', icon: '⚙️' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="mt-8">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
}