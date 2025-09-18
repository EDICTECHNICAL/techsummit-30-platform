"use client"

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Timer, Users, Trophy, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import VotingLayout from '@/components/ui/VotingLayout';

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

  // Load user from localStorage
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

  // Show message with auto-dismiss
  const showMessage = useCallback((text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setMessage(text);
    setMessageType(type);
    setTimeout(() => setMessage(null), 5000);
  }, []);

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
  }, [showMessage]);

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
      } catch (error) {
        console.error("Error loading token status:", error);
      }
    };

    loadTokenStatus();
  }, [userTeamId]);

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
        const res = await fetch("/api/voting/current");
        if (!res.ok) {
          console.warn(`Failed to fetch pitch status: ${res.status} ${res.statusText}`);
          return;
        }
        
        const data: CurrentPitchData = await res.json();
        setCurrentPitchTeam(data?.team ?? null);
        setVotingActive(data?.votingActive ?? false);
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
      } else if (tokenStatus.totalVotesGained > 0) {
        showMessage("Tokens have already been converted", 'error');
      } else {
        showMessage("Insufficient tokens: need at least 1 in each category", 'error');
      }
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
        body: JSON.stringify({ teamId: userTeamId })
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-md w-full mx-4 rounded-lg border bg-white p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-bold mb-2">Loading...</h2>
          <p className="text-gray-600">Checking authentication status</p>
        </div>
      </div>
    );
  }

  // Show authentication required if not logged in
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-md w-full mx-4 rounded-lg border bg-white p-8 text-center">
          <Trophy className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
          <p className="mb-4 text-gray-600">
            You need to be signed in with a team account to participate in voting.
          </p>
          <a 
            href="/sign-in" 
            className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In to Team
          </a>
        </div>
      </div>
    );
  }

  // Show voting completed message
  if (votingRoundCompleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-all duration-500 ease-in-out">
        <div className="max-w-md w-full mx-4 rounded-lg border border-green-300 bg-green-50 p-8 text-center shadow-lg animate-in fade-in-50 slide-in-from-bottom-4 duration-700">
          <div className="text-6xl mb-4 animate-pulse">🗳️</div>
          <h2 className="text-2xl font-bold mb-4 text-green-800">Voting Round Completed</h2>
          <p className="text-green-700 mb-6">
            The voting round has been completed by the admin and is no longer accepting votes.
            <br />
            <span className="text-sm mt-2 block text-green-600">
              The page will automatically reactivate when voting is resumed.
            </span>
          </p>
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="block w-full px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Return to Dashboard
            </Link>
            <Link
              href="/scoreboard"
              className="block w-full px-4 py-2 border border-green-300 bg-white text-green-700 rounded-lg hover:bg-green-50 transition-colors"
            >
              View Scoreboard
            </Link>
          </div>
          <div className="mt-6 text-xs text-gray-500">
            <div className="flex items-center justify-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Monitoring for voting resumption...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }



  const canVoteForCurrentTeam = currentPitchTeam && 
                               votingActive && 
                               userTeamId !== currentPitchTeam.id &&
                               !votingStatus?.votedTeams?.includes(currentPitchTeam.id);

  const canDownvote = voteValue === -1 && votingStatus && votingStatus.remainingDownvotes > 0;

  return (
    <div className="max-w-3xl mx-auto px-6 pt-6 transition-all duration-300 ease-in-out">
      <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline mb-4 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
      <VotingLayout
        header="Team Voting Portal"
        subheader="Peer evaluation • 1 token from each category = 1 vote • Unlimited Yes • Max 3 No"
        teamName={userTeam ? userTeam.name : undefined}
        teamMembers={undefined}
        showRules={true}
      >
      <div className="flex flex-col gap-8 md:flex-row md:gap-12 animate-in fade-in-50 slide-in-from-bottom-4 duration-500">
        {/* Cast Vote Card */}
        <div className="flex-1 rounded-xl border bg-card p-6 shadow transition-all duration-300 hover:shadow-lg">
          <h2 className="text-xl font-bold mb-4">Cast Your Vote</h2>
          
          {/* Team Info Display */}
          <div className="mb-4 p-3 bg-blue-50 rounded-md border transition-all duration-200">
            <p className="text-sm text-blue-700">
              <strong>Your Team:</strong> {userTeam ? `${userTeam.name} (#${userTeam.id})` : 'Not assigned to a team'}
            </p>
            {!userTeam && (
              <p className="text-xs text-orange-600 mt-1">
                ⚠️ You need to be assigned to a team to participate in voting. Please contact an administrator.
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
            <div className="mb-4 p-3 bg-gray-100 rounded-md">
              <p className="text-gray-600">No team is currently pitching.</p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Are you the customer for this product?
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setVoteValue(1)}
                className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
                  voteValue === 1
                    ? "bg-green-600 border-green-600 text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
                disabled={isLoading}
              >
                Yes
              </button>
              <button
                onClick={() => setVoteValue(-1)}
                className={`rounded-md border px-4 py-2 text-sm font-semibold transition-colors ${
                  voteValue === -1
                    ? "bg-red-600 border-red-600 text-white"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
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

          {!votingActive && (
            <div className="mt-2 text-xs text-gray-500 animate-pulse">
              Voting will be enabled by admin during each pitch.
            </div>
          )}
        </div>

        {/* Convert Tokens Card */}
        <div className="flex-1 rounded-xl border bg-card p-6 shadow transition-all duration-300 hover:shadow-lg">
          <h2 className="text-xl font-bold mb-4">Convert Tokens</h2>
          <p className="mb-4 text-sm text-gray-600">
            Convert 1 token from each category (Marketing, Capital, Team, Strategy) to get 1 vote.
          </p>
          
          {tokenStatus && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md text-sm transition-all duration-200">
              <h4 className="font-medium mb-2 text-black">Available Tokens:</h4>
              <div className="grid grid-cols-2 gap-2 text-black">
                <div>Marketing: {tokenStatus.availableTokens.marketing}</div>
                <div>Capital: {tokenStatus.availableTokens.capital}</div>
                <div>Team: {tokenStatus.availableTokens.team}</div>
                <div>Strategy: {tokenStatus.availableTokens.strategy}</div>
              </div>
              {tokenStatus.totalVotesGained > 0 && (
                <p className="mt-2 text-green-600 font-medium">
                  ✓ Tokens already converted ({tokenStatus.totalVotesGained} vote gained)
                </p>
              )}
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
              "Convert Tokens → Vote"
            )}
          </button>

          {tokenStatus && !tokenStatus.canConvert && (
            <div className="mt-2 text-xs text-gray-500">
              {!tokenStatus.hasQuizSubmission 
                ? "Complete the quiz first to earn tokens"
                : tokenStatus.totalVotesGained > 0
                ? "Tokens have already been converted"
                : "Need at least 1 token in each category"
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
  );
}