"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { DashboardNavbar } from "@/components/DashboardNavbar";
import { CircleLoader } from "@/components/CircleLoader";
import { useTheme } from "@/components/ThemeProvider";

export default function DashboardPage() {
  const { theme, setTheme } = useTheme();
  const handleToggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");
  const [user, setUser] = useState<any | null>(null);
  const [isPending, setIsPending] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setIsPending(true);
    // Read user from localStorage after login
    const stored = localStorage.getItem("user");
    if (stored) {
      setUser(JSON.parse(stored));
    } else {
      setUser(null);
    }
    setIsPending(false);
  }, [router]);

  const [team, setTeam] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Replace with your own logic for leader role if needed
  const isLeader = useMemo(() => false, [user]);

  const bearer = () => ({
    Authorization: `Bearer ${
      typeof window !== "undefined" ? localStorage.getItem("bearer_token") : ""
    }`,
  });

  const loadTeam = async () => {
    try {
      const res = await fetch("/api/teams", { headers: bearer() as any });
      const data = await res.json();
      if (Array.isArray(data) && user) {
        // Find the team where the user is the leader or matches username
        const myTeam = data.find((t: any) => t.leader?.userId === user.id || t.leader?.username === user.username);
        setTeam(myTeam || null);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load team");
    }
  };


  useEffect(() => {
    if (user) {
      loadTeam();
    }
  }, [user]);

  // Team creation removed




  if (isPending) return <div className="flex items-center justify-center min-h-screen bg-background text-foreground"><CircleLoader size={64} color={theme === "dark" ? "#fff" : "#2563eb"} /></div>;
  if (!user)
    return (
      <div className="min-h-screen bg-background text-foreground p-6">
        <p>Please sign in to manage your team.</p>
        <div className="mt-2 flex gap-3 text-sm">
          <Link className="underline" href="/sign-in">
            Sign in
          </Link>
          <Link className="underline" href="/sign-up">
            Create account
          </Link>
        </div>
      </div>
    );

  // ✅ The main return stays inside the component now
  return (
    <div className="min-h-screen bg-background text-foreground p-6 relative">
  <DashboardNavbar onToggleTheme={handleToggleTheme} />
      <div className="pt-20 overflow-y-auto h-[calc(100vh-5rem)]">
        <div className="flex flex-col gap-2 items-start max-w-4xl mx-auto">
          <div className="w-full rounded-2xl bg-white/10 backdrop-blur-lg shadow-2xl border border-gray-200/20 px-10 py-8 mb-6" style={{ boxShadow: "0 8px 32px 0 rgba(30,32,38,0.18)" }}>
            <h1 className={`text-4xl font-extrabold tracking-tight mb-2 ${theme === "dark" ? "text-white" : "text-black"}`} style={{ letterSpacing: "-0.02em" }}>Dashboard</h1>
            <p className={`text-lg mt-2 ${theme === "dark" ? "text-blue-400" : "text-blue-700"}`}>
              Welcome, <span className={`font-semibold ${theme === "dark" ? "text-white" : "text-black"}`}>{user.name || user.username}</span>
              {team && (
                <>
                  <br />
                  <span className="font-medium">Team:</span> {team.name} <span className="font-medium">College:</span> {team.college}
                </>
              )}
            </p>
          </div>

          {error && (
            <p className={`mt-2 rounded-xl bg-red-400/10 px-5 py-4 text-base border border-red-400/20 shadow-lg ${theme === "dark" ? "text-red-400" : "text-red-700"}`}>
              {error}
            </p>
          )}
          {msg && (
            <p className={`mt-2 rounded-xl border border-blue-400/20 bg-blue-400/10 px-5 py-4 text-base shadow-lg ${theme === "dark" ? "text-blue-400" : "text-blue-700"}`}>
              {msg}
            </p>
          )}
        </div>

      {/* Competition Portals */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold">Competition Portals</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {user ? (
            <>
              <Link href="/quiz" className="group rounded-lg border border-border p-4 hover:bg-accent">
                <h4 className="font-medium">Quiz Portal</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Start or resume the 30-minute quiz when active.
                </p>
              </Link>
              <Link href="/voting" className="group rounded-lg border border-border p-4 hover:bg-accent">
                <h4 className="font-medium">Voting Arena</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Leaders vote. Convert tokens to votes.
                </p>
              </Link>
              <Link href="/final" className="group rounded-lg border border-border p-4 hover:bg-accent">
                <h4 className="font-medium">Finals Stage</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Peer ratings (3–10) and judges' scores.
                </p>
              </Link>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">Please log in to view competition links.</p>
          )}
        </div>
      </section>

      {/* My Team section removed */}

  {/* ...other dashboard content... */}


      <section className="mt-10">
        <Link href="/scoreboard" className="text-sm underline">
          View Scoreboard
        </Link>
      </section>
      {/* ...rest of dashboard content... */}
      </div>
    </div>
  );
}
