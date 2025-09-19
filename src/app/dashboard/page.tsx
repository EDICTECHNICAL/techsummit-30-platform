"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { CircleLoader } from "@/components/CircleLoader";
import { useTheme } from "@/components/ThemeProvider";

interface User {
  id: string;
  name: string;
  username: string;
  isAdmin: boolean;
  team?: {
    id: number;
    name: string;
    college: string;
    role: string;
  } | null;
}

interface Team {
  id: number;
  name: string;
  college: string;
  leader: {
    userId: string;
    name: string;
    username: string;
  } | null;
}

export default function DashboardPage() {
  const { theme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [isPending, setIsPending] = useState(true);
  const [team, setTeam] = useState<Team | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [votingCompleted, setVotingCompleted] = useState(false);
  const [finalCompleted, setFinalCompleted] = useState(false);
  const [roundStatuses, setRoundStatuses] = useState<{
    quiz: { status: string; isActive: boolean };
    voting: { status: string; isActive: boolean };
    final: { status: string; isActive: boolean };
  }>({
    quiz: { status: 'PENDING', isActive: false },
    voting: { status: 'PENDING', isActive: false },
    final: { status: 'PENDING', isActive: false }
  });
  const router = useRouter();

  useEffect(() => {
    setIsPending(true);
    // Read user from localStorage after login
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

  // Check if user is a team leader
  const isLeader = useMemo(() => {
    return user?.team?.role === 'LEADER';
  }, [user]);

  const checkRoundStatuses = async () => {
    try {
      const res = await fetch("/api/rounds");
      if (res.ok) {
        const rounds = await res.json();
        const quiz = rounds.find((r: any) => r.name === 'QUIZ');
        const voting = rounds.find((r: any) => r.name === 'VOTING');
        const final = rounds.find((r: any) => r.name === 'FINAL');
        
        setQuizCompleted(quiz?.status === 'COMPLETED' || quiz?.isCompleted || false);
        setVotingCompleted(voting?.status === 'COMPLETED' || voting?.isCompleted || false);
        setFinalCompleted(final?.status === 'COMPLETED' || final?.isCompleted || false);
        
        setRoundStatuses({
          quiz: { 
            status: quiz?.status || 'PENDING', 
            isActive: quiz?.status === 'ACTIVE' || quiz?.isActive || false 
          },
          voting: { 
            status: voting?.status || 'PENDING', 
            isActive: voting?.status === 'ACTIVE' || voting?.isActive || false 
          },
          final: { 
            status: final?.status || 'PENDING', 
            isActive: final?.status === 'ACTIVE' || final?.isActive || false 
          }
        });
      }
    } catch (e) {
      console.error("Failed to check round statuses:", e);
    }
  };

  const loadTeam = async () => {
    try {
      // If user already has team info, use it
      if (user?.team) {
        setTeam({
          id: user.team.id,
          name: user.team.name,
          college: user.team.college,
          leader: {
            userId: user.id,
            name: user.name,
            username: user.username
          }
        });
        return;
      }

      // Otherwise fetch from API
      const res = await fetch("/api/teams");
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const data = await res.json();
      if (Array.isArray(data) && user) {
        // Find the team where the user is the leader
        const myTeam = data.find((t: Team) => 
          t.leader?.userId === user.id || t.leader?.username === user.username
        );
        setTeam(myTeam || null);
      }
    } catch (e: any) {
      console.error("Failed to load team:", e);
      setError(e?.message || "Failed to load team");
    }
  };

  useEffect(() => {
    if (user) {
      loadTeam();
      checkRoundStatuses();
      
      // Set up periodic refresh for round statuses
      const interval = setInterval(checkRoundStatuses, 5000); // Refresh every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [user]);

  if (isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
        <CircleLoader size={64} color={theme === "dark" ? "#fff" : "#2563eb"} />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <p>Please sign in to access your dashboard.</p>
        <div className="mt-4 flex gap-3 text-sm">
          <Link className="underline hover:no-underline" href="/sign-in">
            Sign in
          </Link>
          <Link className="underline hover:no-underline" href="/sign-up">
            Create account
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6 relative">
      <DashboardNavbar />
      
      <div className="pt-20 overflow-y-auto h-[calc(100vh-5rem)]">
        <div className="flex flex-col gap-2 items-start max-w-4xl mx-auto">
          {/* Welcome Card */}
          <div className="w-full rounded-2xl bg-white/10 backdrop-blur-lg shadow-2xl border border-gray-200/20 px-10 py-8 mb-6" style={{ boxShadow: "0 8px 32px 0 rgba(30,32,38,0.18)" }}>
            <h1 className={`text-4xl font-extrabold tracking-tight mb-2 ${theme === "dark" ? "text-white" : "text-black"}`} style={{ letterSpacing: "-0.02em" }}>
              Dashboard
            </h1>
            <p className={`text-lg mt-2 ${theme === "dark" ? "text-blue-400" : "text-blue-700"}`}>
              Welcome, <span className={`font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}>
                {user.name || user.username}
              </span>
              {(user.team || team) && (
                <>
                  <br />
                  <span className="font-medium">Team:</span> {user.team?.name || team?.name}
                  {' '}
                  <span className="font-medium">College:</span> {user.team?.college || team?.college}
                  {isLeader && (
                    <>
                      <br />
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium mt-2 ${theme === "dark" ? "bg-green-900/20 text-green-400" : "bg-green-100 text-green-800"}`}>
                        Team Leader
                      </span>
                    </>
                  )}
                </>
              )}
            </p>
          </div>

          {/* Error Messages */}
          {error && (
            <div className={`w-full mt-2 rounded-xl bg-red-400/10 px-5 py-4 text-base border border-red-400/20 shadow-lg ${theme === "dark" ? "text-red-400" : "text-red-700"}`}>
              {error}
              <button 
                onClick={() => setError(null)}
                className="ml-2 underline text-sm hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          )}
          
          {/* Success Messages */}
          {msg && (
            <div className={`w-full mt-2 rounded-xl border border-blue-400/20 bg-blue-400/10 px-5 py-4 text-base shadow-lg ${theme === "dark" ? "text-blue-400" : "text-blue-700"}`}>
              {msg}
              <button 
                onClick={() => setMsg(null)}
                className="ml-2 underline text-sm hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Competition Portals */}
        <section className="mt-6 max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">Competition Portals</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/quiz" className="group rounded-lg border border-border p-6 hover:bg-accent transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <h4 className="font-semibold">Quiz Portal</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {isLeader 
                  ? "Take the 30-minute quiz when the round is active. Leader access only."
                  : "Quiz access is restricted to team leaders only."
                }
              </p>
              {!isLeader && (
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 mt-2">
                  Leader Only
                </span>
              )}
            </Link>

            <Link href="/voting" className="group rounded-lg border border-border p-6 hover:bg-accent transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <h4 className="font-semibold">Voting Arena</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {isLeader 
                  ? "Vote for other teams and convert tokens to votes. Leader access only."
                  : "Voting access is restricted to team leaders only."
                }
              </p>
              {!isLeader && (
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 mt-2">
                  Leader Only
                </span>
              )}
            </Link>

            <Link href="/final" className="group rounded-lg border border-border p-6 hover:bg-accent transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <h4 className="font-semibold">Finals Stage</h4>
              </div>
              <p className="text-sm text-muted-foreground">
                {isLeader 
                  ? "Submit peer ratings (3-10) and view judge scores. Leader access only."
                  : "Finals access is restricted to team leaders only."
                }
              </p>
              {!isLeader && (
                <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 mt-2">
                  Leader Only
                </span>
              )}
            </Link>
          </div>
        </section>

        {/* Team Leader Information */}
        {(user.team || team) && (
          <section className="mt-8 max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-4">Team Leader</h2>
            <div className="rounded-lg border border-border bg-card p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Team Name</h3>
                  <p className="text-lg">{user.team?.name || team?.name}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">College</h3>
                  <p className="text-lg">{user.team?.college || team?.college}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Leader Name</h3>
                  <p className="text-lg">{user.name}</p>
                </div>
                <div>
                  <h3 className="font-medium text-sm text-muted-foreground">Team ID</h3>
                  <p className="text-lg">{user.team?.id || team?.id}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Competition Status */}
        <section className="mt-8 max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Competition Status</h2>
            <button 
              onClick={checkRoundStatuses}
              className="inline-flex items-center rounded-md border border-border px-3 py-1 text-sm hover:bg-accent transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
          <div className="bg-card text-card-foreground p-6 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  roundStatuses.quiz.status === 'COMPLETED' ? 'bg-green-500' : 
                  roundStatuses.quiz.status === 'ACTIVE' ? 'bg-blue-500' : 
                  'bg-gray-400'
                }`}></div>
                <div>
                  <h3 className="font-medium">Quiz Round</h3>
                  <p className="text-sm text-muted-foreground">
                    {roundStatuses.quiz.status === 'COMPLETED' ? 'Completed' : 
                     roundStatuses.quiz.status === 'ACTIVE' ? 'Active Now' : 
                     'Pending'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  roundStatuses.voting.status === 'COMPLETED' ? 'bg-green-500' : 
                  roundStatuses.voting.status === 'ACTIVE' ? 'bg-blue-500' : 
                  'bg-gray-400'
                }`}></div>
                <div>
                  <h3 className="font-medium">Voting Round</h3>
                  <p className="text-sm text-muted-foreground">
                    {roundStatuses.voting.status === 'COMPLETED' ? 'Completed' : 
                     roundStatuses.voting.status === 'ACTIVE' ? 'Active Now' : 
                     'Pending'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  roundStatuses.final.status === 'COMPLETED' ? 'bg-green-500' : 
                  roundStatuses.final.status === 'ACTIVE' ? 'bg-blue-500' : 
                  'bg-gray-400'
                }`}></div>
                <div>
                  <h3 className="font-medium">Final Round</h3>
                  <p className="text-sm text-muted-foreground">
                    {roundStatuses.final.status === 'COMPLETED' ? 'Completed' : 
                     roundStatuses.final.status === 'ACTIVE' ? 'Active Now' : 
                     'Pending'}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground">
              Status updates automatically every 5 seconds
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="mt-8 max-w-4xl mx-auto">
          <h2 className="text-xl font-semibold mb-4">Quick Links</h2>
          <div className="flex flex-wrap gap-3">
            <Link href="/scoreboard" className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm hover:bg-accent transition-colors">
              View Scoreboard
            </Link>
            <Link href="/rules" className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm hover:bg-accent transition-colors">
              Competition Rules
            </Link>
            {user.isAdmin && (
              <Link href="/admin" className="inline-flex items-center rounded-md border border-border px-3 py-2 text-sm hover:bg-accent transition-colors bg-primary text-primary-foreground">
                Admin Panel
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}