"use client"

import { useState, useEffect } from "react";
import Link from 'next/link';
import { ThemeToggle } from "@/components/ThemeToggle";
import { BackButton } from "@/components/BackButton";
import { SecurityGuard, AntiCheatMeasures } from "@/components/SecurityGuard";

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

  // Check for judge authentication cookie and auto-fetch judge data
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isJudge = document.cookie.includes("judge-auth=true");
      setIsJudgeAuthenticated(isJudge);
      
      if (!isJudge) {
        window.location.href = "/judge/login";
        return;
      }

      // Auto-fetch judge user data from cookie
      const judgeUserCookie = document.cookie
        .split('; ')
        .find(row => row.startsWith('judge-user='));
      
      if (judgeUserCookie) {
        try {
          const judgeUserData = JSON.parse(decodeURIComponent(judgeUserCookie.split('=')[1]));
          setJudgeName(judgeUserData.name || judgeUserData.username || 'Judge');
        } catch (error) {
          console.error('Error parsing judge user data:', error);
          setJudgeName('Judge');
        }
      }

      // Security: Block navigation to unauthorized pages
      const blockNavigation = (e: BeforeUnloadEvent) => {
        const allowedDomains = ['/scoreboard', '/judge'];
        const currentPath = window.location.pathname;
        if (!allowedDomains.some(domain => currentPath.startsWith(domain))) {
          e.preventDefault();
          window.location.href = '/scoreboard';
        }
      };

      // Block back/forward navigation to unauthorized pages
      const handlePopState = () => {
        const currentPath = window.location.pathname;
        const allowedPaths = ['/scoreboard', '/judge'];
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
      loadData();
    }
  }, [isJudgeAuthenticated]);

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

  const handleLogout = async () => {
    try {
      await fetch("/api/judge/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
    
    // Clear judge authentication cookie manually as backup
    document.cookie = "judge-auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "judge-token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    document.cookie = "judge-user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    
    window.location.href = "/judge/login";
  };

  if (loading || !isJudgeAuthenticated) return <div className="p-6">Loading...</div>;
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
      <SecurityGuard userType="judge" />
      <AntiCheatMeasures />
      
      <div className="max-w-6xl mx-auto">
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
        
        <h1 className="text-3xl font-bold mb-2">Judge Console</h1>
        <p className="text-muted-foreground mb-6">
          Submit scores for team presentations during the final round.
        </p>

        {/* Real-Time Rating Section */}
        <div className="rounded-lg border bg-card p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">🎯 Real-Time Final Round Rating</h2>
          
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
              <label className="block text-sm font-medium mb-2">Judge Name</label>
              <div className="w-full rounded-md border border-input bg-muted px-3 py-2 text-muted-foreground">
                {judgeName || 'Loading...'}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Auto-detected from login
              </p>
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
          <a 
            href="/scoreboard" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md text-sm font-medium"
          >
            View Scoreboard
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