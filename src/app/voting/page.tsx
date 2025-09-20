"use client"

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Timer, Users, Trophy, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import VotingLayout from '@/components/ui/VotingLayout';
import PageLock from "@/components/ui/PageLock";
import { useRoundStatus } from "@/hooks/useRoundStatus";
import { useVotingSSE } from "@/hooks/useVotingSSE";
import { useIsMobile } from "@/hooks/use-mobile";
import { ThemeToggle } from "@/components/ThemeToggle";

interface User {
  id: string;
  name: string;
  username: string;
  isAdmin: boolean;
  teamId?: number | null;
}

interface Team {
  id: number;
  name: string;
  college?: string;
}

interface CurrentPitchData {
  team: Team | null;
  votingActive: boolean;
  allPitchesCompleted: boolean;
  // Pitch cycle properties
  pitchCycleActive?: boolean;
  currentPhase?: 'idle' | 'pitching' | 'preparing' | 'voting';
  phaseTimeLeft?: number;
  cycleStartTime?: number | null;
}

interface VoteResponse {
  success?: boolean;
  error?: string;
  message?: string;
  vote?: any;
  conversion?: any;
}

interface TokenStatus {
  teamId: number;
  availableTokens: {
    marketing: number;
    capital: number;
    team: number;
    strategy: number;
  };
  canConvert: boolean;
  totalVotesGained: number;
  maxPossibleConversions: number;
  hasQuizSubmission: boolean;
}

interface VotingStatus {
  fromTeamId: number;
  votescast: any[];
  downvoteCount: number;
  remainingDownvotes: number;
  votedTeams: number[];
}

export default function VotingPage() {
  const isMobile = useIsMobile();
  
  // Page lock functionality
  const { isCompleted: isVotingCompleted, loading: roundLoading } = useRoundStatus('VOTING');
  
  // Real-time updates via SSE
  const { isConnected: sseConnected, lastEvent } = useVotingSSE();

  const [user, setUser] = useState<User | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [userTeam, setUserTeam] = useState<Team | null>(null);
  const [currentPitchTeam, setCurrentPitchTeam] = useState<Team | null>(null);
  const [votingActive, setVotingActive] = useState(false);
  const [allPitchesCompleted, setAllPitchesCompleted] = useState(false);
  const [votingRoundCompleted, setVotingRoundCompleted] = useState(false);
  const [voteValue, setVoteValue] = useState<1 | -1>(1);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [isConvertingTokens, setIsConvertingTokens] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [votingStatus, setVotingStatus] = useState<VotingStatus | null>(null);
  const [conversionQuantity, setConversionQuantity] = useState(1);
  
  // Auto-timeout functionality
  const [votingTimeLeft, setVotingTimeLeft] = useState<number | null>(null);
  const [votingStartTime, setVotingStartTime] = useState<number | null>(null);
  
  // Pitch cycle state
  const [pitchCycleActive, setPitchCycleActive] = useState<boolean>(false);
  const [currentPhase, setCurrentPhase] = useState<'idle' | 'pitching' | 'preparing' | 'voting'>('idle');
  const [phaseTimeLeft, setPhaseTimeLeft] = useState<number>(0);
  const [cycleStartTime, setCycleStartTime] = useState<number | null>(null);

  useEffect(() => {
    setIsPending(true);
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const parsedUser = JSON.parse(stored) as User;
        setUser(parsedUser);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.error("Error parsing user from localStorage:", e);
      setUser(null);
    }
    setIsPending(false);
  }, []);

  // Fetch user's team when user is loaded
  useEffect(() => {
    if (user?.teamId) {
      fetchUserTeam(user.teamId);
    } else {
      setUserTeam(null);
    }
  }, [user]);

  // Show message with auto-dismiss
  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(null), 5000);
  }, []);

  const fetchUserTeam = async (teamId: number) => {
    try {
      const response = await fetch(`/api/teams/${teamId}`);
      if (response.ok) {
        const team = await response.json();
        setUserTeam(team);
      } else {
        console.error('Failed to fetch user team');
        setUserTeam(null);
      }
    } catch (error) {
      console.error('Error fetching user team:', error);
      setUserTeam(null);
    }
  };

  const userTeamId = userTeam?.id;

  // Handle real-time SSE updates
  useEffect(() => {
    if (!lastEvent) return;

    console.log('Processing SSE event:', lastEvent);

    switch (lastEvent.type) {
      case 'teamChanged':
        if (lastEvent.data) {
          setCurrentPitchTeam(lastEvent.data.team);
          setVotingActive(lastEvent.data.votingActive);
          setAllPitchesCompleted(lastEvent.data.allPitchesCompleted);
          setPitchCycleActive(lastEvent.data.pitchCycleActive);
          setCurrentPhase(lastEvent.data.currentPhase);
          setPhaseTimeLeft(lastEvent.data.phaseTimeLeft);
          setCycleStartTime(lastEvent.data.cycleStartTime);
          showMessage(`New team is pitching: ${lastEvent.data.team?.name || 'None'}`, 'info');
        }
        break;
      
      case 'votingStateChanged':
        if (lastEvent.data) {
          setVotingActive(lastEvent.data.votingActive);
          setAllPitchesCompleted(lastEvent.data.allPitchesCompleted);
          setPitchCycleActive(lastEvent.data.pitchCycleActive);
          setCurrentPhase(lastEvent.data.currentPhase);
          setPhaseTimeLeft(lastEvent.data.phaseTimeLeft);
          setCycleStartTime(lastEvent.data.cycleStartTime);
          
          // Handle voting state changes
          if (lastEvent.data.votingActive && !votingActive) {
            showMessage('Voting is now active!', 'success');
          } else if (!lastEvent.data.votingActive && votingActive) {
            showMessage('Voting has ended', 'info');
          }
        }
        break;
        
      case 'connected':
        showMessage('Connected to real-time updates', 'success');
        break;
    }
  }, [lastEvent, votingActive, showMessage]);

  // Load teams data
  useEffect(() => {
    const loadTeams = async () => {
      try {
        const res = await fetch("/api/teams");
        if (!res.ok) {
          console.warn(`Failed to load teams: ${res.status} ${res.statusText}`);
          return;
        }
        
        const data = await res.json();
        setTeams(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading teams:", error);
        // Don't show error message to user for teams loading failure
      }
    };

    loadTeams();
  }, []);

  // Load token status for user's team
  useEffect(() => {
    const loadTokenStatus = async () => {
      if (!userTeamId) return;
      
      try {
        const res = await fetch(`/api/tokens/convert?teamId=${userTeamId}`);
        if (!res.ok) {
          console.warn(`Failed to load token status: ${res.status} ${res.statusText}`);
          return;
        }
        
        const data: TokenStatus = await res.json();
        setTokenStatus(data);
        
        // Reset conversion quantity if it exceeds new maximum
        if (data.maxPossibleConversions < conversionQuantity) {
          setConversionQuantity(Math.max(1, data.maxPossibleConversions));
        }
      } catch (error) {
        console.error("Error loading token status:", error);
      }
    };

    loadTokenStatus();
  }, [userTeamId, conversionQuantity]);

  // Load voting status for user's team
  useEffect(() => {
    const loadVotingStatus = async () => {
      if (!userTeamId) return;
      
      try {
        const res = await fetch(`/api/votes?fromTeamId=${userTeamId}`);
        if (!res.ok) {
          console.warn(`Failed to load voting status: ${res.status} ${res.statusText}`);
          return;
        }
        
        const data: VotingStatus = await res.json();
        // Ensure all required fields are present with defaults
        const safeData: VotingStatus = {
          fromTeamId: data.fromTeamId || userTeamId,
          votescast: data.votescast || [],
          downvoteCount: data.downvoteCount || 0,
          remainingDownvotes: data.remainingDownvotes ?? 3,
          votedTeams: data.votedTeams || [],
        };
        setVotingStatus(safeData);
      } catch (error) {
        console.error("Error loading voting status:", error);
      }
    };

    loadVotingStatus();
  }, [userTeamId]);

  // Poll current pitch status
  useEffect(() => {
    const pollPitchStatus = async () => {
      try {
        // First try voting current API (for Round 2)
        let res = await fetch("/api/voting/current");
        let data: CurrentPitchData | null = null;
        
        if (res.ok) {
          data = await res.json();
        }
        
        // If no team in voting current, try rating current API (for Round 3)
        if (!data?.team) {
          try {
            const ratingRes = await fetch("/api/rating/current");
            if (ratingRes.ok) {
              const ratingData = await ratingRes.json();
              if (ratingData?.team) {
                // Convert rating data to voting data format
                data = {
                  team: ratingData.team,
                  votingActive: ratingData.ratingActive,
                  allPitchesCompleted: ratingData.allPitchesCompleted,
                  pitchCycleActive: ratingData.ratingCycleActive,
                  currentPhase: ratingData.currentPhase === 'pitching' ? 'pitching' :
                              ratingData.currentPhase === 'judges-rating' ? 'preparing' :
                              ratingData.currentPhase === 'peers-rating' ? 'voting' : 'idle',
                  phaseTimeLeft: ratingData.phaseTimeLeft,
                  cycleStartTime: ratingData.cycleStartTime
                };
              }
            }
          } catch (ratingError) {
            console.warn('Failed to fetch rating status:', ratingError);
          }
        }
        
        if (!data) {
          console.warn('Failed to fetch any pitch status');
          return;
        }
        
        setCurrentPitchTeam(data?.team ?? null);
        
        // Handle pitch cycle state
        const newPitchCycleActive = data?.pitchCycleActive ?? false;
        const newCurrentPhase = data?.currentPhase ?? 'idle';
        const newPhaseTimeLeft = data?.phaseTimeLeft ?? 0;
        const newCycleStartTime = data?.cycleStartTime ?? null;
        
        setPitchCycleActive(newPitchCycleActive);
        setCurrentPhase(newCurrentPhase);
        setPhaseTimeLeft(newPhaseTimeLeft);
        setCycleStartTime(newCycleStartTime);
        
        // Handle voting activation timing
        const newVotingActive = data?.votingActive ?? false;
        if (newVotingActive && !votingActive) {
          // Voting just got activated
          if (!newPitchCycleActive) {
            // Only set legacy voting timer if not in pitch cycle
            setVotingStartTime(Date.now());
            setVotingTimeLeft(30);
          }
        } else if (!newVotingActive && votingActive) {
          // Voting just got deactivated
          setVotingStartTime(null);
          setVotingTimeLeft(null);
        }

        // For pitch cycle, calculate time left based on cycle start time and current phase
        if (newPitchCycleActive && newCycleStartTime) {
          const elapsed = Math.floor((Date.now() - newCycleStartTime) / 1000);
          let calculatedPhaseTimeLeft = 0;
          
          if (elapsed < 90) {
            // Pitching phase
            calculatedPhaseTimeLeft = 90 - elapsed;
          } else if (elapsed < 95) {
            // Preparation phase
            calculatedPhaseTimeLeft = 95 - elapsed;
          } else if (elapsed < 125) {
            // Voting phase
            calculatedPhaseTimeLeft = 125 - elapsed;
          }
          
          // Use calculated time if it's more accurate than server-provided time
          setPhaseTimeLeft(Math.max(0, calculatedPhaseTimeLeft));
        }
        
        setVotingActive(newVotingActive);
        setAllPitchesCompleted(data?.allPitchesCompleted ?? false);
        
        // Check voting round status
        try {
          const roundsRes = await fetch("/api/rounds");
          if (roundsRes.ok) {
            const rounds = await roundsRes.json();
            if (Array.isArray(rounds)) {
              const votingRound = rounds.find((r: any) => r.type === "VOTING");
              setVotingRoundCompleted(votingRound?.isCompleted || false);
            }
          }
        } catch (roundsError) {
          console.warn("Failed to check voting round status:", roundsError);
        }
      } catch (error) {
        console.warn("Error polling pitch status:", error);
      }
    };

    const interval = setInterval(pollPitchStatus, 2000);
    pollPitchStatus();
    
    return () => clearInterval(interval);
  }, []);

  // Countdown timer effect for legacy voting
  useEffect(() => {
    if (!votingActive || !votingStartTime || pitchCycleActive) {
      return;
    }

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - votingStartTime) / 1000);
      const remaining = Math.max(0, 30 - elapsed);
      setVotingTimeLeft(remaining);
      
      if (remaining === 0) {
        // Time's up - voting should be disabled
        setVotingTimeLeft(null);
        setVotingStartTime(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [votingActive, votingStartTime, pitchCycleActive]);

  // Real-time timer update for pitch cycle
  useEffect(() => {
    if (!pitchCycleActive || !cycleStartTime) {
      return;
    }

    const timer = setInterval(() => {
      const elapsed = Math.floor((Date.now() - cycleStartTime) / 1000);
      let newPhase: 'idle' | 'pitching' | 'preparing' | 'voting' = 'idle';
      let timeLeft = 0;
      
      if (elapsed < 90) {
        newPhase = 'pitching';
        timeLeft = 90 - elapsed;
      } else if (elapsed < 95) {
        newPhase = 'preparing';
        timeLeft = 95 - elapsed;
      } else if (elapsed < 125) {
        newPhase = 'voting';
        timeLeft = 125 - elapsed;
      }
      
      setCurrentPhase(newPhase);
      setPhaseTimeLeft(Math.max(0, timeLeft));
      
      if (elapsed >= 125) {
        // Cycle should end
        setPitchCycleActive(false);
        setCurrentPhase('idle');
        setPhaseTimeLeft(0);
        setVotingActive(false);
        setCycleStartTime(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [pitchCycleActive, cycleStartTime]);

  // Cast vote function
  const castVote = async () => {
    if (!userTeamId || !currentPitchTeam?.id) {
      if (!userTeamId) {
        showMessage("You are not assigned to a team. Please contact an administrator.", 'error');
      } else {
        showMessage("No team is currently pitching", 'error');
      }
      return;
    }

    // Prevent voting for own team
    if (userTeamId === currentPitchTeam.id) {
      showMessage("You cannot vote for your own team", 'error');
      return;
    }

    // Check if already voted for this team
    if (votingStatus?.votedTeams?.includes(currentPitchTeam.id)) {
      showMessage("You have already voted for this team", 'error');
      return;
    }

    // Check downvote limit
    if (voteValue === -1 && votingStatus && votingStatus.remainingDownvotes <= 0) {
      showMessage("You have reached the maximum of 3 downvotes", 'error');
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        credentials: 'include', // Important for cookie authentication
        body: JSON.stringify({ 
          fromTeamId: userTeamId, 
          toTeamId: currentPitchTeam.id, 
          value: voteValue 
        })
      });

      const data: VoteResponse = await res.json();
      
      // Debug logging
      console.log('Vote response:', {
        status: res.status,
        ok: res.ok,
        data: data
      });

      if (res.ok && data.success) {
        showMessage(data.message || `Vote recorded successfully (${voteValue === 1 ? 'Yes' : 'No'})`, 'success');
        
        // Refresh voting status
        if (userTeamId) {
          const statusRes = await fetch(`/api/votes?fromTeamId=${userTeamId}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            // Ensure all required fields are present with defaults
            const safeStatusData: VotingStatus = {
              fromTeamId: statusData.fromTeamId || userTeamId,
              votescast: statusData.votescast || [],
              downvoteCount: statusData.downvoteCount || 0,
              remainingDownvotes: statusData.remainingDownvotes ?? 3,
              votedTeams: statusData.votedTeams || [],
            };
            setVotingStatus(safeStatusData);
          }
        }
      } else {
        showMessage(data?.error || "Failed to cast vote", 'error');
      }
    } catch (error) {
      console.error("Error casting vote:", error);
      showMessage("Network error while casting vote", 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // Convert tokens function
  const convertToken = async () => {
    if (!userTeamId) {
      showMessage("No team detected", 'error');
      return;
    }

    if (!tokenStatus?.canConvert) {
      if (!tokenStatus?.hasQuizSubmission) {
        showMessage("Complete the quiz first to earn tokens", 'error');
      } else {
        showMessage("Insufficient tokens: need at least 1 in each category", 'error');
      }
      return;
    }

    if (conversionQuantity > (tokenStatus?.maxPossibleConversions || 0)) {
      showMessage(`Cannot convert ${conversionQuantity} tokens. Maximum possible: ${tokenStatus?.maxPossibleConversions || 0}`, 'error');
      return;
    }

    setIsConvertingTokens(true);

    try {
      const res = await fetch("/api/tokens/convert", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json"
        },
        credentials: 'include', // Important for cookie authentication
        body: JSON.stringify({ teamId: userTeamId, quantity: conversionQuantity })
      });

      const data: VoteResponse = await res.json();

      if (res.ok && data.success) {
        showMessage(data.message || "Successfully converted tokens to votes", 'success');
        
        // Refresh token status
        const tokenRes = await fetch(`/api/tokens/convert?teamId=${userTeamId}`);
        if (tokenRes.ok) {
          const tokenData = await tokenRes.json();
          setTokenStatus(tokenData);
        }
      } else {
        showMessage(data?.error || "Failed to convert tokens", 'error');
      }
    } catch (error) {
      console.error("Error converting tokens:", error);
      showMessage("Network error while converting tokens", 'error');
    } finally {
      setIsConvertingTokens(false);
    }
  };

  // Show loading state while session is loading
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 mobile-padding">
        <div className="max-w-md w-full mx-4 rounded-lg border bg-white dark:bg-gray-800 p-6 md:p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className={`font-bold mb-2 text-gray-900 dark:text-white ${isMobile ? 'text-lg' : 'text-xl'}`}>Loading...</h2>
          <p className="text-muted-foreground text-sm">Checking authentication status</p>
        </div>
      </div>
    );
  }

  // Show authentication required if not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 mobile-padding">
        <div className="max-w-md w-full mx-4 rounded-lg border bg-white dark:bg-gray-800 p-6 md:p-8 text-center">
          <Trophy className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className={`font-bold mb-2 text-gray-900 dark:text-white ${isMobile ? 'text-lg' : 'text-xl'}`}>Authentication Required</h2>
          <p className="mb-4 text-muted-foreground text-sm">
            You need to be signed in with a team account to participate in voting.
          </p>
          <div className="space-y-3">
            <a 
              href="/sign-in" 
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors min-h-[44px] flex items-center justify-center active:scale-95"
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

  // Handle judge users who might not have teams
  const isJudgeUser = user && !user.teamId && user.name.toLowerCase().includes('judge');
  
  if (isJudgeUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-md w-full mx-4 rounded-lg border bg-white dark:bg-gray-800 p-8 text-center">
          <Trophy className="h-12 w-12 text-purple-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">Judge Account Detected</h2>
          <p className="mb-4 text-muted-foreground">
            Judge accounts cannot participate in team voting. Please use the judge console for scoring.
          </p>
          <div className="space-y-3">
            <a 
              href="/judge" 
              className="block w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Go to Judge Console
            </a>
            <a 
              href="/dashboard" 
              className="block w-full px-4 py-2 border border-border text-foreground rounded-lg hover:bg-accent transition-colors"
            >
              Back to Dashboard
            </a>
          </div>
        </div>
      </div>
    );
  }

  const canVoteForCurrentTeam = currentPitchTeam && 
                               userTeamId !== currentPitchTeam.id &&
                               !votingStatus?.votedTeams?.includes(currentPitchTeam.id) &&
                               (() => {
                                 // In pitch cycle mode, check if we're in voting phase with time left
                                 if (pitchCycleActive) {
                                   return currentPhase === 'voting' && phaseTimeLeft > 0;
                                 }
                                 // In legacy mode, check if voting is active with time left
                                 return votingActive && (votingTimeLeft === null || votingTimeLeft > 0);
                               })();

  const canDownvote = voteValue === -1 && votingStatus && votingStatus.remainingDownvotes > 0;

  return (
    <PageLock roundType="VOTING" isCompleted={isVotingCompleted || votingRoundCompleted}>
      <div className="max-w-3xl mx-auto px-6 pt-6 transition-all duration-300 ease-in-out">
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
      
      <VotingLayout
        header="Team Voting Portal"
        subheader="Peer evaluation • 1 token from each category = 1 vote • Unlimited Yes • Max 3 No"
        teamName={userTeam ? userTeam.name : undefined}
        teamMembers={undefined}
        showRules={true}
      >
      
      {/* Pitch Cycle Timer Display */}
      {pitchCycleActive && (
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-blue-900">
              {currentPhase === 'pitching' && '🎤 Team is Pitching'}
              {currentPhase === 'preparing' && '⏳ Get Ready to Vote'}
              {currentPhase === 'voting' && '🗳️ Voting is Active'}
              {currentPhase === 'idle' && '⏸️ Pitch Cycle Idle'}
            </h3>
            <div className="text-3xl font-bold text-blue-800">
              {phaseTimeLeft}s
            </div>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-4 mb-2">
            <div 
              className={`h-4 rounded-full transition-all duration-1000 ${
                currentPhase === 'pitching' ? 'bg-green-500' :
                currentPhase === 'preparing' ? 'bg-yellow-500' :
                currentPhase === 'voting' ? 'bg-red-500' :
                'bg-gray-400'
              }`}
              style={{ 
                width: `${
                  currentPhase === 'pitching' ? (phaseTimeLeft / 90) * 100 :
                  currentPhase === 'preparing' ? (phaseTimeLeft / 5) * 100 :
                  currentPhase === 'voting' ? (phaseTimeLeft / 30) * 100 :
                  0
                }%` 
              }}
            ></div>
          </div>
          <div className="text-sm text-blue-700">
            {currentPhase === 'pitching' && 'Listen to the team presentation (90 seconds total)'}
            {currentPhase === 'preparing' && 'Prepare to make your voting decision (5 seconds)'}
            {currentPhase === 'voting' && 'Vote now! Time is running out (30 seconds total)'}
            {currentPhase === 'idle' && 'Waiting for admin to start the next pitch cycle'}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-8 md:flex-row md:gap-12 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
        {/* Cast Vote Card */}
        <div className="flex-1 rounded-xl border bg-card p-6 shadow transition-all duration-300 hover:shadow-lg">
          <h2 className="text-xl font-bold mb-4">Cast Your Vote</h2>
          
          {/* Team Info Display */}
          <div className="mb-4 p-3 bg-blue-50 rounded-md border transition-all duration-200">
            <p className="text-sm text-blue-700">
              <strong>Your Team:</strong> {userTeam ? `${userTeam.name} (#${userTeam.id})` : 'Not assigned to a team'}
            </p>
            {!userTeam && !user?.isAdmin && (
              <p className="text-xs text-orange-600 mt-1">
                ⚠️ You need to be assigned to a team to participate in voting. Please contact an administrator.
              </p>
            )}
            {user?.isAdmin && (
              <p className="text-xs text-green-600 mt-1">
                👑 Admin account - Contact organizers to get a team assignment for voting participation.
              </p>
            )}
            {votingStatus && userTeam && (
              <p className="text-xs text-blue-600 mt-1">
                Votes cast: {votingStatus.votescast?.length || 0} | Downvotes remaining: {votingStatus.remainingDownvotes || 0}
              </p>
            )}
          </div>
          
          {currentPitchTeam ? (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Currently Pitching Team
              </label>
              <div className="rounded-md border px-3 py-2 text-lg font-bold bg-primary/80 text-white">
                {currentPitchTeam.name} (#{currentPitchTeam.id})
              </div>
              {userTeamId === currentPitchTeam.id && (
                <p className="text-sm text-amber-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  This is your team - you cannot vote for yourself
                </p>
              )}
              {votingStatus?.votedTeams?.includes(currentPitchTeam.id) && (
                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  You have already voted for this team
                </p>
              )}
            </div>
          ) : (
            <div className="mb-4 p-3 bg-muted rounded-md">
              <p className="text-muted-foreground">No team is currently pitching.</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Are you the customer for this product?
            </label>
            <div className={`flex gap-4 ${isMobile ? 'flex-col' : ''}`}>
              <button
                onClick={() => setVoteValue(1)}
                className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors min-h-[44px] active:scale-95 ${
                  voteValue === 1
                    ? "bg-green-600 border-green-600 text-white"
                    : "border-border text-foreground hover:bg-accent"
                }`}
                disabled={isLoading}
              >
                Yes
              </button>
              <button
                onClick={() => setVoteValue(-1)}
                className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors min-h-[44px] active:scale-95 ${
                  voteValue === -1
                    ? "bg-red-600 border-red-600 text-white"
                    : "border-border text-foreground hover:bg-accent"
                }`}
                disabled={isLoading || !!(votingStatus && votingStatus.remainingDownvotes <= 0)}
              >
                No {votingStatus && `(${votingStatus.remainingDownvotes} left)`}
              </button>
            </div>
            {voteValue === -1 && votingStatus && votingStatus.remainingDownvotes <= 0 && (
              <p className="text-xs text-red-600 mt-1">
                You have used all 3 downvotes
              </p>
            )}
          </div>

          {/* Voting Countdown Timer */}
          {(() => {
            // Show pitch cycle timer if active
            if (pitchCycleActive && currentPhase === 'voting') {
              return (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-red-600" />
                    <span className="text-sm font-medium text-red-800">
                      Voting closes in: <span className="font-bold text-lg">{phaseTimeLeft}s</span>
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-red-200 rounded-full h-2">
                    <div 
                      className="bg-red-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(phaseTimeLeft / 30) * 100}%` }}
                    ></div>
                  </div>
                </div>
              );
            }
            
            // Show legacy timer if voting active and not in pitch cycle
            if (votingActive && votingTimeLeft !== null && !pitchCycleActive) {
              return (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-md">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-800">
                      Voting closes in: <span className="font-bold text-lg">{votingTimeLeft}s</span>
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-orange-200 rounded-full h-2">
                    <div 
                      className="bg-orange-600 h-2 rounded-full transition-all duration-1000"
                      style={{ width: `${(votingTimeLeft / 30) * 100}%` }}
                    ></div>
                  </div>
                </div>
              );
            }
            
            return null;
          })()}

          <button
            onClick={castVote}
            disabled={!canVoteForCurrentTeam || isLoading || (voteValue === -1 && !canDownvote)}
            className="w-full rounded-md bg-primary px-4 py-2 text-base font-bold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Submitting...
              </span>
            ) : (
              "Submit Vote"
            )}
          </button>

          {!votingActive && !pitchCycleActive && (
            <div className="mt-2 text-xs text-muted-foreground animate-pulse">
              Voting will be enabled by admin during each pitch.
            </div>
          )}
          
          {!votingActive && pitchCycleActive && currentPhase !== 'voting' && (
            <div className="mt-2 text-xs text-blue-600 font-medium">
              {currentPhase === 'pitching' && '🎤 Listen to the pitch presentation...'}
              {currentPhase === 'preparing' && '⏳ Get ready to vote...'}
              {currentPhase === 'idle' && 'Waiting for next pitch cycle...'}
            </div>
          )}
          
          {votingActive && votingTimeLeft === 0 && !pitchCycleActive && (
            <div className="mt-2 text-xs text-red-600 font-medium">
              ⏰ Voting time has expired for this pitch.
            </div>
          )}
        </div>

        {/* Convert Tokens Card */}
        <div className="flex-1 rounded-xl border bg-card p-6 shadow transition-all duration-300 hover:shadow-lg">
          <h2 className="text-xl font-bold mb-4">Convert Tokens</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Convert tokens from each category (Marketing, Capital, Team, Strategy) to get votes. Each conversion uses 1 token from each category to get 1 vote.
          </p>
          
          {tokenStatus && (
            <div className="mb-4 p-3 bg-muted rounded-md text-sm transition-all duration-200">
              <h4 className="font-medium mb-2 text-foreground">Available Tokens:</h4>
              <div className="grid grid-cols-2 gap-2 text-foreground mb-3">
                <div>Marketing: {tokenStatus.availableTokens.marketing}</div>
                <div>Capital: {tokenStatus.availableTokens.capital}</div>
                <div>Team: {tokenStatus.availableTokens.team}</div>
                <div>Strategy: {tokenStatus.availableTokens.strategy}</div>
              </div>
              <div className="text-blue-600 font-medium">
                Maximum possible conversions: {Math.max(0, tokenStatus.maxPossibleConversions)}
              </div>
              {tokenStatus.totalVotesGained > 0 && (
                <p className="mt-2 text-green-600 font-medium">
                  ✓ Total votes gained so far: {tokenStatus.totalVotesGained}
                </p>
              )}
            </div>
          )}

          {/* Quantity Selector */}
          {tokenStatus?.canConvert && (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">
                How many tokens do you want to convert?
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="1"
                  max={tokenStatus.maxPossibleConversions}
                  value={conversionQuantity}
                  onChange={(e) => {
                    const value = parseInt(e.target.value) || 1;
                    setConversionQuantity(Math.min(Math.max(1, value), tokenStatus.maxPossibleConversions));
                  }}
                  className="w-20 px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-background text-foreground"
                />
                <span className="text-sm text-muted-foreground">
                  (max: {tokenStatus.maxPossibleConversions})
                </span>
              </div>
              
              {/* Conversion Preview */}
              <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-md">
                <h5 className="font-medium text-purple-800 mb-1">Conversion Preview:</h5>
                <div className="text-sm text-purple-700">
                  <div>• Will use: {conversionQuantity} token from each category</div>
                  <div>• Total tokens used: {conversionQuantity * 4}</div>
                  <div>• Votes you'll gain: {conversionQuantity}</div>
                </div>
                <div className="mt-2 text-xs text-purple-600">
                  <strong>Remaining after conversion:</strong>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    <div>Marketing: {tokenStatus.availableTokens.marketing - conversionQuantity}</div>
                    <div>Capital: {tokenStatus.availableTokens.capital - conversionQuantity}</div>
                    <div>Team: {tokenStatus.availableTokens.team - conversionQuantity}</div>
                    <div>Strategy: {tokenStatus.availableTokens.strategy - conversionQuantity}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <button
            onClick={convertToken}
            disabled={!tokenStatus?.canConvert || isConvertingTokens}
            className="w-full rounded-md bg-purple-600 px-4 py-2 text-base font-bold text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          >
            {isConvertingTokens ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Converting...
              </span>
            ) : (
              `Convert ${conversionQuantity} Token${conversionQuantity > 1 ? 's' : ''} → ${conversionQuantity} Vote${conversionQuantity > 1 ? 's' : ''}`
            )}
          </button>

          {tokenStatus && !tokenStatus.canConvert && (
            <div className="mt-2 text-xs text-muted-foreground">
              {!tokenStatus.hasQuizSubmission 
                ? "Complete the quiz first to earn tokens"
                : "Need at least 1 token in each category to convert"
              }
            </div>
          )}
        </div>
      </div>

      {/* Voting Statistics */}
      {votingStatus && (
        <div className="mt-8 rounded-xl border bg-card p-6 shadow">
          <h3 className="text-lg font-bold mb-4">Your Voting History</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-3 bg-blue-50 rounded-md">
              <div className="text-2xl font-bold text-blue-600">{votingStatus?.votescast?.length || 0}</div>
              <div className="text-sm text-blue-700">Total Votes Cast</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-md">
              <div className="text-2xl font-bold text-green-600">
                {votingStatus?.votescast?.filter(v => v.value === 1).length || 0}
              </div>
              <div className="text-sm text-green-700">Yes Votes</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-md">
              <div className="text-2xl font-bold text-red-600">{votingStatus?.downvoteCount || 0}</div>
              <div className="text-sm text-red-700">No Votes ({votingStatus?.remainingDownvotes || 0} remaining)</div>
            </div>
          </div>
          
          {votingStatus?.votescast && votingStatus.votescast.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Teams You've Voted For:</h4>
              <div className="flex flex-wrap gap-2">
                {votingStatus.votescast.map((vote, index) => {
                  const team = teams.find(t => t.id === vote.toTeamId);
                  return (
                    <span 
                      key={index}
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        vote.value === 1 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {team?.name || `Team #${vote.toTeamId}`} ({vote.value === 1 ? 'Yes' : 'No'})
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Message Display */}
      {message && (
        <div className={`mt-6 rounded-md border px-4 py-3 text-center font-medium flex items-center justify-center gap-2 ${
          messageType === 'success'
            ? "bg-green-50 border-green-200 text-green-800"
            : messageType === 'error'
            ? "bg-red-50 border-red-200 text-red-800"
            : "bg-blue-50 border-blue-200 text-blue-800"
        }`}>
          {messageType === 'success' && <CheckCircle2 className="h-5 w-5" />}
          {messageType === 'error' && <AlertCircle className="h-5 w-5" />}
          {message}
        </div>
      )}
      </VotingLayout>
    </div>
    </PageLock>
  );
}