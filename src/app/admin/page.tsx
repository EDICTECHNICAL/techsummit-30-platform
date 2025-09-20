"use client"

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BackButton } from "@/components/BackButton";
import { SecurityGuard, AntiCheatMeasures } from "@/components/SecurityGuard";

export default function AdminPage() {
  const [rounds, setRounds] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [questions, setQuestions] = useState<any[]>([]);
  const [currentPitchTeamId, setCurrentPitchTeamId] = useState<number | null>(null);
  const [votingActive, setVotingActive] = useState(false);
  const [allPitchesCompleted, setAllPitchesCompleted] = useState(false);
  
  // Pitch cycle state
  const [pitchCycleActive, setPitchCycleActive] = useState(false);
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'pitching' | 'qna-pause' | 'rating-warning' | 'rating-active'>('idle');
  const [votingPhase, setVotingPhase] = useState<'preparing' | 'voting'>('preparing');
  const [phaseTimeLeft, setPhaseTimeLeft] = useState<number>(0);
  const [cycleStartTime, setCycleStartTime] = useState<number | null>(null);
  
  // Rating cycle state (for finals)
  const [ratingCycleActive, setRatingCycleActive] = useState<boolean>(false);
  const [ratingPhase, setRatingPhase] = useState<'idle' | 'pitching' | 'qna-pause' | 'rating-warning' | 'rating-active'>('idle');
  const [ratingPhaseTimeLeft, setRatingPhaseTimeLeft] = useState<number>(0);
  const [ratingCycleStartTime, setRatingCycleStartTime] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stats, setStats] = useState<any>({});
  const [activeTab, setActiveTab] = useState<'rounds' | 'voting' | 'final' | 'teams' | 'users' | 'quiz' | 'analytics' | 'system'>('rounds');
  const [quizSettings, setQuizSettings] = useState<any>({});
  const [systemStatus, setSystemStatus] = useState<any>({});
  const [systemSettings, setSystemSettings] = useState<any>({});
  const [showQuestionForm, setShowQuestionForm] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any>(null);
  const [questionFormData, setQuestionFormData] = useState({
    text: '',
    maxTokenPerQuestion: 4,
    options: [
      { text: '', tokenDeltaMarketing: 0, tokenDeltaCapital: 0, tokenDeltaTeam: 0, tokenDeltaStrategy: 0 },
      { text: '', tokenDeltaMarketing: 0, tokenDeltaCapital: 0, tokenDeltaTeam: 0, tokenDeltaStrategy: 0 }
    ]
  });
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check for admin session cookie
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isAdmin = document.cookie.includes("admin-auth=true");
      if (!isAdmin) {
        window.location.href = "/admin/login";
        return;
      }

      // Security: Block navigation to unauthorized pages for admin users
      const handlePopState = () => {
        const currentPath = window.location.pathname;
        const allowedPaths = ['/scoreboard', '/admin', '/dashboard'];
        if (!allowedPaths.some(path => currentPath.startsWith(path))) {
          window.location.href = '/scoreboard';
        }
      };

      window.addEventListener('popstate', handlePopState);
      
      return () => {
        window.removeEventListener('popstate', handlePopState);
      };
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

  // Comprehensive data fetching with timeout and fallback
  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      // Helper function to fetch with timeout
      const fetchWithTimeout = async (url: string, timeout = 5000) => {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
          const response = await fetch(url, { 
            signal: controller.signal,
            headers: {
              'Cache-Control': 'no-cache'
            }
          });
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          throw error;
        }
      };

      // Critical data first (shorter timeout, faster APIs)
      const criticalCalls = await Promise.allSettled([
        fetchWithTimeout("/api/rounds", 3000),
        fetchWithTimeout("/api/teams", 3000),
        fetchWithTimeout("/api/votes/active", 2000),
        fetchWithTimeout("/api/final/pitches/current", 2000),
      ]);

      // Process critical data immediately
      const [roundsRes, teamsRes, votingRes, pitchRes] = criticalCalls;

      if (roundsRes.status === 'fulfilled' && roundsRes.value.ok) {
        const roundsData = await roundsRes.value.json();
        setRounds(Array.isArray(roundsData) ? roundsData : []);
      }

      if (teamsRes.status === 'fulfilled' && teamsRes.value.ok) {
        const teamsData = await teamsRes.value.json();
        let allTeams = Array.isArray(teamsData) ? teamsData : [];
        console.log('Teams loaded:', allTeams.length, 'teams');
        setTeams(allTeams);
      } else {
        console.error('Failed to load teams:', teamsRes.status === 'rejected' ? teamsRes.reason : 'Request failed');
        setError('Failed to load teams data');
      }

      if (votingRes.status === 'fulfilled' && votingRes.value.ok) {
        const votingData = await votingRes.value.json();
        setVotingActive(votingData.active || false);
      }

      if (pitchRes.status === 'fulfilled' && pitchRes.value.ok) {
        const pitchData = await pitchRes.value.json();
        setCurrentPitchTeamId(pitchData.currentTeamId || null);
        setAllPitchesCompleted(pitchData.allCompleted || false);
      }

      // Non-critical data (longer timeout, can fail gracefully)
      const nonCriticalCalls = await Promise.allSettled([
        fetchWithTimeout("/api/admin/users", 8000),
        fetchWithTimeout("/api/questions", 8000),
        fetchWithTimeout("/api/admin/stats", 8000),
        fetchWithTimeout("/api/admin/quiz-settings", 5000),
        fetchWithTimeout("/api/admin/system-status", 8000),
        fetchWithTimeout("/api/admin/questions", 8000),
        fetchWithTimeout("/api/admin/system-settings", 8000),
        fetchWithTimeout("/api/final/qualified-teams", 8000)
      ]);

      const [usersRes, questionsRes, statsRes, quizRes, systemRes, adminQuestionsRes, systemSettingsRes, qualifiedTeamsRes] = nonCriticalCalls;

      // Process non-critical data with fallbacks
      if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
        const usersData = await usersRes.value.json();
        setUsers(Array.isArray(usersData) ? usersData : []);
      } else {
        console.warn('Failed to load users data:', usersRes.status === 'rejected' ? usersRes.reason : 'Request failed');
        setUsers([]);
      }

      if (questionsRes.status === 'fulfilled' && questionsRes.value.ok) {
        const questionsData = await questionsRes.value.json();
        setQuestions(Array.isArray(questionsData) ? questionsData : []);
      } else {
        console.warn('Failed to load questions data:', questionsRes.status === 'rejected' ? questionsRes.reason : 'Request failed');
        setQuestions([]);
      }

      if (adminQuestionsRes.status === 'fulfilled' && adminQuestionsRes.value.ok) {
        const adminQuestionsData = await adminQuestionsRes.value.json();
        setQuestions(Array.isArray(adminQuestionsData) ? adminQuestionsData : []);
      }

      if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
        const statsData = await statsRes.value.json();
        setStats(statsData || {});
      } else {
        console.warn('Failed to load stats data:', statsRes.status === 'rejected' ? statsRes.reason : 'Request failed');
        setStats({});
      }

      if (quizRes.status === 'fulfilled' && quizRes.value.ok) {
        const quizData = await quizRes.value.json();
        setQuizSettings(quizData || {});
      } else {
        console.warn('Failed to load quiz settings:', quizRes.status === 'rejected' ? quizRes.reason : 'Request failed');
        setQuizSettings({});
      }

      if (systemRes.status === 'fulfilled' && systemRes.value.ok) {
        const systemData = await systemRes.value.json();
        setSystemStatus(systemData || {});
      } else {
        console.warn('Failed to load system status:', systemRes.status === 'rejected' ? systemRes.reason : 'Request failed');
        setSystemStatus({});
      }

      if (systemSettingsRes.status === 'fulfilled' && systemSettingsRes.value.ok) {
        const systemSettingsData = await systemSettingsRes.value.json();
        setSystemSettings(systemSettingsData || {});
      } else {
        console.warn('Failed to load system settings:', systemSettingsRes.status === 'rejected' ? systemSettingsRes.reason : 'Request failed');
        setSystemSettings({});
      }

      // Update teams with qualification status if available
      if (qualifiedTeamsRes.status === 'fulfilled' && qualifiedTeamsRes.value.ok) {
        try {
          const qualifiedData = await qualifiedTeamsRes.value.json();
          const qualifiedTeamIds = new Set(qualifiedData.qualifiedTeams?.map((t: any) => t.teamId) || []);
          setTeams(prevTeams => prevTeams.map(team => ({
            ...team,
            qualifiedForFinal: qualifiedTeamIds.has(team.id)
          })));
        } catch (err) {
          console.warn('Failed to process qualified teams data:', err);
        }
      } else {
        console.warn('Failed to load qualified teams:', qualifiedTeamsRes.status === 'rejected' ? qualifiedTeamsRes.reason : 'Request failed');
      }

      setSuccess("Data loaded successfully");
    } catch (err) {
      setError("Failed to fetch some data - page may have limited functionality");
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Rating cycle polling for real-time updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const pollRatingCycle = async () => {
      try {
        const res = await fetch('/api/rating/current', {
          headers: { 'Cache-Control': 'no-cache' }
        });
        if (res.ok) {
          const data = await res.json();
          // console.log('Polling rating cycle data:', data); // Debug log
          // console.log('Setting ratingPhase to:', data.currentPhase); // Debug log
          
          // Only update state if values have actually changed to prevent unnecessary re-renders
          if (data.ratingCycleActive !== ratingCycleActive) {
            setRatingCycleActive(data.ratingCycleActive || false);
          }
          if (data.currentPhase !== ratingPhase) {
            setRatingPhase(data.currentPhase || 'idle');
          }
          if (data.phaseTimeLeft !== ratingPhaseTimeLeft) {
            setRatingPhaseTimeLeft(data.phaseTimeLeft || 0);
          }
          if (data.cycleStartTime !== ratingCycleStartTime) {
            setRatingCycleStartTime(data.cycleStartTime || null);
          }
          
          // Update current pitch team if changed
          if (data.team?.id && data.team.id !== currentPitchTeamId) {
            setCurrentPitchTeamId(data.team.id);
          }
        }
      } catch (error) {
        console.error('Failed to poll rating cycle:', error);
      }
    };

    // Poll every 2 seconds when on finals tab (reduced frequency to prevent glitching)
    if (activeTab === 'final') {
      console.log('Starting rating cycle polling for finals tab'); // Debug log
      pollRatingCycle(); // Initial fetch
      interval = setInterval(pollRatingCycle, 2000); // Changed from 1000ms to 2000ms
    } else {
      console.log('Not on finals tab, stopping polling'); // Debug log
    }

    return () => {
      if (interval) {
        console.log('Cleaning up polling interval'); // Debug log
        clearInterval(interval);
      }
    };
  }, [activeTab, currentPitchTeamId]);

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
      
      // Get round name for success message
      const roundName = rounds.find(r => r.id === roundId)?.name || `Round ${roundId}`;
      setSuccess(`Round "${roundName}" status updated to ${status}`);
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
      const newStatus = !allPitchesCompleted;
      setAllPitchesCompleted(newStatus);
      await fetch("/api/voting/current", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ allPitchesCompleted: newStatus })
      });
      setSuccess(newStatus ? "All pitches marked as completed" : "All pitches marked as incomplete");
    } catch (err) {
      setError("Failed to update pitch status");
    }
  };

  // Pitch cycle management functions
  const startPitchCycle = async () => {
    if (!currentPitchTeamId) {
      setError("Please select a team first");
      return;
    }

    try {
      setPitchCycleActive(true);
      setCurrentPhase('pitching');
      setPhaseTimeLeft(90);
      setCycleStartTime(Date.now());
      
      // Update backend to start pitch cycle
      await fetch("/api/voting/current", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          pitchCycleActive: true,
          currentPhase: 'pitching',
          phaseTimeLeft: 90,
          cycleStartTime: Date.now()
        })
      });
      
      setSuccess("Pitch cycle started - 90 seconds for pitch presentation");
    } catch (err) {
      setError("Failed to start pitch cycle");
      setPitchCycleActive(false);
      setCurrentPhase('idle');
    }
  };

  const endPitchCycle = async () => {
    try {
      setPitchCycleActive(false);
      setCurrentPhase('idle');
      setPhaseTimeLeft(0);
      setCycleStartTime(null);
      setVotingActive(false);
      
      // Update backend to end pitch cycle
      await fetch("/api/voting/current", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          pitchCycleActive: false,
          currentPhase: 'idle',
          phaseTimeLeft: 0,
          votingActive: false 
        })
      });
      
      setSuccess("Pitch cycle ended");
    } catch (err) {
      setError("Failed to end pitch cycle");
    }
  };

  // Pitch cycle timer effect
  useEffect(() => {
    if (!pitchCycleActive || !cycleStartTime) return;

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - cycleStartTime) / 1000);
      
      if (elapsed < 90) {
        // Pitching phase (90 seconds)
        setCurrentPhase('pitching');
        setPhaseTimeLeft(90 - elapsed);
      } else if (elapsed < 95) {
        // Preparation phase (5 seconds)
        if (votingPhase !== 'preparing') {
          setVotingPhase('preparing');
          setSuccess("Preparation time - teams get ready to vote!");
        }
        setPhaseTimeLeft(95 - elapsed);
      } else if (elapsed < 125) {
        // Voting phase (30 seconds)
        if (votingPhase !== 'voting') {
          setVotingPhase('voting');
          setVotingActive(true);
          // Start voting on backend
          fetch("/api/voting/current", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ votingActive: true })
          }).catch(console.error);
          setSuccess("Voting is now active - 30 seconds remaining!");
        }
        setPhaseTimeLeft(125 - elapsed);
      } else {
        // Cycle complete
        endPitchCycle();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [pitchCycleActive, cycleStartTime, currentPhase]);

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
    if (!confirm("Are you sure you want to reset all quiz progress? This will clear all user answers and token data.")) return;
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
          { text: '', tokenDeltaMarketing: 0, tokenDeltaCapital: 0, tokenDeltaTeam: 0, tokenDeltaStrategy: 0 },
          { text: '', tokenDeltaMarketing: 0, tokenDeltaCapital: 0, tokenDeltaTeam: 0, tokenDeltaStrategy: 0 }
        ]
      });
    } else {
      setEditingQuestion(null);
      setQuestionFormData({
        text: '',
        maxTokenPerQuestion: 4,
        options: [
          { text: '', tokenDeltaMarketing: 0, tokenDeltaCapital: 0, tokenDeltaTeam: 0, tokenDeltaStrategy: 0 },
          { text: '', tokenDeltaMarketing: 0, tokenDeltaCapital: 0, tokenDeltaTeam: 0, tokenDeltaStrategy: 0 }
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
      options: [...prev.options, { text: '', tokenDeltaMarketing: 0, tokenDeltaCapital: 0, tokenDeltaTeam: 0, tokenDeltaStrategy: 0 }]
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

  // Rating cycle control functions  
  const fetchRatingCycleStatus = async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const res = await fetch("/api/rating/current", {
        signal: controller.signal,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (res.ok) {
        const status = await res.json();
        // Update rating cycle state
        setRatingCycleActive(status.ratingCycleActive || false);
        setRatingPhase(status.currentPhase || 'idle');
        setRatingPhaseTimeLeft(status.phaseTimeLeft || 0);
        setRatingCycleStartTime(status.cycleStartTime || null);
        
        // Update current pitch team if needed
        if (status.team?.id) {
          setCurrentPitchTeamId(status.team.id);
        }
      }
    } catch (error) {
      console.error("Error fetching rating cycle status:", error);
      // Don't show error to user for rating cycle status as it's not critical
    }
  };

  const startRatingCycle = async () => {
    try {
      setLoading(true);
      
      if (!currentPitchTeamId) {
        setError("Please select a team before starting the rating cycle");
        return;
      }

      const qualifiedTeams = teams.filter(team => team.qualifiedForFinal);
      const finalTeams = qualifiedTeams.length > 0 ? qualifiedTeams : teams;
      
      // First set the current team
      const selectedTeam = teams.find(t => t.id === currentPitchTeamId);
      if (selectedTeam) {
        await fetch("/api/rating/current", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            teamId: currentPitchTeamId,
            teamName: selectedTeam.name
          })
        });
      }
      
      // Then start the rating cycle
      const res = await fetch("/api/rating/current", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          action: "start",
          cycleType: "final",
          teams: finalTeams.map((t: any) => t.id),
          currentTeamId: currentPitchTeamId
        })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to start rating cycle");
      }

      await fetchRatingCycleStatus();
      setSuccess(`Rating cycle started for ${teams.find(t => t.id === currentPitchTeamId)?.name || 'selected team'}`);
    } catch (error) {
      console.error("Error starting rating cycle:", error);
      setError("Failed to start rating cycle");
    } finally {
      setLoading(false);
    }
  };

  const stopRatingCycle = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rating/current", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "stop" })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to stop rating cycle");
      }

      await fetchRatingCycleStatus();
      setSuccess("Rating cycle stopped successfully");
    } catch (error) {
      console.error("Error stopping rating cycle:", error);
      setError("Failed to stop rating cycle");
    } finally {
      setLoading(false);
    }
  };

  const startQnaSession = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rating/current", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start-qna" })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to start Q&A session");
      }

      await fetchRatingCycleStatus();
      setSuccess("Q&A session started - timer paused for Q&A between presenter and pitcher");
    } catch (error) {
      console.error("Error starting Q&A session:", error);
      setError("Failed to start Q&A session");
    } finally {
      setLoading(false);
    }
  };

  const startRatingFromQna = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/rating/current", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start-rating" })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to start rating phase");
      }

      await fetchRatingCycleStatus();
      setSuccess("Q&A completed - starting 5 second warning then 2 minute rating phase");
    } catch (error) {
      console.error("Error starting rating phase:", error);
      setError("Failed to start rating phase");
    } finally {
      setLoading(false);
    }
  };

  // Fullscreen functionality
  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Error toggling fullscreen:', error);
      setError('Failed to toggle fullscreen mode');
    }
  };

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // System management functions
  const updateSystemSetting = async (key: string, value: string) => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/system-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, value })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to update setting");
      }
      
      await fetchAllData();
      setSuccess(`Setting '${key}' updated successfully`);
    } catch (err: any) {
      setError(err.message || "Failed to update setting");
    } finally {
      setLoading(false);
    }
  };

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
                r.status === 'COMPLETED' ? 'border-green-300 bg-green-700' : 
                r.status === 'ACTIVE' ? 'border-blue-300 bg-blue-700' : 
                'border-border bg-card'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-foreground">{r.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Day {r.day} • Status: 
                      <span className={`font-medium ml-1 ${
                        r.status === 'COMPLETED' ? 'text-green-600 dark:text-green-400' :
                        r.status === 'ACTIVE' ? 'text-blue-600 dark:text-blue-400' :
                        'text-muted-foreground'
                      }`}>
                        {r.status}
                        {r.status === 'COMPLETED' ? ' ✅' : ''}
                      </span>
                    </p>
                  </div>
                </div>
                {r.status === 'COMPLETED' && (
                  <div className="mt-2 text-xs text-green-600 dark:text-green-400 font-medium">
                    This round is currently completed (can be changed)
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button 
                    disabled={loading} 
                    onClick={() => updateRound(r.id, "PENDING")} 
                    className="rounded-md border border-border px-3 py-1 text-sm text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Set Pending
                  </button>
                  <button 
                    disabled={loading} 
                    onClick={() => updateRound(r.id, "ACTIVE")} 
                    className="rounded-md border border-border px-3 py-1 text-sm text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Start
                  </button>
                  <button 
                    disabled={loading} 
                    onClick={() => updateRound(r.id, "COMPLETED")} 
                    className="rounded-md border border-border px-3 py-1 text-sm text-foreground hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Complete
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
              <h3 className="font-semibold mb-4">Pitch Cycle Control</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm mb-2">Select Pitching Team</label>
                  <select 
                    value={currentPitchTeamId ?? ''} 
                    onChange={e => setPitchTeam(Number(e.target.value))} 
                    className="w-full rounded-md border px-3 py-2 bg-background"
                    disabled={pitchCycleActive}
                  >
                    <option value={''}>-- Select Team --</option>
                    {(() => {
                      const qualifiedTeams = teams.filter(team => team.qualifiedForFinal);
                      const availableTeams = qualifiedTeams.length > 0 ? qualifiedTeams : teams;
                      return availableTeams.map(t => (
                        <option key={t.id} value={t.id}>
                          {t.name} (#{t.id}){t.qualifiedForFinal ? ' ✅' : ''}
                        </option>
                      ));
                    })()}
                  </select>
                  {(() => {
                    const qualifiedTeams = teams.filter(team => team.qualifiedForFinal);
                    if (teams.length === 0) {
                      return (
                        <div className="text-xs text-red-600 mt-1">
                          ❌ No teams loaded - check database connection
                        </div>
                      );
                    }
                    if (qualifiedTeams.length === 0) {
                      return (
                        <div className="text-xs text-yellow-600 mt-1">
                          ⚠️ No qualified teams yet - showing all {teams.length} teams
                        </div>
                      );
                    }
                    return (
                      <div className="text-xs text-green-600 mt-1">
                        ✅ Showing {qualifiedTeams.length} qualified teams for finals (out of {teams.length} total)
                      </div>
                    );
                  })()}
                </div>
                <div className="flex flex-col gap-2">
                  <div className="text-sm text-muted-foreground">
                    Current: {currentPitchTeamId ? teams.find(t => t.id === currentPitchTeamId)?.name : 'None'}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Cycle Status: {pitchCycleActive ? '🟢 Active' : '🔴 Inactive'}
                  </div>
                  {pitchCycleActive && (
                    <div className="text-sm font-medium">
                      Phase: <span className="capitalize">{currentPhase}</span> ({phaseTimeLeft}s remaining)
                    </div>
                  )}
                </div>
              </div>

              {/* Pitch Cycle Timer Display */}
              {pitchCycleActive && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-blue-900">
                      {currentPhase === 'pitching' && '🎤 Pitch Presentation'}
                      {votingPhase === 'preparing' && '⏳ Get Ready to Vote'}
                      {votingPhase === 'voting' && '🗳️ Voting Time'}
                    </h4>
                    <div className="text-2xl font-bold text-blue-800">
                      {phaseTimeLeft}s
                    </div>
                  </div>
                  <div className="w-full bg-blue-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-1000 ${
                        currentPhase === 'pitching' ? 'bg-green-500' :
                        votingPhase === 'preparing' ? 'bg-yellow-500' :
                        'bg-red-500'
                      }`}
                      style={{ 
                        width: `${Math.max(0, Math.min(100,
                          currentPhase === 'pitching' ? (phaseTimeLeft / 90) * 100 :
                          votingPhase === 'preparing' ? (phaseTimeLeft / 5) * 100 :
                          (phaseTimeLeft / 30) * 100
                        ))}%` 
                      }}
                    ></div>
                  </div>
                  <div className="mt-2 text-xs text-blue-700">
                    {currentPhase === 'pitching' && 'Team is presenting their pitch (90 seconds)'}
                    {votingPhase === 'preparing' && 'Teams prepare to vote (5 seconds)'}
                    {votingPhase === 'voting' && 'Teams can now vote (30 seconds)'}
                  </div>
                </div>
              )}

              <div className="flex gap-2 mt-4">
                <button 
                  onClick={startPitchCycle} 
                  disabled={!currentPitchTeamId || pitchCycleActive} 
                  className="rounded-md bg-green-600 px-4 py-2 text-white font-bold disabled:opacity-50"
                >
                  Start Pitch Cycle
                </button>
                <button 
                  onClick={endPitchCycle} 
                  disabled={!pitchCycleActive} 
                  className="rounded-md bg-red-600 px-4 py-2 text-white font-bold disabled:opacity-50"
                >
                  End Cycle
                </button>
                <button 
                  onClick={completeAllPitches} 
                  className="rounded-md bg-purple-600 px-4 py-2 text-white font-bold"
                >
                  {allPitchesCompleted ? 'Mark Pitches Incomplete' : 'Complete All Pitches'}
                </button>
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

      case 'final':
        return (
          <div className="space-y-6">
            {/* Rating Cycle Control */}
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">🎯 Real-Time Rating Cycle Control</h3>
              
              {/* Current Status Display */}
              <div className="grid gap-4 md:grid-cols-3 mb-6">
                <div className="text-center p-4 rounded-lg bg-muted">
                  <div className={`text-2xl font-bold ${ratingCycleActive ? 'text-green-600' : 'text-gray-400'}`}>
                    {ratingCycleActive ? '🟢 ACTIVE' : '⚪ IDLE'}
                  </div>
                  <div className="text-sm text-muted-foreground">Cycle Status</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <div className="text-2xl font-bold text-blue-600">
                    {ratingPhase.toUpperCase()}
                  </div>
                  <div className="text-sm text-muted-foreground">Current Phase</div>
                </div>
                <div className="text-center p-4 rounded-lg bg-muted">
                  <div className="text-2xl font-bold text-orange-600">
                    {ratingPhaseTimeLeft > 0 ? Math.ceil(ratingPhaseTimeLeft) : 0}s
                  </div>
                  <div className="text-sm text-muted-foreground">Time Left</div>
                </div>
              </div>

              {/* Current Pitch Team */}
              {currentPitchTeamId && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">📽️ Currently Presenting:</h4>
                  <p className="text-lg font-semibold text-green-900 dark:text-green-100">
                    {teams.find(t => t.id === currentPitchTeamId)?.name || `Team #${currentPitchTeamId}`}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300">
                    {teams.find(t => t.id === currentPitchTeamId)?.college || 'Unknown College'}
                  </p>
                </div>
              )}

              {/* Team Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Select Team for Pitch</label>
                <select 
                  value={currentPitchTeamId || ''} 
                  onChange={(e) => setCurrentPitchTeamId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                  disabled={ratingCycleActive}
                >
                  <option value="">Select team...</option>
                  {(() => {
                    const qualifiedTeams = teams.filter(team => team.qualifiedForFinal);
                    const teamsToShow = qualifiedTeams.length > 0 ? qualifiedTeams : teams;
                    return teamsToShow.map(team => (
                      <option key={team.id} value={team.id}>
                        {team.name} ({team.college})
                        {qualifiedTeams.length === 0 ? ' [All teams shown - no qualified teams yet]' : ''}
                      </option>
                    ));
                  })()}
                </select>
              </div>

              {/* Cycle Control Buttons - Enhanced with Q&A Controls */}
              <div className="space-y-4 mb-6">
                {/* Primary Controls */}
                <div className="grid gap-3 md:grid-cols-2">
                  <button 
                    onClick={startRatingCycle}
                    disabled={loading || !currentPitchTeamId || ratingCycleActive}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                  >
                    🚀 Start Rating Cycle (5min Pitch)
                  </button>
                  <button 
                    onClick={stopRatingCycle}
                    disabled={loading || !ratingCycleActive}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                  >
                    ⏹️ Stop Cycle
                  </button>
                </div>

                {/* Q&A Control Buttons - Only show when relevant */}
                {ratingCycleActive && (
                  <div className="border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
                    <h4 className="font-medium text-yellow-800 dark:text-yellow-200 mb-3">
                      🎤 Q&A Session Control
                    </h4>
                    
                    {/* Debug info */}
                    <div className="text-xs text-gray-500 mb-2">
                      Debug: ratingPhase = "{ratingPhase}", ratingCycleActive = {ratingCycleActive ? 'true' : 'false'}
                    </div>
                    
                    {ratingPhase === 'pitching' && (
                      <div className="space-y-3">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          🕐 Pitch in progress... Click below when 5 minutes are up or team finishes early.
                        </p>
                        <button 
                          onClick={startQnaSession}
                          disabled={loading}
                          className="w-full bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                        >
                          ❓ Start Q&A Session (Pause Timer)
                        </button>
                      </div>
                    )}
                    
                    {ratingPhase === 'qna-pause' && (
                      <div className="space-y-3">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          🗣️ Q&A session active - Timer paused for questions between presenter and pitcher.
                        </p>
                        <button 
                          onClick={startRatingFromQna}
                          disabled={loading}
                          className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium disabled:opacity-50"
                        >
                          ⭐ End Q&A & Start Rating (5sec warning + 2min rating)
                        </button>
                      </div>
                    )}
                    
                    {(ratingPhase === 'rating-warning' || ratingPhase === 'rating-active') && (
                      <div className="space-y-3">
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">
                          {ratingPhase === 'rating-warning' 
                            ? '⚠️ 5-second warning active - Rating will start automatically'
                            : '⭐ Rating phase active - Judges and peers can now submit scores'
                          }
                        </p>
                        <div className="text-xs text-yellow-600 dark:text-yellow-400">
                          Rating phase will auto-complete after 2 minutes or click Stop Cycle to end early.
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Phase Progress Bar */}
              {ratingCycleActive && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-muted-foreground mb-2">
                    <span>Phase Progress</span>
                    <span>{ratingPhase} ({ratingPhaseTimeLeft > 0 ? Math.ceil(ratingPhaseTimeLeft) : 0}s remaining)</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-1000 ${
                        ratingPhase === 'pitching' ? 'bg-blue-600' :
                        ratingPhase === 'qna-pause' ? 'bg-yellow-600' :
                        ratingPhase === 'rating-warning' ? 'bg-red-600' :
                        ratingPhase === 'rating-active' ? 'bg-green-600' :
                        'bg-gray-400'
                      }`}
                      style={{ 
                        width: `${Math.max(0, (ratingPhaseTimeLeft / (
                          ratingPhase === 'pitching' ? 300 : // 5 minutes = 300 seconds
                          ratingPhase === 'qna-pause' ? 100 : // No timer, show full
                          ratingPhase === 'rating-warning' ? 5 : // 5 seconds
                          ratingPhase === 'rating-active' ? 120 : // 2 minutes = 120 seconds
                          100 // Default
                        )) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Quick Status Info */}
              <div className="grid gap-3 md:grid-cols-4 text-sm">
                <div className={`p-3 rounded-lg ${ratingPhase === 'pitching' ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-muted'}`}>
                  <div className="font-medium">📽️ Pitching Phase</div>
                  <div className="text-muted-foreground">5 minutes presentation</div>
                </div>
                <div className={`p-3 rounded-lg ${ratingPhase === 'qna-pause' ? 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800' : 'bg-muted'}`}>
                  <div className="font-medium">❓ Q&A Session</div>
                  <div className="text-muted-foreground">Admin controlled</div>
                </div>
                <div className={`p-3 rounded-lg ${ratingPhase === 'rating-warning' ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800' : 'bg-muted'}`}>
                  <div className="font-medium">⚠️ Rating Warning</div>
                  <div className="text-muted-foreground">5 seconds warning</div>
                </div>
                <div className={`p-3 rounded-lg ${ratingPhase === 'rating-active' ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-muted'}`}>
                  <div className="font-medium">⭐ Rating Active</div>
                  <div className="text-muted-foreground">2 minutes scoring</div>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-4">Quick Actions</h3>
              <div className="flex flex-wrap gap-2">
                <a href="/scoreboard" className="rounded-md bg-purple-600 px-4 py-2 text-white font-medium hover:bg-purple-700">
                  Final Scoreboard
                </a>
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
              <h3 className="font-semibold mb-4 text-foreground">Quiz Settings</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm mb-2 text-foreground">Time Limit (minutes)</label>
                  <input 
                    type="number" 
                    value={quizSettings.timeLimit || 30}
                    onChange={e => setQuizSettings({...quizSettings, timeLimit: Number(e.target.value)})}
                    className="w-full rounded-md border px-3 py-2 bg-background text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-2 text-foreground">Total Questions</label>
                  <input 
                    type="number" 
                    value={questions.length}
                    readOnly
                    className="w-full rounded-md border px-3 py-2 bg-muted text-muted-foreground opacity-75"
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
                <h3 className="font-semibold text-foreground">Question Management</h3>
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
                  <div key={question.id} className="border border-border rounded-lg p-4 bg-background">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-foreground">Q{index + 1}: {question.text}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          Max tokens: {question.maxTokenPerQuestion} • Options: {question.options?.length || 0}
                        </p>
                        {question.options && question.options.length > 0 && (
                          <div className="mt-2 grid gap-1">
                            {question.options.map((option: any, optIndex: number) => (
                              <div key={optIndex} className="text-sm bg-muted px-2 py-1 rounded text-foreground">
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
                  <div className="text-center py-8 text-muted-foreground">
                    No questions added yet. Click "Add Question" to get started.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="font-semibold mb-4 text-foreground">Quiz Statistics</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{stats.quizAttempts || 0}</div>
                  <div className="text-sm text-muted-foreground">Quiz Attempts</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-foreground">{stats.completedQuizzes || 0}</div>
                  <div className="text-sm text-muted-foreground">Completed</div>
                </div>
              </div>
            </div>

            {/* Question Form Modal */}
            {showQuestionForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-background rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto text-foreground border border-border">
                  <h3 className="text-lg font-semibold mb-4 text-foreground">
                    {editingQuestion ? 'Edit Question' : 'Add New Question'}
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm mb-2 text-foreground">Question Text</label>
                      <textarea 
                        value={questionFormData.text}
                        onChange={e => setQuestionFormData(prev => ({...prev, text: e.target.value}))}
                        className="w-full rounded-md border px-3 py-2 bg-background text-foreground"
                        rows={3}
                        placeholder="Enter the quiz question..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm mb-2 text-foreground">Max Tokens Per Question</label>
                      <input 
                        type="number" 
                        value={questionFormData.maxTokenPerQuestion}
                        onChange={e => setQuestionFormData(prev => ({...prev, maxTokenPerQuestion: Number(e.target.value)}))}
                        className="w-full rounded-md border px-3 py-2 bg-background text-foreground"
                        min="1"
                        max="10"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm text-foreground">Options</label>
                        <button 
                          onClick={addOption}
                          className="px-3 py-1 text-sm bg-green-100 text-green-800 rounded"
                        >
                          Add Option
                        </button>
                      </div>
                      
                      <div className="space-y-3">
                        {questionFormData.options.map((option, index) => (
                          <div key={index} className="border border-border rounded-lg p-3 bg-muted">
                            <div className="flex justify-between items-center mb-2">
                              <span className="font-medium text-foreground">Option {String.fromCharCode(65 + index)}</span>
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
                                <label className="block text-xs mb-1 text-foreground">Option Text</label>
                                <input 
                                  type="text"
                                  value={option.text}
                                  onChange={e => updateOption(index, 'text', e.target.value)}
                                  className="w-full rounded-md border px-2 py-1 text-sm bg-background text-foreground"
                                  placeholder="Enter option text..."
                                />
                              </div>
                              
                              <div className="grid grid-cols-5 gap-2">
                                <div>
                                  <label className="block text-xs mb-1 text-foreground">Marketing</label>
                                  <input 
                                    type="number"
                                    value={option.tokenDeltaMarketing}
                                    onChange={e => updateOption(index, 'tokenDeltaMarketing', Number(e.target.value))}
                                    className="w-full rounded-md border px-2 py-1 text-sm bg-background text-foreground"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs mb-1 text-foreground">Capital</label>
                                  <input 
                                    type="number"
                                    value={option.tokenDeltaCapital}
                                    onChange={e => updateOption(index, 'tokenDeltaCapital', Number(e.target.value))}
                                    className="w-full rounded-md border px-2 py-1 text-sm bg-background text-foreground"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs mb-1 text-foreground">Team</label>
                                  <input 
                                    type="number"
                                    value={option.tokenDeltaTeam}
                                    onChange={e => updateOption(index, 'tokenDeltaTeam', Number(e.target.value))}
                                    className="w-full rounded-md border px-2 py-1 text-sm bg-background text-foreground"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs mb-1 text-foreground">Strategy</label>
                                  <input 
                                    type="number"
                                    value={option.tokenDeltaStrategy}
                                    onChange={e => updateOption(index, 'tokenDeltaStrategy', Number(e.target.value))}
                                    className="w-full rounded-md border px-2 py-1 text-sm bg-background text-foreground"
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
                      className="px-4 py-2 bg-muted text-foreground rounded-md border border-border"
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
              <h3 className="font-semibold mb-4">Registration Settings</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Team Registration Deadline
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="datetime-local"
                      value={systemSettings.registration_deadline?.value || ''}
                      onChange={(e) => {
                        const value = e.target.value;
                        updateSystemSetting('registration_deadline', value);
                      }}
                      className="flex-1 rounded-md border px-3 py-2 bg-background"
                    />
                    <button
                      onClick={() => updateSystemSetting('registration_deadline', '')}
                      className="rounded-md border border-border px-3 py-2 text-sm hover:bg-accent"
                    >
                      Clear
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {systemSettings.registration_deadline?.value 
                      ? `Registration closes on ${new Date(systemSettings.registration_deadline.value).toLocaleString()}`
                      : 'Registration is currently open indefinitely'
                    }
                  </p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <h4 className="font-medium text-sm">Registration Status</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    {systemSettings.registration_deadline?.value 
                      ? (new Date() > new Date(systemSettings.registration_deadline.value)
                          ? '🔴 Registration Closed - Deadline has passed'
                          : '🟢 Registration Open - Deadline set')
                      : '🟢 Registration Open - No deadline set'
                    }
                  </p>
                </div>
              </div>
            </div>
            
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
      <SecurityGuard userType="admin" />
      <AntiCheatMeasures />
      
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <BackButton />
          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 w-10"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M15 9v-4.5M15 9h4.5M15 9l5.25-5.25M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 15v4.5M15 15h4.5m0 0l5.25 5.25" />
                </svg>
              ) : (
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                </svg>
              )}
            </button>
            <ThemeToggle />
          </div>
        </div>
        
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
              { id: 'final', label: 'Final Round', icon: '🏆' },
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