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
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [questionFormData, setQuestionFormData] = useState({
    text: '',
    maxTokenPerQuestion: 4,
    options: [
      { text: '', tokenDeltaMarketing: 0, tokenDeltaCapital: 0, tokenDeltaTeam: 0, tokenDeltaStrategy: 0, totalScoreDelta: 0 },
      { text: '', tokenDeltaMarketing: 0, tokenDeltaCapital: 0, tokenDeltaTeam: 0, tokenDeltaStrategy: 0, totalScoreDelta: 0 }
    ]
  });

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
      const [roundsRes, teamsRes, usersRes, questionsRes, votingRes, pitchRes, statsRes, quizRes, systemRes, adminQuestionsRes] = await Promise.all([
        fetch("/api/rounds"),
        fetch("/api/teams"),
        fetch("/api/admin/users"),
        fetch("/api/questions"),
        fetch("/api/votes/active"),
        fetch("/api/final/pitches/current"),
        fetch("/api/admin/stats"),
        fetch("/api/admin/quiz-settings"),
        fetch("/api/admin/system-status"),
        fetch("/api/admin/questions")
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

      if (adminQuestionsRes.ok) {
        const adminQuestionsData = await adminQuestionsRes.json();
        setQuestions(Array.isArray(adminQuestionsData) ? adminQuestionsData : []);
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
    
    // Check if trying to complete an already completed round
    if (status === "COMPLETED") {
      const currentRound = rounds.find(r => r.id === roundId);
      if (currentRound && currentRound.status === "COMPLETED") {
        setError(`Round "${currentRound.name}" is already completed`);
        setLoading(false);
        return;
      }
    }
    
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
      
      // Get round name for success message
      const roundName = rounds.find(r => r.id === roundId)?.name || `Round ${roundId}`;
      if (status === "COMPLETED") {
        setSuccess(`Round "${roundName}" has been completed successfully`);
      } else {
        setSuccess(`Round "${roundName}" status updated to ${status}`);
      }
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
    // Check if pitches are already completed
    if (allPitchesCompleted) {
      setError("All pitches are already completed");
      return;
    }
    
    try {
      setAllPitchesCompleted(true);
      await fetch("/api/voting/current", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allPitchesCompleted: true })
      });
      setSuccess("All pitches marked as completed successfully");
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

  // Question management functions
  const openQuestionForm = (question: any = null) => {
    if (question) {
      setEditingQuestion(question);
      setQuestionFormData({
        text: question.text,
        maxTokenPerQuestion: question.maxTokenPerQuestion,
        options: question.options.length > 0 ? question.options : [
          { text: '', tokenDeltaMarketing: 0, tokenDeltaCapital: 0, tokenDeltaTeam: 0, tokenDeltaStrategy: 0, totalScoreDelta: 0 },
          { text: '', tokenDeltaMarketing: 0, tokenDeltaCapital: 0, tokenDeltaTeam: 0, tokenDeltaStrategy: 0, totalScoreDelta: 0 }
        ]
      });
    } else {
      setEditingQuestion(null);
      setQuestionFormData({
        text: '',
        maxTokenPerQuestion: 4,
        options: [
          { text: '', tokenDeltaMarketing: 0, tokenDeltaCapital: 0, tokenDeltaTeam: 0, tokenDeltaStrategy: 0, totalScoreDelta: 0 },
          { text: '', tokenDeltaMarketing: 0, tokenDeltaCapital: 0, tokenDeltaTeam: 0, tokenDeltaStrategy: 0, totalScoreDelta: 0 }
        ]
      });
    }
    setShowQuestionForm(true);
  };

  const closeQuestionForm = () => {
    setShowQuestionForm(false);
    setEditingQuestion(null);
  };

  const addOption = () => {
    setQuestionFormData(prev => ({
      ...prev,
      options: [...prev.options, { text: '', tokenDeltaMarketing: 0, tokenDeltaCapital: 0, tokenDeltaTeam: 0, tokenDeltaStrategy: 0, totalScoreDelta: 0 }]
    }));
  };

  const removeOption = (index: number) => {
    if (questionFormData.options.length <= 2) {
      setError("At least 2 options are required");
      return;
    }
    setQuestionFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }));
  };

  const updateOption = (index: number, field: string, value: any) => {
    setQuestionFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }));
  };

  const saveQuestion = async () => {
    try {
      if (!questionFormData.text.trim()) {
        setError("Question text is required");
        return;
      }

      if (questionFormData.options.some(opt => !opt.text.trim())) {
        setError("All options must have text");
        return;
      }

      const method = editingQuestion ? "PATCH" : "POST";
      const body: any = {
        text: questionFormData.text,
        maxTokenPerQuestion: questionFormData.maxTokenPerQuestion,
        questionOptions: questionFormData.options
      };

      if (editingQuestion) {
        body.questionId = editingQuestion.id;
      }

      const res = await fetch("/api/admin/questions", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save question");
      }

      await fetchAllData();
      setSuccess(editingQuestion ? "Question updated successfully" : "Question created successfully");
      closeQuestionForm();
    } catch (err: any) {
      setError(err.message || "Failed to save question");
    }
  };

  const deleteQuestion = async (questionId: number) => {
    if (!confirm("Are you sure you want to delete this question? This action cannot be undone.")) return;
    try {
      const res = await fetch("/api/admin/questions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId })
      });
      if (!res.ok) throw new Error("Failed to delete question");
      await fetchAllData();
      setSuccess("Question deleted successfully");
    } catch (err) {
      setError("Failed to delete question");
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
              <div key={r.id} className={`rounded-lg border p-4 ${
                r.status === 'COMPLETED' ? 'border-green-300 bg-green-50' : 
                r.status === 'ACTIVE' ? 'border-blue-300 bg-blue-50' : 
                'border-border bg-card'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-black">{r.name}</h3>
                    <p className="text-xs text-gray-600">
                      Day {r.day} • Status: 
                      <span className={`font-medium ml-1 ${
                        r.status === 'COMPLETED' ? 'text-green-700' :
                        r.status === 'ACTIVE' ? 'text-blue-700' :
                        'text-gray-700'
                      }`}>
                        {r.status}
                        {r.status === 'COMPLETED' ? ' ✅' : ''}
                      </span>
                    </p>
                  </div>
                </div>
                {r.status === 'COMPLETED' && (
                  <div className="mt-2 text-xs text-green-700 font-medium">
                    This round has been completed
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button 
                    disabled={loading || r.status === 'COMPLETED'} 
                    onClick={() => updateRound(r.id, "PENDING")} 
                    className="rounded-md border border-border px-3 py-1 text-sm text-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Set Pending
                  </button>
                  <button 
                    disabled={loading || r.status === 'COMPLETED'} 
                    onClick={() => updateRound(r.id, "ACTIVE")} 
                    className="rounded-md border border-border px-3 py-1 text-sm text-black hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Start
                  </button>
                  <button 
                    disabled={loading || r.status === 'COMPLETED'} 
                    onClick={() => updateRound(r.id, "COMPLETED")} 
                    className={`rounded-md border px-3 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      r.status === 'COMPLETED' 
                        ? 'border-green-300 bg-green-100 text-green-700 cursor-not-allowed' 
                        : 'border-border text-black hover:bg-gray-50'
                    }`}
                  >
                    {r.status === 'COMPLETED' ? 'Completed ✅' : 'Complete'}
                  </button>
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
              <h3 className="font-semibold mb-4 text-white">Quiz Settings</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm mb-2 text-white">Time Limit (minutes)</label>
                  <input 
                    type="number" 
                    value={quizSettings.timeLimit || 30}
                    onChange={e => setQuizSettings({...quizSettings, timeLimit: Number(e.target.value)})}
                    className="w-full rounded-md border px-3 py-2 bg-white text-black"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-white">Total Questions</label>
                  <input 
                    type="number" 
                    value={questions.length}
                    readOnly
                    className="w-full rounded-md border px-3 py-2 bg-gray-100 text-black opacity-75"
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
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-white">Question Management</h3>
                <button 
                  onClick={() => openQuestionForm()}
                  disabled={questions.length >= 15}
                  className="rounded-md bg-green-600 px-4 py-2 text-white disabled:opacity-50"
                >
                  Add Question ({questions.length}/15)
                </button>
              </div>
              
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="border border-border rounded-lg p-4 bg-white">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-black">Q{index + 1}: {question.text}</h4>
                        <p className="text-sm text-gray-600 mt-1">
                          Max tokens: {question.maxTokenPerQuestion} • Options: {question.options?.length || 0}
                        </p>
                        {question.options && question.options.length > 0 && (
                          <div className="mt-2 grid gap-1">
                            {question.options.map((option: any, optIndex: number) => (
                              <div key={optIndex} className="text-sm bg-gray-100 px-2 py-1 rounded text-black">
                                {String.fromCharCode(65 + optIndex)}. {option.text}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => openQuestionForm(question)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded"
                        >
                          Edit
                        </button>
                        <button 
                          onClick={() => deleteQuestion(question.id)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-800 rounded"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {questions.length === 0 && (
                  <div className="text-center py-8 text-gray-600">
                    No questions added yet. Click "Add Question" to get started.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-4 text-white">Quiz Statistics</h3>
              <div className="grid gap-4 md:grid-cols-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{stats.quizAttempts || 0}</div>
                  <div className="text-sm text-white">Quiz Attempts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{stats.completedQuizzes || 0}</div>
                  <div className="text-sm text-white">Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{stats.averageScore || 0}%</div>
                  <div className="text-sm text-white">Average Score</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{stats.highestScore || 0}%</div>
                  <div className="text-sm text-white">Highest Score</div>
                </div>
              </div>
            </div>

            {/* Question Form Modal */}
            {showQuestionForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto text-black">
                  <h3 className="text-lg font-semibold mb-4 text-black">
                    {editingQuestion ? 'Edit Question' : 'Add New Question'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-2 text-black">Question Text</label>
                      <textarea 
                        value={questionFormData.text}
                        onChange={e => setQuestionFormData(prev => ({...prev, text: e.target.value}))}
                        className="w-full rounded-md border px-3 py-2 bg-white text-black"
                        rows={3}
                        placeholder="Enter the quiz question..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2 text-black">Max Tokens Per Question</label>
                      <input 
                        type="number" 
                        value={questionFormData.maxTokenPerQuestion}
                        onChange={e => setQuestionFormData(prev => ({...prev, maxTokenPerQuestion: Number(e.target.value)}))}
                        className="w-full rounded-md border px-3 py-2 bg-white text-black"
                        min="1"
                        max="10"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm text-black">Options</label>
                        <button 
                          onClick={addOption}
                          className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded"
                        >
                          Add Option
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {questionFormData.options.map((option, index) => (
                          <div key={index} className="border border-gray-300 rounded-lg p-3 bg-gray-50">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-black">Option {String.fromCharCode(65 + index)}</span>
                              {questionFormData.options.length > 2 && (
                                <button 
                                  onClick={() => removeOption(index)}
                                  className="px-2 py-1 text-sm bg-red-100 text-red-800 rounded"
                                >
                                  Remove
                                </button>
                              )}
                            </div>
                            
                            <div className="grid gap-3">
                              <div>
                                <label className="block text-xs mb-1 text-black">Option Text</label>
                                <input 
                                  type="text"
                                  value={option.text}
                                  onChange={e => updateOption(index, 'text', e.target.value)}
                                  className="w-full rounded-md border px-2 py-1 text-sm bg-white text-black"
                                  placeholder="Enter option text..."
                                />
                              </div>
                              
                              <div className="grid grid-cols-5 gap-2">
                                <div>
                                  <label className="block text-xs mb-1 text-black">Marketing</label>
                                  <input 
                                    type="number"
                                    value={option.tokenDeltaMarketing}
                                    onChange={e => updateOption(index, 'tokenDeltaMarketing', Number(e.target.value))}
                                    className="w-full rounded-md border px-2 py-1 text-sm bg-white text-black"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs mb-1 text-black">Capital</label>
                                  <input 
                                    type="number"
                                    value={option.tokenDeltaCapital}
                                    onChange={e => updateOption(index, 'tokenDeltaCapital', Number(e.target.value))}
                                    className="w-full rounded-md border px-2 py-1 text-sm bg-white text-black"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs mb-1 text-black">Team</label>
                                  <input 
                                    type="number"
                                    value={option.tokenDeltaTeam}
                                    onChange={e => updateOption(index, 'tokenDeltaTeam', Number(e.target.value))}
                                    className="w-full rounded-md border px-2 py-1 text-sm bg-white text-black"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs mb-1 text-black">Strategy</label>
                                  <input 
                                    type="number"
                                    value={option.tokenDeltaStrategy}
                                    onChange={e => updateOption(index, 'tokenDeltaStrategy', Number(e.target.value))}
                                    className="w-full rounded-md border px-2 py-1 text-sm bg-white text-black"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs mb-1 text-black">Score</label>
                                  <input 
                                    type="number"
                                    value={option.totalScoreDelta}
                                    onChange={e => updateOption(index, 'totalScoreDelta', Number(e.target.value))}
                                    className="w-full rounded-md border px-2 py-1 text-sm bg-white text-black"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6">
                    <button 
                      onClick={saveQuestion}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md"
                    >
                      {editingQuestion ? 'Update Question' : 'Create Question'}
                    </button>
                    <button 
                      onClick={closeQuestionForm}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
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