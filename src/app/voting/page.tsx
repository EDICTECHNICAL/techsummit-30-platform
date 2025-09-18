"use client"

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Timer, Users, Trophy } from 'lucide-react';
import VotingLayout from '@/components/ui/VotingLayout';
import { useSession } from '@/lib/auth-client';

interface Team {
  id: number;
  name: string;
  members?: any[];
}

interface CurrentPitchData {
  team: Team | null;
  votingActive: boolean;
  allPitchesCompleted: boolean;
}

interface VoteResponse {
  success?: boolean;
  error?: string;
}

type ConversionCategory = "MARKETING" | "CAPITAL" | "TEAM" | "STRATEGY";

export default function VotingPage() {
  const { data: session, isPending } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [fromTeamId, setFromTeamId] = useState<number | null>(null);
  const [currentPitchTeam, setCurrentPitchTeam] = useState<Team | null>(null);
  const [votingActive, setVotingActive] = useState(false);
  const [allPitchesCompleted, setAllPitchesCompleted] = useState(false);
  const [voteValue, setVoteValue] = useState<1 | -1>(1);
  const [convCategory, setConvCategory] = useState<ConversionCategory>("MARKETING");
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConvertingTokens, setIsConvertingTokens] = useState(false);

  // Voting is open to all authenticated users; no leader logic needed

  const currentTeam = useMemo(() => 
    teams.find(t => t.id === fromTeamId), 
    [teams, fromTeamId]
  );

  // Get bearer token from localStorage with error handling
  const getBearerToken = useCallback(() => {
    try {
      return localStorage.getItem("bearer_token");
    } catch (error) {
      console.error("Failed to access localStorage:", error);
      return null;
    }
  }, []);

  // Initialize team ID from session
  useEffect(() => {
    const sessionTeamId = (session as any)?.user?.teamId;
    if (sessionTeamId && !fromTeamId) {
      setFromTeamId(Number(sessionTeamId));
    }
  }, [session, fromTeamId]);

  // Load teams data
  useEffect(() => {
    const loadTeams = async () => {
      if (!session?.user) return;
      
      try {
        const token = getBearerToken();
        if (!token) {
          setMessage("Authentication token not found");
          return;
        }

        const res = await fetch("/api/teams", { 
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!res.ok) {
          throw new Error(`Failed to load teams: ${res.statusText}`);
        }
        
        const data = await res.json();
        setTeams(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading teams:", error);
        setMessage("Failed to load teams");
      }
    };

    loadTeams();
  }, [session?.user, getBearerToken]);

  // Poll current pitch status
  useEffect(() => {
    const pollPitchStatus = async () => {
      try {
        const res = await fetch("/api/voting/current");
        if (!res.ok) {
          throw new Error(`Failed to fetch pitch status: ${res.statusText}`);
        }
        
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
    if (!fromTeamId || !currentPitchTeam?.id) {
      setMessage("No team selected or no team currently pitching");
      return;
    }

    // Prevent voting for own team
    if (fromTeamId === currentPitchTeam.id) {
      setMessage("You cannot vote for your own team");
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const token = getBearerToken();
      if (!token) {
        setMessage("Authentication token not found");
        return;
      }

      const res = await fetch("/api/votes", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          fromTeamId, 
          toTeamId: currentPitchTeam.id, 
          value: voteValue 
        })
      });

      const data: VoteResponse = await res.json();

      if (res.ok) {
        setMessage(`Vote recorded successfully (${voteValue === 1 ? 'Yes' : 'No'})`);
      } else {
        setMessage(data?.error || "Failed to cast vote");
      }
    } catch (error) {
      console.error("Error casting vote:", error);
      setMessage("Network error while casting vote");
    } finally {
      setIsLoading(false);
    }
  };

  // Convert tokens function
  const convertToken = async () => {
    if (!fromTeamId) {
      setMessage("No team detected");
      return;
    }

    if (!allPitchesCompleted) {
      setMessage("Token conversion is only allowed after all pitches are completed");
      return;
    }

    setIsConvertingTokens(true);
    setMessage(null);

    try {
      const token = getBearerToken();
      if (!token) {
        setMessage("Authentication token not found");
        return;
      }

      const res = await fetch("/api/tokens/convert", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ teamId: fromTeamId })
      });

      const data: VoteResponse = await res.json();

      if (res.ok) {
        setMessage("Successfully converted 1 token from each category → 1 vote");
      } else {
        setMessage(data?.error || "Failed to convert tokens");
      }
    } catch (error) {
      console.error("Error converting tokens:", error);
      setMessage("Network error while converting tokens");
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

  return (
    <VotingLayout
      header="Team Voting Portal"
      subheader="Peer evaluation • 1 token from each category = 1 vote • Unlimited Yes • Max 3 No"
      teamName={currentTeam?.name}
      teamMembers={currentTeam?.members?.length}
      showRules={true}
    >
      <div className="flex flex-col gap-8 md:flex-row md:gap-12">
        {/* Cast Vote Card */}
        <div className="flex-1 rounded-xl border bg-card p-6 shadow">
          <h2 className="text-xl font-bold mb-4">Cast Your Vote</h2>
          
          {currentPitchTeam ? (
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">
                Currently Pitching Team
              </label>
              <div className="rounded-md border px-3 py-2 text-lg font-bold bg-primary/80 text-white">
                {currentPitchTeam.name} (#{currentPitchTeam.id})
              </div>
              {fromTeamId === currentPitchTeam.id && (
                <p className="text-sm text-amber-600 mt-1">
                  ⚠️ This is your team - you cannot vote for yourself
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
                disabled={isLoading}
              >
                No
              </button>
            </div>
          </div>

          <button
            onClick={castVote}
            disabled={!votingActive || !currentPitchTeam || isLoading || fromTeamId === currentPitchTeam?.id}
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
          
          <button
            onClick={convertToken}
            disabled={!allPitchesCompleted || isConvertingTokens}
            className="w-full rounded-md bg-purple-600 px-4 py-2 text-base font-bold text-white hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isConvertingTokens ? "Converting..." : "Convert Tokens → Vote"}
          </button>

          {!allPitchesCompleted && (
            <div className="mt-2 text-xs text-gray-500">
              Token conversion will be enabled after all teams have pitched.
            </div>
          )}
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`mt-6 rounded-md border px-4 py-3 text-center font-medium ${
          message.includes("Success") || message.includes("recorded")
            ? "bg-green-50 border-green-200 text-green-800"
            : message.includes("Failed") || message.includes("error") || message.includes("cannot")
            ? "bg-red-50 border-red-200 text-red-800"
            : "bg-blue-50 border-blue-200 text-blue-800"
        }`}>
          {message}
        </div>
      )}
    </VotingLayout>
  );
}