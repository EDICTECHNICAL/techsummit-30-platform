"use client"

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { Timer, Users, Trophy, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PageLock from "@/components/ui/PageLock";
import { Card, CardHeader, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRoundStatus } from "@/hooks/useRoundStatus";
import { useRatingSSE } from "@/hooks/useRatingSSE";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BackButton } from "@/components/BackButton";

interface Team {
  id: number;
  name: string;
  college: string;
}

interface PeerRating {
  id: number;
  fromTeamId: number;
  toTeamId: number;
  rating: number;
  createdAt: string;
}

interface JudgeScore {
  id: number;
  judgeName: string;
  teamId: number;
  score: number;
  createdAt: string;
}

interface CurrentRatingData {
  team: Team | null;
  ratingActive: boolean;
  allPitchesCompleted: boolean;
  // Rating cycle properties
  ratingCycleActive?: boolean;
  currentPhase?: 'idle' | 'pitching' | 'qna-pause' | 'rating-warning' | 'rating-active';
  phaseTimeLeft?: number;
  cycleStartTime?: number | null;
}

interface RatingResponse {
  success?: boolean;
  error?: string;
  message?: string;
  rating?: any;
}

export default function FinalPage() {
  const isMobile = useIsMobile();
  // Page lock functionality
  const { isCompleted: isFinalCompleted, loading: roundLoading } = useRoundStatus('FINAL');
  
  // Real-time updates via SSE
  const { isConnected: sseConnected, lastEvent } = useRatingSSE();
  
  const { data: session, isPending } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [myRatings, setMyRatings] = useState<PeerRating[]>([]);
  const [qualifiedTeams, setQualifiedTeams] = useState<any[]>([]);
  const [nonQualifiedTeams, setNonQualifiedTeams] = useState<any[]>([]);
  const [qualificationNote, setQualificationNote] = useState<any>(null);
  const [isQualified, setIsQualified] = useState<boolean>(false);
  const [finalScoreboard, setFinalScoreboard] = useState<any[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<'success' | 'error' | 'info'>('info');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'rate' | 'status'>('status');

  // Round completion tracking
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [votingCompleted, setVotingCompleted] = useState<boolean>(false);
  const [roundsLoading, setRoundsLoading] = useState<boolean>(true);

  // Rating form state (updated for Round 3)
  const [toTeamId, setToTeamId] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(5); // Changed default to 5 for peer ratings (3-10)
  
  // Popup state for qualification status
  const [showQualificationPopup, setShowQualificationPopup] = useState<boolean>(false);

  // Rating cycle state
  const [currentPitchTeam, setCurrentPitchTeam] = useState<Team | null>(null);
  const [ratingActive, setRatingActive] = useState(false);
  const [allPitchesCompleted, setAllPitchesCompleted] = useState(false);
  const [ratingCycleActive, setRatingCycleActive] = useState<boolean>(false);
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'pitching' | 'qna-pause' | 'rating-warning' | 'rating-active'>('idle');
  const [phaseTimeLeft, setPhaseTimeLeft] = useState<number>(0);
  const [cycleStartTime, setCycleStartTime] = useState<number | null>(null);

  // Check for judge authentication
  const [isJudgeAuthenticated, setIsJudgeAuthenticated] = useState(false);

  const userTeamId = session?.user?.team?.id;
  const isAdmin = session?.user?.isAdmin;

  // Show message with auto-dismiss
  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMsg(text);
    setMsgType(type);
    setTimeout(() => setMsg(null), 5000);
  }, []);

  // Handle real-time SSE updates
  useEffect(() => {
    if (!lastEvent) return;

    console.log('Processing Rating SSE event:', lastEvent);

    switch (lastEvent.type) {
      case 'teamChanged':
        if (lastEvent.data) {
          setCurrentPitchTeam(lastEvent.data.team);
          setRatingActive(lastEvent.data.ratingActive);
          setAllPitchesCompleted(lastEvent.data.allPitchesCompleted);
          setRatingCycleActive(lastEvent.data.ratingCycleActive);
          setCurrentPhase(lastEvent.data.currentPhase);
          setPhaseTimeLeft(lastEvent.data.phaseTimeLeft);
          setCycleStartTime(lastEvent.data.cycleStartTime);
          showMessage(`New team is pitching: ${lastEvent.data.team?.name || 'None'}`, 'info');
        }
        break;
      
      case 'ratingStateChanged':
        if (lastEvent.data) {
          setRatingActive(lastEvent.data.ratingActive);
          setAllPitchesCompleted(lastEvent.data.allPitchesCompleted);
          setRatingCycleActive(lastEvent.data.ratingCycleActive);
          setCurrentPhase(lastEvent.data.currentPhase);
          setPhaseTimeLeft(lastEvent.data.phaseTimeLeft);
          setCycleStartTime(lastEvent.data.cycleStartTime);
          
          // Handle rating state changes
          if (lastEvent.data.ratingActive && !ratingActive) {
            showMessage('Rating is now active!', 'success');
          } else if (!lastEvent.data.ratingActive && ratingActive) {
            showMessage('Rating has ended', 'info');
          }
        }
        break;
        
      case 'connected':
        showMessage('Connected to real-time updates', 'success');
        break;
    }
  }, [lastEvent, ratingActive, showMessage]);

  // Poll current rating status
  useEffect(() => {
    const pollRatingStatus = async () => {
      try {
        const res = await fetch("/api/rating/current");
        if (!res.ok) {
          console.warn(`Failed to fetch rating status: ${res.status} ${res.statusText}`);
          return;
        }
        
        const data: CurrentRatingData = await res.json();
        setCurrentPitchTeam(data?.team ?? null);
        
        // Handle rating cycle state
        const newRatingCycleActive = data?.ratingCycleActive ?? false;
        const newCurrentPhase = data?.currentPhase ?? 'idle';
        const newPhaseTimeLeft = data?.phaseTimeLeft ?? 0;
        const newCycleStartTime = data?.cycleStartTime ?? null;
        
        setRatingCycleActive(newRatingCycleActive);
        setCurrentPhase(newCurrentPhase);
        setPhaseTimeLeft(newPhaseTimeLeft);
        setCycleStartTime(newCycleStartTime);
        
        setRatingActive(data?.ratingActive ?? false);
        setAllPitchesCompleted(data?.allPitchesCompleted ?? false);
      } catch (error) {
        console.warn("Error polling rating status:", error);
      }
    };

    const interval = setInterval(pollRatingStatus, 2000);
    pollRatingStatus();
    
    return () => clearInterval(interval);
  }, []);

  // Real-time timer update for rating cycle
  useEffect(() => {
    if (!ratingCycleActive || !cycleStartTime) {
      return;
    }

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - cycleStartTime) / 1000);
      let newPhase: 'idle' | 'pitching' | 'qna-pause' | 'rating-warning' | 'rating-active' = 'idle';
      let timeLeft = 0;
      
      if (elapsed < 300) {
        // Phase 1: 5 minutes pitching
        newPhase = 'pitching';
        timeLeft = 300 - elapsed;
      } else if (currentPhase === 'qna-pause') {
        // Phase 2: Q&A pause (controlled by admin, no timer)
        newPhase = 'qna-pause';
        timeLeft = 0; // No time limit, admin controlled
      } else if (elapsed >= 300 && elapsed < 305) {
        // Phase 3: 5 seconds warning before rating
        newPhase = 'rating-warning';
        timeLeft = 305 - elapsed;
      } else if (elapsed >= 305 && elapsed < 425) {
        // Phase 4: 2 minutes rating (judges + peers together)
        newPhase = 'rating-active';
        timeLeft = 425 - elapsed;
      }
      
      setCurrentPhase(newPhase);
      setPhaseTimeLeft(Math.max(0, timeLeft));
      
      if (elapsed >= 425) {
        // Cycle should end
        setRatingCycleActive(false);
        setCurrentPhase('idle');
        setPhaseTimeLeft(0);
        setRatingActive(false);
        setCycleStartTime(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [ratingCycleActive, cycleStartTime, currentPhase]);

  useEffect(() => {
    loadData();
    checkRoundCompletion();
  }, [session]);

  // Poll current rating status for real-time updates
  useEffect(() => {
    const pollRatingStatus = async () => {
      try {
        const res = await fetch("/api/rating/current");
        if (!res.ok) {
          console.warn(`Failed to fetch rating status: ${res.status} ${res.statusText}`);
          return;
        }
        
        const data = await res.json();
        setCurrentPitchTeam(data?.team ?? null);
        
        // Handle rating cycle state
        const newRatingCycleActive = data?.ratingCycleActive ?? false;
        const newCurrentPhase = data?.currentPhase ?? 'idle';
        const newPhaseTimeLeft = data?.phaseTimeLeft ?? 0;
        const newCycleStartTime = data?.cycleStartTime ?? null;
        
        setRatingCycleActive(newRatingCycleActive);
        setCurrentPhase(newCurrentPhase);
        setPhaseTimeLeft(newPhaseTimeLeft);
        setCycleStartTime(newCycleStartTime);
        
        // Handle rating activation timing
        const newRatingActive = data?.ratingActive ?? false;
        setRatingActive(newRatingActive);
        
      } catch (error) {
        console.error("Error polling rating status:", error);
      }
    };

    pollRatingStatus(); // Initial fetch
    const interval = setInterval(pollRatingStatus, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, []);

  // Poll scoreboard for updated final scores
  useEffect(() => {
    const pollScoreboard = async () => {
      try {
        const scoreboardRes = await fetch('/api/scoreboard');
        if (scoreboardRes.ok) {
          const scoreboardData = await scoreboardRes.json();
          setFinalScoreboard(scoreboardData.leaderboard || []);
        }
      } catch (error) {
        console.error("Error polling scoreboard:", error);
      }
    };

    // Poll less frequently to avoid overwhelming the server
    const interval = setInterval(pollScoreboard, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, []);

  // Show qualification popup when qualification status is determined
  useEffect(() => {
    if (userTeamId && qualifiedTeams.length > 0 && !loading) {
      setShowQualificationPopup(true);
    }
  }, [userTeamId, qualifiedTeams.length, loading]);

  const checkRoundCompletion = async () => {
    try {
      setRoundsLoading(true);
      
      // Check if all teams have completed quiz and voting
      const [teamsRes, quizRes, votingRes] = await Promise.all([
        fetch('/api/teams'),
        fetch('/api/quiz/submissions'),
        fetch('/api/votes')
      ]);

      if (teamsRes.ok && quizRes.ok && votingRes.ok) {
        const teams = await teamsRes.json();
        const quizSubmissions = await quizRes.json();
        const votes = await votingRes.json();

        // Get all team IDs
        const allTeamIds = teams.map((team: any) => team.id);
        
        // Check quiz completion - all teams should have submissions
        const teamsWithQuizSubmissions = new Set(
          quizSubmissions.submissions?.map((sub: any) => sub.teamId) || []
        );
        const allTeamsCompletedQuiz = allTeamIds.every((teamId: number) => 
          teamsWithQuizSubmissions.has(teamId)
        );

        // Check voting completion - all teams should have voted
        const teamsWithVotes = new Set(
          votes.votes?.map((vote: any) => vote.fromTeamId) || []
        );
        const allTeamsCompletedVoting = allTeamIds.every((teamId: number) => 
          teamsWithVotes.has(teamId)
        );

        setQuizCompleted(allTeamsCompletedQuiz);
        setVotingCompleted(allTeamsCompletedVoting);
      } else {
        // Fallback to round status if submissions can't be checked
        const roundsRes = await fetch('/api/rounds');
        if (roundsRes.ok) {
          const rounds = await roundsRes.json();
          const quiz = rounds.find((r: any) => r.name === 'QUIZ');
          const voting = rounds.find((r: any) => r.name === 'VOTING');
          
          setQuizCompleted(quiz?.status === 'COMPLETED' || quiz?.isCompleted || false);
          setVotingCompleted(voting?.status === 'COMPLETED' || voting?.isCompleted || false);
        }
      }
    } catch (error) {
      console.error('Error checking round completion:', error);
      // Default to locked state on error
      setQuizCompleted(false);
      setVotingCompleted(false);
    } finally {
      setRoundsLoading(false);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load qualified teams first
      const qualifiedRes = await fetch('/api/final/qualified-teams');
      if (qualifiedRes.ok) {
        const qualifiedData = await qualifiedRes.json();
        setQualifiedTeams(qualifiedData.qualifiedTeams || []);
        setNonQualifiedTeams(qualifiedData.nonQualifiedTeams || []);
        setQualificationNote(qualifiedData.qualificationNote || null);
        
        // Check if current user's team is qualified
        const userQualified = qualifiedData.qualifiedTeams.some((team: any) => team.teamId === userTeamId);
        setIsQualified(userQualified);
      }
      
      // Load final scoreboard with judge scores and peer ratings
      const scoreboardRes = await fetch('/api/scoreboard');
      if (scoreboardRes.ok) {
        const scoreboardData = await scoreboardRes.json();
        setFinalScoreboard(scoreboardData.leaderboard || []);
      }
      
      // Load teams
      const teamsRes = await fetch('/api/teams');
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData);
      }

      // Load my ratings if user has a team and is qualified
      if (userTeamId && isQualified) {
        const ratingsRes = await fetch(`/api/final/ratings?fromTeamId=${userTeamId}`);
        if (ratingsRes.ok) {
          const ratingsData = await ratingsRes.json();
          setMyRatings(ratingsData.ratings || []);
        }
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setMsg('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get final scores for qualified teams
  const getQualifiedTeamsWithFinalScores = () => {
    return qualifiedTeams.map(qualifiedTeam => {
      // Find the corresponding team in the scoreboard data
      const scoreboardTeam = finalScoreboard.find(team => team.teamId === qualifiedTeam.teamId);
      
      return {
        ...qualifiedTeam,
        finalScore: scoreboardTeam?.finalCumulativeScore || qualifiedTeam.combinedScore || 0,
        judgeScores: scoreboardTeam?.judgeScores || { total: 0, average: 0, count: 0 },
        peerRating: scoreboardTeam?.peerRating || { average: 0, count: 0 }
      };
    });
  };

  const submitRating = async () => {
    if (!userTeamId || !currentPitchTeam || rating < 3 || rating > 10) {
      showMessage("Please provide a rating between 3-10 for the current presenting team", 'error');
      return;
    }

    if (userTeamId === currentPitchTeam.id) {
      showMessage("Cannot rate your own team", 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/final/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ 
          fromTeamId: userTeamId, 
          toTeamId: currentPitchTeam.id, 
          rating 
        })
      });

      const data: RatingResponse = await res.json();
      
      if (res.ok && data.success) {
        showMessage(data.message || `Successfully rated ${currentPitchTeam.name} with ${rating}/10`, 'success');
        setRating(5); // Reset to default
        // Reload ratings
        const ratingsRes = await fetch(`/api/final/ratings?fromTeamId=${userTeamId}`);
        if (ratingsRes.ok) {
          const ratingsData = await ratingsRes.json();
          setMyRatings(ratingsData.ratings || []);
        }
      } else {
        showMessage(data?.error || "Failed to submit rating", 'error');
      }
    } catch (error) {
      console.error("Error submitting rating:", error);
      showMessage("Network error while submitting rating", 'error');
    } finally {
      setLoading(false);
    }
  };

  if (isPending || loading || roundsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-md w-full mx-4 rounded-lg border bg-white dark:bg-gray-800 p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Loading...</h2>
          <p className="text-muted-foreground">Checking round status and loading data</p>
        </div>
      </div>
    );
  }
  
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-md w-full mx-4 rounded-lg border bg-white dark:bg-gray-800 p-8 text-center">
          <Trophy className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Authentication Required</h2>
          <p className="mb-4 text-muted-foreground">
            You need to be signed in with a team account or judge account to participate in the finals.
          </p>
          <div className="space-y-3">
            <a 
              href="/sign-in" 
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In to Team
            </a>
            <div className="text-sm text-muted-foreground">
              <span>Are you a judge? </span>
              <a href="/judge/login" className="text-blue-600 hover:underline">
                Judge Login
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if previous rounds are completed (only for non-admin users)
  if (!isAdmin && (!quizCompleted || !votingCompleted)) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header with Back Button */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Round 3: Finals</h1>
              <p className="text-muted-foreground">
                Finals round is currently locked
              </p>
            </div>
            <BackButton />
          </div>

          {/* Lock Message */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🔒</div>
              <div>
                <h2 className="text-lg font-semibold text-yellow-800 mb-2">Finals Round Locked</h2>
                <p className="text-yellow-700 mb-4">
                  The finals round will be unlocked once all teams have completed both the Quiz and Voting rounds.
                </p>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${quizCompleted ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={quizCompleted ? 'text-green-700' : 'text-red-700'}>
                      Quiz Round: {quizCompleted ? 'All teams completed ✓' : 'Waiting for all teams to complete ✗'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${votingCompleted ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className={votingCompleted ? 'text-green-700' : 'text-red-700'}>
                      Voting Round: {votingCompleted ? 'All teams completed ✓' : 'Waiting for all teams to complete ✗'}
                    </span>
                  </div>
                </div>

                <div className="mt-4">
                  <button 
                    onClick={checkRoundCompletion}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Check Again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const availableTeams = teams.filter(team => team.id !== userTeamId);
  const ratedTeamIds = new Set(myRatings.map(r => r.toTeamId));
  const unratedTeams = availableTeams.filter(team => !ratedTeamIds.has(team.id));

  // Rating permissions - both judges and teams can rate during rating-active phase
  const canRateAsPeer = session?.user && 
                        userTeamId && 
                        currentPitchTeam && 
                        userTeamId !== currentPitchTeam.id &&
                        ratingCycleActive && 
                        currentPhase === 'rating-active' && 
                        phaseTimeLeft > 0 &&
                        isQualified; // Only qualified teams can rate

  return (
    <PageLock roundType="FINAL" isCompleted={isFinalCompleted}>
      <div className="max-w-6xl mx-auto mobile-padding pt-6 pb-20 transition-all duration-300 ease-in-out">
        <div className="flex items-center justify-between mb-4">
          <BackButton />
          <ThemeToggle />
        </div>
        
        {/* Round Header */}
        <div className="mb-6 text-center">
          <h1 className={`font-bold mb-2 ${isMobile ? 'text-2xl mobile-title' : 'text-4xl'}`}>Round 3: Finals</h1>
          <p className={`text-muted-foreground ${isMobile ? 'text-base' : 'text-lg'}`}>
            Top 5 qualified teams compete in the final round. {teams.length > 5 ? `${teams.length - 5} teams in spectator mode.` : ''}
          </p>
        </div>
        
        {/* SSE Connection Status */}
        <div className={`mb-4 p-2 rounded-md text-xs font-medium ${
          sseConnected 
            ? 'bg-green-50 text-green-700 border border-green-200' 
            : 'bg-yellow-50 text-yellow-700 border border-yellow-200'
        }`}>
          {sseConnected ? '🟢 Real-time updates connected' : '🟡 Connecting to real-time updates...'}
        </div>

        {/* Rating Cycle Timer Display */}
        {ratingCycleActive && (
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-bold text-purple-900">
                  {currentPhase === 'pitching' && '🎤 Team is Pitching (5 min)'}
                  {currentPhase === 'qna-pause' && '❓ Q&A Session (Admin Controlled)'}
                  {currentPhase === 'rating-warning' && '⚠️ Rating Starts Soon! (5 sec)'}
                  {currentPhase === 'rating-active' && '⭐ Rating Active - Judges & Teams (2 min)'}
                  {currentPhase === 'idle' && '⏸️ Rating Cycle Idle'}
                </h3>
                <div className="text-3xl font-bold text-purple-800">
                  {currentPhase === 'qna-pause' ? '∞' : 
                   `${Math.floor(phaseTimeLeft / 60)}:${(phaseTimeLeft % 60).toString().padStart(2, '0')}`}
                </div>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-4 mb-2">
                <div 
                  className={`h-4 rounded-full transition-all duration-1000 ${
                    currentPhase === 'pitching' ? 'bg-blue-500' :
                    currentPhase === 'qna-pause' ? 'bg-yellow-500' :
                    currentPhase === 'rating-warning' ? 'bg-red-500' :
                    currentPhase === 'rating-active' ? 'bg-green-500' :
                    'bg-gray-400'
                  }`}
                  style={{ 
                    width: `${
                      currentPhase === 'pitching' ? (phaseTimeLeft / 300) * 100 :
                      currentPhase === 'qna-pause' ? 100 :
                      currentPhase === 'rating-warning' ? (phaseTimeLeft / 5) * 100 :
                      currentPhase === 'rating-active' ? (phaseTimeLeft / 120) * 100 :
                      0
                    }%` 
                  }}
                ></div>
              </div>
              <div className="text-sm text-purple-700">
                {currentPhase === 'pitching' && 'Listen to the team presentation (5 minutes total)'}
                {currentPhase === 'qna-pause' && 'Q&A session in progress - Admin will start rating when ready'}
                {currentPhase === 'rating-warning' && '⚠️ Get ready! Rating will begin in 5 seconds!'}
                {currentPhase === 'rating-active' && 'Judges & Teams: Rate the team now! (2 minutes total)'}
                {currentPhase === 'idle' && 'Waiting for admin to start the next rating cycle'}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Team Display */}
        {currentPitchTeam ? (
          <Card className="mb-6">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Currently Presenting</h3>
              <div className="text-lg font-bold text-blue-800">
                {currentPitchTeam.name} (#{currentPitchTeam.id})
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardContent className="p-4">
              <p className="text-muted-foreground">No team is currently presenting.</p>
            </CardContent>
          </Card>
        )}

        {/* Header removed - moved to top */}

        {/* Qualification Status Banner removed - replaced with popup */}

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-muted p-1 rounded-lg w-fit">
          <button 
            onClick={() => setActiveTab('status')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'status' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
            }`}
          >
            Status Overview
          </button>
          {(userTeamId && isQualified) && (
            <button 
              onClick={() => setActiveTab('rate')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'rate' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
              }`}
            >
              Rate Teams
            </button>
          )}
        </div>

        {/* Status Overview Tab */}
        {activeTab === 'status' && (
          <div className="space-y-6">
            {/* Qualified Teams */}
            {qualifiedTeams.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">🏆 Top 5 Qualified Teams</h2>

                  {/* Qualification Tiebreaker Note */}
                  {qualificationNote && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <div className="text-blue-600 text-sm">⚖️</div>
                        <div>
                          <p className="text-sm font-medium text-blue-800 mb-1">Automatic Tiebreaker Applied</p>
                          <p className="text-sm text-blue-700">{qualificationNote.message}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid gap-3">
                    {getQualifiedTeamsWithFinalScores().map((team, index) => (
                      <div key={team.teamId} className="flex items-center justify-between p-3 rounded-lg bg-muted">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-yellow-500 text-white' :
                            index === 1 ? 'bg-gray-400 text-white' :
                            index === 2 ? 'bg-amber-600 text-white' :
                            'bg-blue-500 text-white'
                          }`}>
                            #{team.rank}
                          </div>
                          <div>
                            <p className="font-medium">{team.teamName}</p>
                            <p className="text-sm text-muted-foreground">{team.college}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{(team.finalScore || 0).toFixed(1)} pts</p>
                          <p className="text-xs text-muted-foreground">Final Score</p>
                          {team.judgeScores.count > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {team.judgeScores.count} judge{team.judgeScores.count !== 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Non-Qualified Teams (Spectators) */}
            {nonQualifiedTeams.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">📺 Spectator Teams</h2>
                  <p className="text-sm text-muted-foreground mb-4">
                    These teams didn't qualify for the final round but can watch the presentations.
                  </p>
                  <div className="grid gap-2">
                    {nonQualifiedTeams.map((team) => (
                      <div key={team.teamId} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium bg-gray-300 text-gray-700">
                            #{team.rank}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{team.teamName}</p>
                            <p className="text-xs text-muted-foreground">{team.college}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{team.combinedScore} pts</p>
                          <p className="text-xs text-muted-foreground">Qualification Score</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* My Team Status */}
            {userTeamId && isQualified && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Your Team Status</h2>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Peer Ratings Submitted:</p>
                    <p className="text-sm text-blue-600">
                      {myRatings.length} rating{myRatings.length !== 1 ? 's' : ''} submitted
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {unratedTeams.length} team{unratedTeams.length !== 1 ? 's' : ''} available to rate
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* My Ratings */}
            {userTeamId && myRatings.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Your Submitted Ratings</h2>
                  <div className="grid gap-3 md:grid-cols-2">
                    {myRatings.map((rating) => {
                      const ratedTeam = teams.find(t => t.id === rating.toTeamId);
                      return (
                        <div key={rating.id} className="rounded-lg border bg-muted p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium">{ratedTeam?.name || `Team #${rating.toTeamId}`}</h3>
                              <p className="text-sm text-muted-foreground">{ratedTeam?.college}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-bold text-blue-600">{rating.rating}/10</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(rating.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Rate Teams Tab */}
        {activeTab === 'rate' && userTeamId && (
          <div className="space-y-6">
            {/* Rating Form */}
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-semibold mb-4">Submit Peer Rating (3-10)</h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Rate the currently presenting team on a scale of 3-10. You can only rate during the peers rating phase.
                </p>

                {/* Current presenting team info */}
                {currentPitchTeam && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-md border">
                    <p className="text-sm text-blue-700">
                      <strong>Currently Presenting:</strong> {currentPitchTeam.name} (#{currentPitchTeam.id})
                    </p>
                  </div>
                )}

                {/* Rating restrictions info */}
                {!canRateAsPeer && (
                  <div className="mb-4 p-3 bg-yellow-50 rounded-md border border-yellow-200">
                    <p className="text-sm text-yellow-700">
                      {!ratingCycleActive && 'Waiting for rating cycle to start...'}
                      {ratingCycleActive && currentPhase === 'pitching' && 'Wait for rating phase to begin...'}
                      {ratingCycleActive && currentPhase === 'qna-pause' && 'Q&A in progress - Rating will start soon...'}
                      {ratingCycleActive && currentPhase === 'rating-warning' && 'Get ready! Rating starts in seconds...'}
                      {ratingCycleActive && currentPhase === 'rating-active' && phaseTimeLeft <= 0 && 'Rating time has ended.'}
                      {!isQualified && 'Only qualified teams can rate in the finals.'}
                      {userTeamId === currentPitchTeam?.id && 'You cannot rate your own team.'}
                      {!currentPitchTeam && 'No team is currently presenting.'}
                    </p>
                  </div>
                )}

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">
                    Your Rating: {rating}/10
                  </label>
                  <input
                    type="range"
                    min="3"
                    max="10"
                    value={rating}
                    onChange={(e) => setRating(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>3 (Poor)</span>
                    <span>6</span>
                    <span>10 (Excellent)</span>
                  </div>
                </div>

                <Button onClick={submitRating} variant="secondary" size="default" disabled={!canRateAsPeer || loading}>
                  {loading ? "Submitting..." : `Submit Peer Rating (${rating}/10)`}
                </Button>
              </CardContent>
            </Card>

            {/* Rating Progress */}
            {availableTeams.length > 0 && (
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Rating Progress</h2>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Teams Rated:</span>
                      <span>{myRatings.length} / {availableTeams.length}</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${(myRatings.length / availableTeams.length) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Message Display */}
        {msg && (
          <div className={`mb-6 rounded-md border px-4 py-3 text-center font-medium flex items-center justify-center gap-2 ${
            msgType === 'success'
              ? "bg-green-50 border-green-200 text-green-800"
              : msgType === 'error'
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-blue-50 border-blue-200 text-blue-800"
          }`}>
            {msgType === 'success' && <CheckCircle2 className="h-5 w-5" />}
            {msgType === 'error' && <AlertCircle className="h-5 w-5" />}
            {msg}
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center">
          <Button onClick={loadData} variant="secondary" size="default" disabled={loading}>
            {loading ? 'Refreshing...' : 'Refresh Data'}
          </Button>
          <a href="/scoreboard">
            <Button variant="default" size="default">View Scoreboard</Button>
          </a>
        </div>

        {/* Qualification Status Popup */}
        {showQualificationPopup && userTeamId && qualifiedTeams.length > 0 && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 shadow-xl">
              <div className="text-center">
                <div className="text-6xl mb-4">
                  {isQualified ? '🎉' : '👀'}
                </div>
                <h2 className={`text-2xl font-bold mb-3 ${
                  isQualified ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {isQualified 
                    ? '🏆 Congratulations!' 
                    : '📺 Spectator Mode'
                  }
                </h2>
                <p className={`text-lg mb-4 ${
                  isQualified ? 'text-green-700 dark:text-green-300' : 'text-yellow-700 dark:text-yellow-300'
                }`}>
                  {isQualified 
                    ? 'Your team qualified for the finals!' 
                    : 'Your team can watch the final pitches'
                  }
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  {isQualified 
                    ? 'You can register your pitch and rate other teams.'
                    : 'Only the top 5 teams can participate and rate in the finals.'
                  }
                </p>
                <button
                  onClick={() => setShowQualificationPopup(false)}
                  className={`w-full px-4 py-2 rounded-md font-medium text-white transition-colors ${
                    isQualified 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  }`}
                >
                  Continue to Finals
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageLock>
  );
}