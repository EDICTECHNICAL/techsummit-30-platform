"use client"

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Timer, Users, Trophy, AlertCircle, CheckCircle2 } from 'lucide-react';
import VotingLayout from '@/components/ui/VotingLayout';
import { useSession } from '@/lib/auth-client';

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

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function VotingPage() {
  const { data: session, isPending } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentPitchTeam, setCurrentPitchTeam] = useState<Team | null>(null);
  const [votingActive, setVotingActive] = useState(false);
  const [allPitchesCompleted, setAllPitchesCompleted] = useState(false);
  const [voteValue, setVoteValue] = useState<1 | -1>(1);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error' | 'info'>('info');
  const [isLoading, setIsLoading] = useState(false);
  const [isConvertingTokens, setIsConvertingTokens] = useState(false);
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null);
  const [votingStatus, setVotingStatus] = useState<VotingStatus | null>(null);

  // Get user's team from session
  const userTeam = useMemo(() => {
    return session?.user?.team || null;
  }, [session]);

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
        if (!res.ok) throw new Error(`Failed to load teams: ${res.statusText}`);
        
        const data = await res.json();
        setTeams(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading teams:", error);
        showMessage("Failed to load teams", 'error');
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
        if (!res.ok) throw new Error(`Failed to load token status: ${res.statusText}`);
        
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
        if (!res.ok) throw new Error(`Failed to load voting status: ${res.statusText}`);
        
        const data: VotingStatus = await res.json();
        setVotingStatus(data);
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
        if (!res.ok) throw new Error(`Failed to fetch pitch status: ${res.statusText}`);
        
        const data: CurrentPitchData = await res.json();
        setCurrentPitchTeam(data?.team ?? null);
        setVotingActive(data?.votingActive ?? false);
        setAllPitchesCompleted(data?.allPitchesCompleted ?? false);
      } catch (error) {
        console.error("Error polling pitch status:", error);
      }
    };

    const interval = setInterval(pollPitchStatus, 2000);
    pollPitchStatus();
    
    return () => clearInterval(interval);
  }, []);

  // Cast vote function
  const castVote = async () => {
    if (!userTeamId || !currentPitchTeam?.id) {
      showMessage("No team selected or no team currently pitching", 'error');
      return;
    }

    // Prevent voting for own team
    if (userTeamId === currentPitchTeam.id) {
      showMessage("You cannot vote for your own team", 'error');
      return;
    }

    // Check if already voted for this team
    if (votingStatus?.votedTeams.includes(currentPitchTeam.id)) {
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

      if (res.ok && data.success) {
        showMessage(data.message || `Vote recorded successfully (${voteValue === 1 ? 'Yes' : 'No'})`, 'success');
        
        // Refresh voting status
        if (userTeamId) {
          const statusRes = await fetch(`/api/votes?fromTeamId=${userTeamId}`);
          if (statusRes.ok) {
            const statusData = await statusRes.json();
            setVotingStatus(statusData);
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
  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="max-w-md w-full mx-4 rounded-lg border bg-white p-8 text-center">
          <Trophy className="h-12 w-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Authentication Required</h2>
          <p className="mb-4 text-gray-600">
            You need to be signed in with a team account to participate in voting.
          </p>
          <a 
            href="/auth/signin" 
            className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In to Team
          </a>
        </div>
      </div>
    );
  }



  const canVoteForCurrentTeam = currentPitchTeam && 
                               votingActive && 
                               userTeamId !== currentPitchTeam.id &&
                               !votingStatus?.votedTeams.includes(currentPitchTeam.id);

  const canDownvote = voteValue === -1 && votingStatus && votingStatus.remainingDownvotes > 0;

  return (
    <div className="max-w-3xl mx-auto px-6 pt-6">
      <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline mb-4">
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
      <VotingLayout
        header="Team Voting Portal"
        subheader="Peer evaluation • 1 token from each category = 1 vote • Unlimited Yes • Max 3 No"
        teamName={userTeam ? userTeam.name : undefined}
        teamMembers={undefined}
        showRules={true}
      >
      <div className="flex flex-col gap-8 md:flex-row md:gap-12">
        {/* Cast Vote Card */}
        <div className="flex-1 rounded-xl border bg-card p-6 shadow">
          <h2 className="text-xl font-bold mb-4">Cast Your Vote</h2>
          
          {/* Team Info Display */}
          <div className="mb-4 p-3 bg-blue-50 rounded-md border">
            <p className="text-sm text-blue-700">
              <strong>Your Team:</strong> {userTeam ? `${userTeam.name} (#${userTeam.id})` : 'No team'}
            </p>
            {votingStatus && (
              <p className="text-xs text-blue-600 mt-1">
                Votes cast: {votingStatus.votescast.length} | Downvotes remaining: {votingStatus.remainingDownvotes}
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
              {votingStatus?.votedTeams.includes(currentPitchTeam.id) && (
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
            className="w-full rounded-md bg-primary px-4 py-2 text-base font-bold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Submitting..." : "Submit Vote"}
          </button>

          {!votingActive && (
            <div className="mt-2 text-xs text-gray-500">
              Voting will be enabled by admin during each pitch.
            </div>
          )}
        </div>

        {/* Convert Tokens Card */}
        <div className="flex-1 rounded-xl border bg-card p-6 shadow">
          <h2 className="text-xl font-bold mb-4">Convert Tokens</h2>
          <p className="mb-4 text-sm text-gray-600">
            Convert 1 token from each category (Marketing, Capital, Team, Strategy) to get 1 vote.
          </p>
          
          {tokenStatus && (
            <div className="mb-4 p-3 bg-gray-50 rounded-md text-sm">
              <h4 className="font-medium mb-2">Available Tokens:</h4>
              <div className="grid grid-cols-2 gap-2">
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
            className="w-full rounded-md bg-purple-600 px-4 py-2 text-base font-bold text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isConvertingTokens ? "Converting..." : "Convert Tokens → Vote"}
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
              <div className="text-2xl font-bold text-blue-600">{votingStatus.votescast.length}</div>
              <div className="text-sm text-blue-700">Total Votes Cast</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-md">
              <div className="text-2xl font-bold text-green-600">
                {votingStatus.votescast.filter(v => v.value === 1).length}
              </div>
              <div className="text-sm text-green-700">Yes Votes</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-md">
              <div className="text-2xl font-bold text-red-600">{votingStatus.downvoteCount}</div>
              <div className="text-sm text-red-700">No Votes ({votingStatus.remainingDownvotes} remaining)</div>
            </div>
          </div>
          
          {votingStatus.votescast.length > 0 && (
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