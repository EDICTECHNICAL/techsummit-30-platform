"use client"

import { useState, useEffect } from "react";
import { useSession } from "@/lib/auth-client";

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

export default function FinalPage() {
  const { data: session, isPending } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [myRatings, setMyRatings] = useState<PeerRating[]>([]);
  const [qualifiedTeams, setQualifiedTeams] = useState<any[]>([]);
  const [nonQualifiedTeams, setNonQualifiedTeams] = useState<any[]>([]);
  const [isQualified, setIsQualified] = useState<boolean>(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'rate' | 'judge' | 'status'>('status');

  // Round completion tracking
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [votingCompleted, setVotingCompleted] = useState<boolean>(false);
  const [roundsLoading, setRoundsLoading] = useState<boolean>(true);

  // Rating form state
  const [toTeamId, setToTeamId] = useState<number | null>(null);
  const [rating, setRating] = useState<number>(7);

  // Judge form state
  const [judgeTeamId, setJudgeTeamId] = useState<number | null>(null);
  const [judgeScore, setJudgeScore] = useState<number>(80);
  const [judgeName, setJudgeName] = useState<string>('');

  const userTeamId = session?.user?.team?.id;
  const isAdmin = session?.user?.isAdmin;

  useEffect(() => {
    loadData();
    checkRoundCompletion();
  }, [session]);

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
      setMsg("Please select a team and provide a rating between 3-10");
      return;
    }

    if (userTeamId === toTeamId) {
      setMsg("Cannot rate your own team");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/final/ratings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          fromTeamId: userTeamId, 
          toTeamId, 
          rating 
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        setMsg(`Successfully rated team with ${rating}/10`);
        setToTeamId(null);
        setRating(7);
        // Reload ratings
        const ratingsRes = await fetch(`/api/final/ratings?fromTeamId=${userTeamId}`);
        if (ratingsRes.ok) {
          const ratingsData = await ratingsRes.json();
          setMyRatings(ratingsData.ratings || []);
        }
      } else {
        setMsg(data?.error || "Failed to submit rating");
      }
    } catch (error) {
      setMsg("Failed to submit rating");
    } finally {
      setLoading(false);
    }
  };

  const submitJudgeScore = async () => {
    if (!judgeTeamId || !judgeScore || !judgeName.trim()) {
      setMsg("Please fill in all judge score fields");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/judges/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          judgeName: judgeName.trim(), 
          teamId: judgeTeamId, 
          score: judgeScore 
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        setMsg(`Judge score submitted successfully: ${judgeScore} points`);
        setJudgeTeamId(null);
        setJudgeScore(80);
      } else {
        setMsg(data?.error || "Failed to submit judge score");
      }
    } catch (error) {
      setMsg("Failed to submit judge score");
    } finally {
      setLoading(false);
    }
  };

  if (isPending || loading || roundsLoading) return <div className="p-6">Loading...</div>;
  if (!session?.user) return <div className="p-6">Please sign in to access the final round.</div>;

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

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Round 3: Finals</h1>
            <p className="text-muted-foreground">
              {qualifiedTeams.length > 0 
                ? `Top 5 qualified teams compete in the final round. ${teams.length - 5} teams in spectator mode.`
                : "Submit 5-minute pitch presentations, rate peer teams (3-10), and receive judge scores."
              }
            </p>
          </div>
          <a 
            href="/dashboard" 
            className="bg-secondary hover:bg-secondary/80 text-secondary-foreground px-4 py-2 rounded-md text-sm font-medium transition-colors"
          >
            ← Back to Dashboard
          </a>
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
          {userTeamId && isQualified && (
            <button 
              onClick={() => setActiveTab('rate')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'rate' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
              }`}
            >
              Rate Teams
            </button>
          )}
          {isAdmin && (
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
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Submit Peer Rating</h2>
              {unratedTeams.length > 0 ? (
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Select Team to Rate</label>
                    <select 
                      value={toTeamId || ''} 
                      onChange={(e) => setToTeamId(e.target.value ? parseInt(e.target.value) : null)}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                    >
                      <option value="">Choose a team...</option>
                      {unratedTeams.map(team => (
                        <option key={team.id} value={team.id}>
                          {team.name} ({team.college})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Rating (3-10)</label>
                    <input 
                      type="number" 
                      min={3} 
                      max={10} 
                      value={rating} 
                      onChange={(e) => setRating(parseInt(e.target.value))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      3 = Poor, 10 = Excellent
                    </p>
                  </div>
                  <div className="flex items-end">
                    <button 
                      onClick={submitRating}
                      disabled={loading || !toTeamId || rating < 3 || rating > 10}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium disabled:opacity-50"
                    >
                      {loading ? 'Submitting...' : 'Submit Rating'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800">
                    {availableTeams.length === 0 
                      ? "No other teams available to rate."
                      : "You have rated all available teams."}
                  </p>
                </div>
              )}
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
        {activeTab === 'judge' && isAdmin && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Judges Panel (Admin Only)</h2>
            <p className="text-muted-foreground mb-6">
              Submit scores for team presentations. Only admins can access this panel.
            </p>
            
            <div className="grid gap-4 md:grid-cols-4">
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
                <label className="block text-sm font-medium mb-2">Team</label>
                <select 
                  value={judgeTeamId || ''} 
                  onChange={(e) => setJudgeTeamId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="">Select team...</option>
                  {teams.map(team => (
                    <option key={team.id} value={team.id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Score (Integer)</label>
                <input 
                  type="number" 
                  value={judgeScore} 
                  onChange={(e) => setJudgeScore(parseInt(e.target.value) || 0)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                />
              </div>
              <div className="flex items-end">
                <button 
                  onClick={submitJudgeScore}
                  disabled={loading || !judgeTeamId || !judgeScore || !judgeName.trim()}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-md font-medium disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : 'Submit Score'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Message Display */}
        {msg && (
          <div className={`mt-6 rounded-lg border p-4 ${
            msg.includes('Successfully') || msg.includes('✅') 
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
        </div>
      </div>
    </div>
  );
}