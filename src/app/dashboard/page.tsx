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

  const [teams, setTeams] = useState<any[]>([]);
  const [myTeam, setMyTeam] = useState<any | null>(null);
  const [form, setForm] = useState({ name: "", college: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  // Replace with your own logic for leader role if needed
  const isLeader = useMemo(() => false, [user]);

  const bearer = () => ({
    Authorization: `Bearer ${
      typeof window !== "undefined" ? localStorage.getItem("bearer_token") : ""
    }`,
  });

  const loadTeams = async () => {
    try {
      const res = await fetch("/api/teams", { headers: bearer() as any });
      const data = await res.json();
      if (Array.isArray(data)) setTeams(data);

      // detect my team by membership
      const mine = data.find((t: any) =>
      t.members?.some?.((m: any) => m.userId === user?.id)
      );
      setMyTeam(mine || null);
    } catch (e: any) {
      setError(e?.message || "Failed to load teams");
    }
  };


  useEffect(() => {
    if (user) {
      loadTeams();
    }
  }, [user]);

  const createTeam = async () => {
    setLoading(true);
    setError(null);
    setMsg(null);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(bearer() as any) },
        body: JSON.stringify({ name: form.name, college: form.college }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to create team");
      setMsg(`Team created: ${data.name}`);
      setForm({ name: "", college: "" });
      await loadTeams();
    } catch (e: any) {
      setError(e?.message || "Failed to create team");
    } finally {
      setLoading(false);
    }
  };




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

      {/* My Team */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold">My Team</h2>
        {myTeam ? (
          <div className="mt-3 rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">
                  {myTeam.name}{" "}
                  <span className="text-xs text-muted-foreground">
                    (#{myTeam.id})
                  </span>
                </p>
                <p className="text-sm text-muted-foreground">
                  {myTeam.college}
                </p>
              </div>
              <div className="text-sm">Members: {myTeam.memberCount}</div>
            </div>
            <ul className="mt-3 list-disc pl-5 text-sm">
              {myTeam.members?.map((m: any) => (
                <li key={m.userId}>
                  {m.name || m.email} —{" "}
                  <span className="uppercase text-xs">{m.role}</span>
                </li>
              ))}
            </ul>

            {isLeader && (
              <div className="mt-4 rounded-md border border-border p-3">
                <h3 className="font-medium text-sm">Invite Member</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            You are not in a team yet.
          </p>
        )}
      </section>

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
