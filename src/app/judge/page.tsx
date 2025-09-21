"use client"

import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BackButton } from "@/components/BackButton";

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

interface RatingCycleEvent {
  type: 'pitch-started' | 'phase-changed' | 'pitch-ended';
  data: {
    team?: Team;
    phase?: 'idle' | 'pitching' | 'judges-rating' | 'peers-rating';
    timeLeft?: number;
  };
}

export default function JudgePage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [scores, setScores] = useState<JudgeScore[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isJudgeAuthenticated, setIsJudgeAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Form state for real-time rating
  const [realTimeRating, setRealTimeRating] = useState<string>('80');
  const [judgeName, setJudgeName] = useState<string>('');
  const [ratingTimeout, setRatingTimeout] = useState<NodeJS.Timeout | null>(null);

  // Real-time rating cycle state
  const [currentPitchTeam, setCurrentPitchTeam] = useState<Team | null>(null);
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'pitching' | 'judges-rating' | 'peers-rating'>('idle');
  const [phaseTimeLeft, setPhaseTimeLeft] = useState<number>(0);
  const [ratingCycleActive, setRatingCycleActive] = useState(false);
  
  // Fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Check for judge authentication - final working version
  useEffect(() => {
    const checkAuth = () => {
      if (typeof window === "undefined") return;
      
      const cookies = document.cookie;
      
      if (!cookies || cookies.length === 0) {
        setIsJudgeAuthenticated(false);
        setAuthChecked(true);
        return;
      }
      
      // Split and clean cookies
      const cookieArray = cookies.split(';').map(cookie => cookie.trim());
      
      // Check for authentication cookies
      const judgeUserCookie = cookieArray.find(cookie => cookie.startsWith('judge-user='));
      const adminTokenCookie = cookieArray.find(cookie => cookie.startsWith('auth-token='));
      
      // Since judge-token is HTTP-only, we use judge-user as authentication indicator
      const isAuthenticated = !!(judgeUserCookie || adminTokenCookie);
      
      setIsJudgeAuthenticated(isAuthenticated);
      setAuthChecked(true);
    };

    // Check auth after a small delay to ensure cookies are available
    const timeoutId = setTimeout(checkAuth, 200);
    
    return () => clearTimeout(timeoutId);
  }, []);

  // SSE Connection for real-time rating cycle updates
  useEffect(() => {
    if (!isJudgeAuthenticated) return;

    let eventSource: EventSource | null = null;
    
    const connectSSE = () => {
      try {
        eventSource = new EventSource('/api/sse/rating');
        
        eventSource.onmessage = (event) => {
          try {
            const data: RatingCycleEvent = JSON.parse(event.data);
            
            if (data.type === 'pitch-started' && data.data.team) {
              setCurrentPitchTeam(data.data.team);
              setRatingCycleActive(true);
            } else if (data.type === 'phase-changed') {
              setCurrentPhase(data.data.phase || 'idle');
              setPhaseTimeLeft(data.data.timeLeft || 0);
            } else if (data.type === 'pitch-ended') {
              setCurrentPitchTeam(null);
              setCurrentPhase('idle');
              setRatingCycleActive(false);
              setPhaseTimeLeft(0);
            }
          } catch (error) {
            console.error('Error parsing SSE data:', error);
          }
        };

        eventSource.onerror = (error) => {
          console.log('SSE connection error, reconnecting...', error);
          eventSource?.close();
          setTimeout(connectSSE, 3000);
        };

      } catch (error) {
        console.error('Failed to connect to SSE:', error);
        setTimeout(connectSSE, 5000);
      }
    };

    connectSSE();

    // Cleanup on unmount
    return () => {
      eventSource?.close();
    };
  }, [isJudgeAuthenticated]);

  // Load current rating cycle state with polling (reduced frequency)
  useEffect(() => {
    if (isJudgeAuthenticated) {
      loadCurrentRatingState();
      
      // Poll every 3 seconds for updates (reduced from 1 second to prevent glitching)
      const interval = setInterval(loadCurrentRatingState, 3000);
      
      return () => clearInterval(interval);
    }
  }, [isJudgeAuthenticated]);

  const loadCurrentRatingState = async () => {
    try {
      const res = await fetch('/api/rating/current');
      if (res.ok) {
        const data = await res.json();
        
        // Only update state if values have actually changed to prevent unnecessary re-renders
        if (JSON.stringify(data?.team) !== JSON.stringify(currentPitchTeam)) {
          setCurrentPitchTeam(data?.team ?? null);
        }
        if (data?.currentPhase !== currentPhase) {
          setCurrentPhase(data?.currentPhase ?? 'idle');
        }
        if (data?.phaseTimeLeft !== phaseTimeLeft) {
          setPhaseTimeLeft(data?.phaseTimeLeft ?? 0);
        }
        if (data?.ratingCycleActive !== ratingCycleActive) {
          setRatingCycleActive(data?.ratingCycleActive ?? false);
        }
      }
    } catch (error) {
      console.error('Error loading rating state:', error);
    }
  };

  useEffect(() => {
    if (isJudgeAuthenticated) {
      // Fetch judge information from database
      fetchJudgeProfile();
      loadData();
    }
  }, [isJudgeAuthenticated]);

  // Fetch judge profile from database
  const fetchJudgeProfile = async () => {
    try {
      const res = await fetch('/api/judge/profile');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.judge) {
          const judgeName = data.judge.name || data.judge.username || 'Judge';
          setJudgeName(judgeName);
          console.log('Successfully loaded judge profile:', data.judge.name, '(', data.judge.username, ')');
        } else {
          console.warn('Failed to get judge profile:', data.error);
          setJudgeName('Judge');
        }
      } else {
        console.warn('Failed to fetch judge profile:', res.status, res.statusText);
        // Fallback to cookie method if API fails
        fallbackToJudgeCookie();
      }
    } catch (error) {
      console.error('Error fetching judge profile:', error);
      // Fallback to cookie method if API fails
      fallbackToJudgeCookie();
    }
  };

  // Fallback method using judge cookie
  const fallbackToJudgeCookie = () => {
    if (typeof window !== "undefined") {
      try {
        const judgeUserCookie = document.cookie
          .split('; ')
          .find(row => row.startsWith('judge-user='));
        
        if (judgeUserCookie) {
          const judgeUserData = JSON.parse(decodeURIComponent(judgeUserCookie.split('=')[1]));
          setJudgeName(judgeUserData.name || judgeUserData.username || 'Judge');
          console.log('Fallback: Using judge name from cookie:', judgeUserData.name);
        } else {
          setJudgeName('Judge');
          console.warn('No judge cookie found, using default name');
        }
      } catch (error) {
        console.error('Error parsing judge user data from cookie:', error);
        setJudgeName('Judge');
      }
    }
  };

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
      setMsg('Failed to toggle fullscreen mode');
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

  // Real-time judge rating with auto-submit
  const submitRealTimeRating = async (rating: number) => {
    if (!currentPitchTeam || !judgeName.trim() || rating < 0 || rating > 100) {
      return;
    }

    try {
      const res = await fetch("/api/judges/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          judgeName: judgeName.trim(), 
          teamId: currentPitchTeam.id, 
          score: rating
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        setMsg(`✅ Rating submitted: ${rating}/100 for ${currentPitchTeam.name}`);
        // Clear message after 2 seconds
        setTimeout(() => setMsg(null), 2000);
      } else {
        setMsg(data?.error || "Failed to submit rating");
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      setMsg("Failed to submit rating");
    }
  };

  // Handle real-time rating input change
  const handleRatingChange = (value: string) => {
    setRealTimeRating(value);
    
    // Auto-submit if it's a valid number between 0-100
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100 && canRateRealTime) {
      // Debounce the submission to avoid too many requests
      if (ratingTimeout) {
        clearTimeout(ratingTimeout);
      }
      const newTimeout = setTimeout(() => {
        submitRealTimeRating(numValue);
      }, 500);
      setRatingTimeout(newTimeout);
    }
  };

  // Check if judge can rate in real-time
  const canRateRealTime = isJudgeAuthenticated && 
                         ratingCycleActive && 
                         currentPhase === 'judges-rating' && 
                         phaseTimeLeft > 0 && 
                         currentPitchTeam && 
                         judgeName.trim().length > 0;

  const handleLogout = () => {
    // Clear judge authentication cookies
    document.cookie = "judge-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "judge-user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    window.location.href = "/judge/login";
  };

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

  // SSR/CSR flash protection: show loading spinner until authentication is checked
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="p-8 rounded-xl bg-card shadow-lg text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Loading Judge Console
          </h2>
          <p className="text-muted-foreground">Checking authentication status...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isJudgeAuthenticated) {
    // Redirect to judge login page
    if (typeof window !== "undefined") {
      window.location.href = "/judge/login";
    }
    return <div className="p-6">Redirecting to login...</div>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground mobile-padding pb-20 sm:pb-6 safe-area-padding">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="mobile-title mb-0">Judge Console</h1>
          </div>
          <ThemeToggle />
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
          <p className="mobile-body text-muted-foreground">
            Submit scores for team presentations during the final round.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-full">
            <span className="mobile-body font-medium text-blue-800 dark:text-blue-200">
              👨‍⚖️ {judgeName}
            </span>
          </div>
        </div>

        {/* Real-Time Rating Section */}
        <div className="mobile-card mb-6">
          <h2 className="mobile-subtitle mb-4">🎯 Real-Time Final Round Rating</h2>
          
          {/* Current pitch team status */}
          {currentPitchTeam ? (
            <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-medium text-green-800 dark:text-green-200">
                    📽️ Currently Presenting: {currentPitchTeam.name} (#{currentPitchTeam.id})
                  </p>
                  <p className="text-sm text-green-600 dark:text-green-300">{currentPitchTeam.college}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-green-700 dark:text-green-300">
                    Phase: {currentPhase}
                  </p>
                  {phaseTimeLeft > 0 && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      Time left: {Math.ceil(phaseTimeLeft)}s
                    </p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-4 p-4 bg-muted rounded-lg border">
              <p className="text-muted-foreground">
                🕐 No team is currently presenting. Waiting for pitch to start...
              </p>
            </div>
          )}

          {/* Rating form for current pitch */}
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-2">Logged in as Judge</label>
              <div className="w-full rounded-md border border-input bg-muted px-3 py-2 text-sm">
                <span className="font-medium">{judgeName}</span>
                {judgeName === 'Judge' && (
                  <span className="text-muted-foreground ml-2">(Loading...)</span>
                )}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">
                Real-Time Rating (0-100)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={realTimeRating}
                  onChange={(e) => handleRatingChange(e.target.value)}
                  placeholder="80"
                  className="w-full rounded-md border border-input bg-background px-3 py-2 pr-12"
                  disabled={!canRateRealTime}
                />
                <span className="absolute right-3 top-2 text-sm text-muted-foreground">/100</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {canRateRealTime ? 'Auto-saves as you type' : 'Wait for judges rating phase'}
              </p>
            </div>
          </div>

          {/* Real-time rating restrictions */}
          {!canRateRealTime && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                {!ratingCycleActive && '⏳ Waiting for rating cycle to start...'}
                {ratingCycleActive && currentPhase !== 'judges-rating' && '⏱️ Wait for judges rating phase...'}
                {ratingCycleActive && currentPhase === 'judges-rating' && phaseTimeLeft <= 0 && '⏰ Judges rating time has ended.'}
                {!currentPitchTeam && '👥 No team is currently presenting.'}
                {!judgeName.trim() && currentPitchTeam && '📝 Please enter your judge name.'}
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