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

interface FinalPitch {
  id: number;
  teamId: number;
  teamName: string;
  teamCollege: string;
  presentedAt: string;
  createdAt: string;
}

export default function FinalPage() {
  const { data: session, isPending } = useSession();
  const [teams, setTeams] = useState<Team[]>([]);
  const [finalPitches, setFinalPitches] = useState<FinalPitch[]>([]);
  const [myRatings, setMyRatings] = useState<PeerRating[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'rate' | 'register' | 'judge' | 'status'>('status');

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
  }, [session]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load teams
      const teamsRes = await fetch('/api/teams');
      if (teamsRes.ok) {
        const teamsData = await teamsRes.json();
        setTeams(teamsData);
      }

      // Load final pitches
      const pitchesRes = await fetch('/api/final/pitches');
      if (pitchesRes.ok) {
        const pitchesData = await pitchesRes.json();
        setFinalPitches(pitchesData.pitches || []);
      }

      // Load my ratings if user has a team
      if (userTeamId) {
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

  const registerPitch = async () => {
    if (!userTeamId) {
      setMsg("You need to be part of a team to register for final pitch");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/final/pitches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamId: userTeamId })
      });

      const data = await res.json();
      
      if (res.ok) {
        setMsg("Final pitch registered successfully!");
        // Reload pitches
        const pitchesRes = await fetch('/api/final/pitches');
        if (pitchesRes.ok) {
          const pitchesData = await pitchesRes.json();
          setFinalPitches(pitchesData.pitches || []);
        }
      } else {
        setMsg(data?.error || "Failed to register pitch");
      }
    } catch (error) {
      setMsg("Failed to register pitch");
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

  if (isPending || loading) return <div className="p-6">Loading...</div>;
  if (!session?.user) return <div className="p-6">Please sign in to access the final round.</div>;

  const availableTeams = teams.filter(team => team.id !== userTeamId);
  const ratedTeamIds = new Set(myRatings.map(r => r.toTeamId));
  const unratedTeams = availableTeams.filter(team => !ratedTeamIds.has(team.id));
  const myTeamPitch = finalPitches.find(pitch => pitch.teamId === userTeamId);

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-2">Round 3: Finals</h1>
        <p className="text-muted-foreground mb-6">
          Submit 5-minute pitch presentations, rate peer teams (3-10), and receive judge scores.
        </p>

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
          {userTeamId && (
            <>
              <button 
                onClick={() => setActiveTab('register')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'register' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                }`}
              >
                Register Pitch
              </button>
              <button 
                onClick={() => setActiveTab('rate')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'rate' ? 'bg-background shadow-sm' : 'hover:bg-background/50'
                }`}
              >
                Rate Teams
              </button>
            </>
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
            {/* My Team Status */}
            {userTeamId && (
              <div className="rounded-lg border bg-card p-6">
                <h2 className="text-xl font-semibold mb-4">Your Team Status</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Final Pitch Registration:</p>
                    <p className={`text-sm ${myTeamPitch ? 'text-green-600' : 'text-orange-600'}`}>
                      {myTeamPitch ? '✅ Registered' : '❌ Not registered'}
                    </p>
                    {myTeamPitch && (
                      <p className="text-xs text-muted-foreground">
                        Registered: {new Date(myTeamPitch.presentedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
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
              </div>
            )}

            {/* Final Pitches Status */}
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-xl font-semibold mb-4">Final Pitches ({finalPitches.length} teams registered)</h2>
              {finalPitches.length > 0 ? (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {finalPitches.map((pitch) => (
                    <div key={pitch.id} className="rounded-lg border bg-muted p-3">
                      <h3 className="font-medium">{pitch.teamName}</h3>
                      <p className="text-sm text-muted-foreground">{pitch.teamCollege}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Registered: {new Date(pitch.presentedAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">No teams have registered for final pitches yet.</p>
              )}
            </div>

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

        {/* Register Pitch Tab */}
        {activeTab === 'register' && userTeamId && (
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-xl font-semibold mb-4">Register Final Pitch</h2>
            {myTeamPitch ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center">
                  <div className="text-green-600 mr-3">✅</div>
                  <div>
                    <p className="font-medium text-green-800">Your team is already registered for the final pitch</p>
                    <p className="text-sm text-green-600">
                      Registered on: {new Date(myTeamPitch.presentedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-muted-foreground mb-4">
                  Click the button below to register your team for the 5-minute final pitch presentation.
                </p>
                <button 
                  onClick={registerPitch}
                  disabled={loading}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 rounded-md font-medium disabled:opacity-50"
                >
                  {loading ? 'Registering...' : 'Register for Final Pitch'}
                </button>
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