"use client"

import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/lib/auth-client";
import { Timer, Users, Trophy, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import PageLock from "@/components/ui/PageLock";
import { useRoundStatus } from "@/hooks/useRoundStatus";
import { useRatingSSE } from "@/hooks/useRatingSSE";
import { ThemeToggle } from "@/components/ThemeToggle";

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
  currentPhase?: 'idle' | 'pitching' | 'judges-rating' | 'peers-rating';
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
  // Page lock functionality
  const { isCompleted: isFinalCompleted, loading: roundLoading } = useRoundStatus('FINAL');
  
  // Real-time updates via SSE
  const { isConnected: sseConnected, lastEvent } = useRatingSSE();
  
  const { data: session, isPending } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [myRatings, setMyRatings] = useState<PeerRating[]>([]);
  const [qualifiedTeams, setQualifiedTeams] = useState<any[]>([]);
  const [nonQualifiedTeams, setNonQualifiedTeams] = useState<any[]>([]);
  const [isQualified, setIsQualified] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgType, setMsgType] = useState<'success' | 'error' | 'info'>('info');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'rate' | 'judge' | 'status'>('status');

  // Round completion tracking
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [votingCompleted, setVotingCompleted] = useState<boolean>(false);
  const [roundsLoading, setRoundsLoading] = useState<boolean>(true);

  // Rating form state (updated for Round 3)
  const [toTeamId, setToTeamId] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(5); // Changed default to 5 for peer ratings (3-10)

  // Judge form state (updated for Round 3)
  const [judgeTeamId, setJudgeTeamId] = useState<number | null>(null);
  const [judgeScore, setJudgeScore] = useState<number>(50); // Changed default to 50 for judge ratings (0-100)
  const [judgeName, setJudgeName] = useState<string>('');

  // Rating cycle state
  const [currentPitchTeam, setCurrentPitchTeam] = useState<Team | null>(null);
  const [ratingActive, setRatingActive] = useState(false);
  const [allPitchesCompleted, setAllPitchesCompleted] = useState(false);
  const [ratingCycleActive, setRatingCycleActive] = useState<boolean>(false);
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'pitching' | 'judges-rating' | 'peers-rating'>('idle');
  const [phaseTimeLeft, setPhaseTimeLeft] = useState<number>(0);
  const [cycleStartTime, setCycleStartTime] = useState<number | null>(null);

  // Check for judge authentication
  const [isJudgeAuthenticated, setIsJudgeAuthenticated] = useState(false);

  const userTeamId = session?.user?.team?.id;
  const isAdmin = session?.user?.isAdmin;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isJudge = document.cookie.includes("judge-auth=true") || document.cookie.includes("admin-auth=true");
      setIsJudgeAuthenticated(isJudge);
    }
  }, []);

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
      let newPhase: 'idle' | 'pitching' | 'judges-rating' | 'peers-rating' = 'idle';
      let timeLeft = 0;
      
      if (elapsed < 300) {
        newPhase = 'pitching';
        timeLeft = 300 - elapsed;
      } else if (elapsed < 360) {
        newPhase = 'judges-rating';
        timeLeft = 360 - elapsed;
      } else if (elapsed < 420) {
        newPhase = 'peers-rating';
        timeLeft = 420 - elapsed;
      }
      
      setCurrentPhase(newPhase);
      setPhaseTimeLeft(Math.max(0, timeLeft));
      
      if (elapsed >= 420) {
        // Cycle should end
        setRatingCycleActive(false);
        setCurrentPhase('idle');
        setPhaseTimeLeft(0);
        setRatingActive(false);
        setCycleStartTime(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [ratingCycleActive, cycleStartTime]);

  useEffect(() => {
    loadData();
    checkRoundCompletion();
  }, [session]);

  // Set judge name
  useEffect(() => {
    if (session?.user?.name) {
      setJudgeName(session.user.name);
    } else if (isJudgeAuthenticated) {
      setJudgeName('Judge');
    }
  }, [session, isJudgeAuthenticated]);

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
        
        // Check if current user's team is qualified
        const userQualified = qualifiedData.qualifiedTeams.some((team: any) => team.teamId === userTeamId);
        setIsQualified(userQualified);
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

      // Set default judge name
      if (session?.user?.name) {
        setJudgeName(session.user.name);
      }

    } catch (error) {
      console.error('Error loading data:', error);
      setMsg('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const submitRating = async () => {
    if (!userTeamId || !toTeamId || rating < 3 || rating > 10) {
      showMessage("Please select a team and provide a rating between 3-10", 'error');
      return;
    }

    if (userTeamId === toTeamId) {
      showMessage("Cannot rate your own team", 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/round3/peer-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ 
          fromTeamId: userTeamId, 
          toTeamId, 
          rating 
        })
      });

      const data: RatingResponse = await res.json();
      
      if (res.ok && data.success) {
        showMessage(data.message || `Successfully rated team with ${rating}/10`, 'success');
        setToTeamId(null);
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

  const submitJudgeScore = async () => {
    if (!judgeTeamId || judgeScore < 0 || judgeScore > 100 || !judgeName.trim()) {
      showMessage("Please fill in all judge score fields with valid data (0-100)", 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/round3/judge-ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: 'include',
        body: JSON.stringify({ 
          judgeName: judgeName.trim(), 
          teamId: judgeTeamId, 
          rating: judgeScore 
        })
      });

      const data: RatingResponse = await res.json();
      
      if (res.ok && data.success) {
        showMessage(data.message || `Judge score submitted successfully: ${judgeScore}/100`, 'success');
        setJudgeTeamId(null);
        setJudgeScore(50); // Reset to default
      } else {
        showMessage(data?.error || "Failed to submit judge score", 'error');
      }
    } catch (error) {
      console.error("Error submitting judge score:", error);
      showMessage("Network error while submitting judge score", 'error');
    } finally {
      setLoading(false);
    }
  };

  if (isPending || loading || roundsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-md w-full mx-4 rounded-lg border bg-white p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">Loading...</h2>
          <p className="text-gray-600">Checking round status and loading data</p>
        </div>
      </div>
    );
  }
  
  if (!session?.user && !isJudgeAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-md w-full mx-4 rounded-lg border bg-white p-8 text-center">
          <Trophy className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
          <p className="mb-4 text-gray-600">
            You need to be signed in with a team account or judge account to participate in the finals.
          </p>
          <div className="space-y-3">
            <a 
              href="/sign-in" 
              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign In to Team
            </a>
            <div className="text-sm text-gray-500">
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
            <a 
              href="/dashboard" 
              className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors"
            >
              ← Back to Dashboard
            </a>
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

  // Rating permissions
  const canRateAsJudge = isJudgeAuthenticated && 
                        currentPitchTeam && 
                        ratingCycleActive && 
                        currentPhase === 'judges-rating' && 
                        phaseTimeLeft > 0;

  const canRateAsPeer = session?.user && 
                        userTeamId && 
                        currentPitchTeam && 
                        userTeamId !== currentPitchTeam.id &&
                        ratingCycleActive && 
                        currentPhase === 'peers-rating' && 
                        phaseTimeLeft > 0 &&
                        isQualified; // Only qualified teams can rate

  return (
    <PageLock roundType="FINAL" isCompleted={isFinalCompleted}>
      <div className="max-w-6xl mx-auto px-6 pt-6 transition-all duration-300 ease-in-out">
        <div className="flex items-center justify-between mb-4">
          <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <ThemeToggle />
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
          <div className="mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-purple-900">
                {currentPhase === 'pitching' && '🎤 Team is Pitching (5 min)'}
                {currentPhase === 'judges-rating' && '👨‍⚖️ Judges Rating (1 min)'}
                {currentPhase === 'peers-rating' && '👥 Peers Rating (1 min)'}
                {currentPhase === 'idle' && '⏸️ Rating Cycle Idle'}
              </h3>
              <div className="text-3xl font-bold text-purple-800">
                {Math.floor(phaseTimeLeft / 60)}:{(phaseTimeLeft % 60).toString().padStart(2, '0')}
              </div>
            </div>
            <div className="w-full bg-purple-200 rounded-full h-4 mb-2">
              <div 
                className={`h-4 rounded-full transition-all duration-1000 ${
                  currentPhase === 'pitching' ? 'bg-blue-500' :
                  currentPhase === 'judges-rating' ? 'bg-green-500' :
                  currentPhase === 'peers-rating' ? 'bg-orange-500' :
                  'bg-gray-400'
                }`}
                style={{ 
                  width: `${
                    currentPhase === 'pitching' ? (phaseTimeLeft / 300) * 100 :
                    currentPhase === 'judges-rating' ? (phaseTimeLeft / 60) * 100 :
                    currentPhase === 'peers-rating' ? (phaseTimeLeft / 60) * 100 :
                    0
                  }%` 
                }}
              ></div>
            </div>
            <div className="text-sm text-purple-700">
              {currentPhase === 'pitching' && 'Listen to the team presentation (5 minutes total)'}
              {currentPhase === 'judges-rating' && 'Judges: Rate the team now! (1 minute)'}
              {currentPhase === 'peers-rating' && 'Teams: Rate the presenting team! (1 minute)'}
              {currentPhase === 'idle' && 'Waiting for admin to start the next rating cycle'}
            </div>
          </div>
        )}

        {/* Current Team Display */}
        {currentPitchTeam ? (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold mb-2">Currently Presenting</h3>
            <div className="text-lg font-bold text-blue-800">
              {currentPitchTeam.name} (#{currentPitchTeam.id})
            </div>
          </div>
        ) : (
          <div className="mb-6 p-4 bg-gray-100 rounded-lg">
            <p className="text-gray-600">No team is currently presenting.</p>
          </div>
        )}

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">Round 3: Finals</h1>
          <p className="text-gray-600 dark:text-gray-300">
            {qualifiedTeams.length > 0 
              ? `Top 5 qualified teams compete in the final round. ${teams.length - 5} teams in spectator mode.`
              : "Submit 5-minute pitch presentations, rate peer teams (3-10), and receive judge scores."
            }
          </p>
        </div>

        {/* Qualification Status Banner */}
        {userTeamId && qualifiedTeams.length > 0 && (
          <div className={`mb-6 p-4 rounded-lg border ${
            isQualified 
              ? 'bg-green-50 border-green-200 text-green-800' 
              : 'bg-yellow-50 border-yellow-200 text-yellow-800'
          }`}>
            <div className="flex items-center gap-2">
              <div className="text-xl">
                {isQualified ? '🎉' : '👀'}
              </div>
              <div>
                <p className="font-medium">
                  {isQualified 
                    ? '🏆 Congratulations! Your team qualified for the finals!' 
                    : '📺 Spectator Mode - Your team can watch the final pitches'
                  }
                </p>
                <p className="text-sm mt-1">
                  {isQualified 
                    ? 'You can register your pitch and rate other teams.'
                    : 'Only the top 5 teams can participate and rate in the finals.'
                  }
                </p>
              </div>
            </div>
          </div>
        )}

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
          {isJudgeAuthenticated && (
            <button 
              onClick={() => setActiveTab('judge')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'judge' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
              }`}
            >
              Judge Panel
            </button>
          )}
        </div>

        {/* Status Overview Tab */}
        {activeTab === 'status' && (
          <div className="space-y-6">
            {/* Qualified Teams */}
            {qualifiedTeams.length > 0 && (
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-xl font-semibold mb-4">🏆 Top 5 Qualified Teams</h2>
                <div className="grid gap-3">
                  {qualifiedTeams.map((team, index) => (
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
                        <p className="font-medium">{team.combinedScore} pts</p>
                        <p className="text-xs text-muted-foreground">Combined Score</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* My Team Status */}
            {userTeamId && isQualified && (
              <div className="rounded-lg border bg-card p-6">
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
              </div>
            )}

            {/* My Ratings */}
            {userTeamId && myRatings.length > 0 && (
              <div className="rounded-lg border bg-card p-6">
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
              </div>
            )}
          </div>
        )}

        {/* Rate Teams Tab */}
        {activeTab === 'rate' && userTeamId && (
          <div className="space-y-6">
            {/* Rating Form */}
            <div className="rounded-xl border bg-card p-6 shadow transition-all duration-300 hover:shadow-lg">
              <h2 className="text-xl font-semibold mb-4">Submit Peer Rating (3-10)</h2>
              <p className="text-sm text-gray-600 mb-4">
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
                    {ratingCycleActive && currentPhase !== 'peers-rating' && 'Wait for peers rating phase...'}
                    {ratingCycleActive && currentPhase === 'peers-rating' && phaseTimeLeft <= 0 && 'Peers rating time has ended.'}
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
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>3 (Poor)</span>
                  <span>6</span>
                  <span>10 (Excellent)</span>
                </div>
              </div>

              <button
                onClick={submitRating}
                disabled={!canRateAsPeer || loading}
                className="w-full rounded-md bg-orange-600 px-4 py-2 text-white font-bold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? "Submitting..." : `Submit Peer Rating (${rating}/10)`}
              </button>
            </div>

            {/* Rating Progress */}
            {availableTeams.length > 0 && (
              <div className="rounded-lg border bg-card p-6">
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
              </div>
            )}
          </div>
        )}

        {/* Judge Panel Tab */}
        {activeTab === 'judge' && isJudgeAuthenticated && (
          <div className="rounded-xl border bg-card p-6 shadow transition-all duration-300 hover:shadow-lg">
            <h2 className="text-xl font-semibold mb-4">Judge Rating (0-100)</h2>
            <p className="text-sm text-gray-600 mb-4">
              Rate the currently presenting team on a scale of 0-100. You can only rate during the judges rating phase.
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
            {!canRateAsJudge && (
              <div className="mb-4 p-3 bg-yellow-50 rounded-md border border-yellow-200">
                <p className="text-sm text-yellow-700">
                  {!ratingCycleActive && 'Waiting for rating cycle to start...'}
                  {ratingCycleActive && currentPhase !== 'judges-rating' && 'Wait for judges rating phase...'}
                  {ratingCycleActive && currentPhase === 'judges-rating' && phaseTimeLeft <= 0 && 'Judges rating time has ended.'}
                  {!currentPitchTeam && 'No team is currently presenting.'}
                </p>
              </div>
            )}
            
            <div className="grid gap-4 md:grid-cols-2">
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
                <label className="block text-sm font-medium mb-2">
                  Score: {judgeScore}/100
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={judgeScore}
                  onChange={(e) => setJudgeScore(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={submitJudgeScore}
              disabled={!canRateAsJudge || loading || !judgeName.trim()}
              className="w-full mt-4 rounded-md bg-green-600 px-4 py-2 text-white font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {loading ? 'Submitting...' : `Submit Judge Rating (${judgeScore}/100)`}
            </button>
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
        </div>
      </div>
    </PageLock>
  );
}