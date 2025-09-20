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
    <div className="min-h-screen bg-background text-foreground mobile-padding relative pb-20 sm:pb-6">
      <DashboardNavbar />
      
      <div className="pt-16 sm:pt-20 overflow-y-auto mobile-scroll">
        <div className="flex flex-col gap-2 items-start max-w-4xl mx-auto">
          {/* Welcome Card */}
          <div className="w-full mobile-card backdrop-blur-lg shadow-2xl mb-4 sm:mb-6" style={{ background: 'var(--event-gradient-primary)', boxShadow: "0 8px 32px 0 rgba(70, 111, 137, 0.3)" }}>
            <h1 className="mobile-title font-extrabold tracking-tight mb-2 text-white" style={{ letterSpacing: "-0.02em" }}>
              TECHPRENEUR SUMMIT 3.0
            </h1>
            <p className="mobile-body mb-4 text-blue-100">
              Real World Problem Solving and Ignite Entrepreneurial Thinking
            </p>
            <p className="mobile-body mt-2 text-blue-100">
              Welcome, <span className="font-semibold text-white">
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
                      <span className="inline-flex items-center rounded-full bg-white/20 text-white px-3 py-1 text-xs font-medium mt-2 backdrop-blur-sm">
                        Team Leader - The Startup Strategy League
                      </span>
                    </>
                  )}
                </>
              )}
            </p>
          </div>

          {/* Error Messages */}
          {error && (
            <div className="w-full mt-2 mobile-card bg-red-500/10 backdrop-blur-sm border border-red-500/20 shadow-lg text-red-600 dark:text-red-400">
              {error}
              <button 
                onClick={() => setError(null)}
                className="ml-2 underline mobile-body hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          )}
          
          {/* Success Messages */}
          {msg && (
            <div className="w-full mt-2 mobile-card border border-green-500/20 bg-green-500/10 backdrop-blur-sm shadow-lg text-green-600 dark:text-green-400">
              {msg}
              <button 
                onClick={() => setMsg(null)}
                className="ml-2 underline mobile-body hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Competition Portals */}
        <section className="mt-4 sm:mt-6 max-w-4xl mx-auto">
          <h2 className="mobile-subtitle mb-4 event-text-gradient">Competition Portals</h2>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            <Link href="/quiz" className="mobile-card group transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <h4 className="font-semibold text-primary">🧠 Round 1: Quiz for Tokens</h4>
              </div>
              <p className="mobile-body text-muted-foreground">
                {isLeader 
                  ? "DAY 1: Earn strategic tokens through 15 questions in 30 minutes. Max 60 points with trade-offs (Marketing, Capital, Team, Strategy)."
                  : "Quiz access is restricted to team leaders only."
                }
              </p>
              {!isLeader && (
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mt-2">
                  Leader Only
                </span>
              )}
            </Link>

            <Link href="/voting" className="mobile-card group transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <h4 className="font-semibold text-primary">🎤 Round 2: 90 Sec Pitch & Voting</h4>
              </div>
              <p className="mobile-body text-muted-foreground">
                {isLeader 
                  ? "DAY 1: Customer Acquiring phase - Deliver 90-second pitch, vote for teams, convert tokens strategically. Max 3 downvotes per team."
                  : "Voting access is restricted to team leaders only."
                }
              </p>
              {!isLeader && (
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mt-2">
                  Leader Only
                </span>
              )}
            </Link>

            <Link href="/final" className="mobile-card group transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <h4 className="font-semibold text-primary">🏆 Round 3: 5 Min Pitch & Evaluation</h4>
              </div>
              <p className="mobile-body text-muted-foreground">
                {isLeader 
                  ? "DAY 2: Comprehensive pitch with Q&A, peer ratings (3-10 scale), judge scoring, and final evaluation."
                  : "Finals access is restricted to team leaders only."
                }
              </p>
              {!isLeader && (
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary mt-2">
                  Leader Only
                </span>
              )}
            </Link>
          </div>
        </section>

        {/* Team Leader Information */}
        {(user.team || team) && (
          <section className="mt-6 sm:mt-8 max-w-4xl mx-auto">
            <h2 className="mobile-subtitle mb-4 event-text-gradient">Team Leader</h2>
            <div className="mobile-card">
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
                <div>
                  <h3 className="font-medium mobile-body text-muted-foreground">Team Name</h3>
                  <p className="text-lg">{user.team?.name || team?.name}</p>
                </div>
                <div>
                  <h3 className="font-medium mobile-body text-muted-foreground">College</h3>
                  <p className="text-lg">{user.team?.college || team?.college}</p>
                </div>
                <div>
                  <h3 className="font-medium mobile-body text-muted-foreground">Leader Name</h3>
                  <p className="text-lg">{user.name}</p>
                </div>
                <div>
                  <h3 className="font-medium mobile-body text-muted-foreground">Team ID</h3>
                  <p className="text-lg">{user.team?.id || team?.id}</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Event Schedule & Competition Status */}
        <section className="mt-6 sm:mt-8 max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <h2 className="mobile-subtitle event-text-gradient">Event Schedule & Competition Status</h2>
            <button 
              onClick={checkRoundStatuses}
              className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 mobile-body hover:bg-accent transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh Status
            </button>
          </div>
          
          {/* Event Dates */}
          <div className="mobile-card mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="text-center">
                <h3 className="font-semibold text-primary mb-2 flex items-center justify-center gap-2">
                  <span>📅</span> DAY 1 - 25 SEPTEMBER
                </h3>
                <p className="mobile-body text-muted-foreground">Quiz for Tokens + 90 Sec Pitch & Voting</p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-primary mb-2 flex items-center justify-center gap-2">
                  <span>📅</span> DAY 2 - 27 SEPTEMBER
                </h3>
                <p className="mobile-body text-muted-foreground">5 Min Pitch + Q&A + Final Evaluation</p>
              </div>
            </div>
          </div>

          {/* Round Status */}
          <div className="mobile-card">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  roundStatuses.quiz.status === 'COMPLETED' ? 'bg-green-500' : 
                  roundStatuses.quiz.status === 'ACTIVE' ? 'bg-blue-500' : 
                  'bg-gray-400'
                }`}></div>
                <div>
                  <h3 className="font-medium text-primary">Round 1: Quiz for Tokens</h3>
                  <p className="mobile-body text-muted-foreground">
                    {roundStatuses.quiz.status === 'COMPLETED' ? 'Completed ✅' : 
                     roundStatuses.quiz.status === 'ACTIVE' ? 'Active Now 🔴' : 
                     'Pending ⏳'}
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
                  <h3 className="font-medium text-primary">Round 2: Pitch & Voting</h3>
                  <p className="mobile-body text-muted-foreground">
                    {roundStatuses.voting.status === 'COMPLETED' ? 'Completed ✅' : 
                     roundStatuses.voting.status === 'ACTIVE' ? 'Active Now 🔴' : 
                     'Pending ⏳'}
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
                  <h3 className="font-medium text-primary">Round 3: Final Evaluation</h3>
                  <p className="mobile-body text-muted-foreground">
                    {roundStatuses.final.status === 'COMPLETED' ? 'Completed ✅' : 
                     roundStatuses.final.status === 'ACTIVE' ? 'Active Now 🔴' : 
                     'Pending ⏳'}
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
        <section className="mt-6 sm:mt-8 max-w-4xl mx-auto mb-4">
          <h2 className="mobile-subtitle mb-4 event-text-gradient">Quick Links</h2>
          <div className="mobile-button-group">
            <Link href="/scoreboard" className="event-button-primary rounded-md px-4 py-2 mobile-body transition-colors">
              View Scoreboard
            </Link>
            <Link href="/rules" className="inline-flex items-center justify-center rounded-md border border-border bg-card/50 backdrop-blur-sm px-4 py-2 mobile-body hover:bg-accent transition-colors min-h-[44px]">
              Competition Rules
            </Link>
            {user.isAdmin && (
              <Link href="/admin" className="inline-flex items-center justify-center rounded-md border border-border px-3 py-2 mobile-body hover:bg-accent transition-colors bg-primary text-primary-foreground min-h-[44px]">
                Admin Panel
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}