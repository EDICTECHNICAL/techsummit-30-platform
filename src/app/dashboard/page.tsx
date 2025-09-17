"use client"

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

export default function DashboardPage() {
  const { data: session, isPending, refetch } = useSession();
  const [teams, setTeams] = useState<any[]>([]);
  const [myTeam, setMyTeam] = useState<any | null>(null);
  const [invites, setInvites] = useState<any[]>([]);
  const [form, setForm] = useState({ name: "", college: "" });
  const [inviteEmail, setInviteEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const isLeader = useMemo(() => session?.user?.roles?.includes?.("LEADER") ?? false, [session]);

  const bearer = () => ({ Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem("bearer_token") : ""}` });

  const loadTeams = async () => {
    try {
      const res = await fetch("/api/teams", { headers: bearer() as any });
      const data = await res.json();
      if (Array.isArray(data)) setTeams(data);
      // detect my team by membership
      const mine = data.find((t: any) => t.members?.some?.((m: any) => m.userId === session?.user?.id));
      setMyTeam(mine || null);
    } catch (e: any) {
      setError(e?.message || "Failed to load teams");
    }
  };

  const loadInvites = async () => {
    try {
      const res = await fetch("/api/team-invites", { headers: bearer() as any });
      const data = await res.json();
      if (Array.isArray(data)) setInvites(data);
    } catch (e: any) {
      // ignore silently
    }
  };

  useEffect(() => {
    if (session?.user) {
      loadTeams();
      loadInvites();
    }
  }, [session?.user]);

  const createTeam = async () => {
    setLoading(true); setError(null); setMsg(null);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(bearer() as any) },
        body: JSON.stringify({ name: form.name, college: form.college })
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

  const sendInvite = async () => {
    if (!myTeam?.id) { setError("No team found"); return; }
    setLoading(true); setError(null); setMsg(null);
    try {
      const res = await fetch("/api/team-invites", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(bearer() as any) },
        body: JSON.stringify({ teamId: myTeam.id, email: inviteEmail })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to send invite");
      setMsg(`Invite sent to ${data.email}`);
      setInviteEmail("");
      await loadInvites();
    } catch (e: any) {
      setError(e?.message || "Failed to send invite");
    } finally {
      setLoading(false);
    }
  };

  const acceptInvite = async (inviteId: number) => {
    setLoading(true); setError(null); setMsg(null);
    try {
      const res = await fetch("/api/team-invites/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(bearer() as any) },
        body: JSON.stringify({ inviteId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to accept invite");
      setMsg("Invite accepted. You joined a team.");
      await Promise.all([loadTeams(), loadInvites()]);
    } catch (e: any) {
      setError(e?.message || "Failed to accept invite");
    } finally {
      setLoading(false);
    }
  };

  const declineInvite = async (inviteId: number) => {
    setLoading(true); setError(null); setMsg(null);
    try {
      const res = await fetch("/api/team-invites/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(bearer() as any) },
        body: JSON.stringify({ inviteId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Failed to decline invite");
      setMsg("Invite declined.");
      await loadInvites();
    } catch (e: any) {
      setError(e?.message || "Failed to decline invite");
    } finally {
      setLoading(false);
    }
  };

  if (isPending) return <div className="p-6">Loading...</div>;
  if (!session?.user) return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <p>Please sign in to manage your team.</p>
      <div className="mt-2 flex gap-3 text-sm">
        <Link className="underline" href="/sign-in">Sign in</Link>
        <Link className="underline" href="/sign-up">Create account</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Welcome, {session.user.name || session.user.email}</p>
      </div>

      {error && <p className="mt-4 rounded-md bg-destructive/10 px-3 py-2 text-destructive text-sm">{error}</p>}
      {msg && <p className="mt-4 rounded-md border border-border bg-card px-3 py-2 text-sm">{msg}</p>}

      {/* Competition Portals */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold">Competition Portals</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/quiz" className="group rounded-lg border border-border p-4 hover:bg-accent">
            <h4 className="font-medium">Quiz Portal</h4>
            <p className="mt-1 text-sm text-muted-foreground">Start or resume the 30-minute quiz when active.</p>
          </Link>
          <Link href="/voting" className="group rounded-lg border border-border p-4 hover:bg-accent">
            <h4 className="font-medium">Voting Arena</h4>
            <p className="mt-1 text-sm text-muted-foreground">Leaders vote. Convert tokens to votes.</p>
          </Link>
          <Link href="/final" className="group rounded-lg border border-border p-4 hover:bg-accent">
            <h4 className="font-medium">Finals Stage</h4>
            <p className="mt-1 text-sm text-muted-foreground">Peer ratings (3–10) and judges' scores.</p>
          </Link>
        </div>
      </section>

      {/* My Team */}
      <section className="mt-6">
        <h2 className="text-lg font-semibold">My Team</h2>
        {myTeam ? (
          <div className="mt-3 rounded-lg border border-border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-medium">{myTeam.name} <span className="text-xs text-muted-foreground">(#{myTeam.id})</span></p>
                <p className="text-sm text-muted-foreground">{myTeam.college}</p>
              </div>
              <div className="text-sm">Members: {myTeam.memberCount}</div>
            </div>
            <ul className="mt-3 list-disc pl-5 text-sm">
              {myTeam.members?.map((m: any) => (
                <li key={m.userId}>{m.name || m.email} — <span className="uppercase text-xs">{m.role}</span></li>
              ))}
            </ul>

            {isLeader && (
              <div className="mt-4 rounded-md border border-border p-3">
                <h3 className="font-medium text-sm">Invite Member</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e)=>setInviteEmail(e.target.value)}
                    placeholder="member@email.com"
                    className="w-64 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  />
                  <button disabled={loading || !inviteEmail}
                    onClick={sendInvite}
                    className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50">
                    Send Invite
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">You are not in a team yet.</p>
        )}
      </section>

      {/* Create Team */}
      {!myTeam && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold">Register Your Team</h2>
          <p className="text-sm text-muted-foreground">Create a new team. You will be set as the leader.</p>
          <div className="mt-3 grid gap-3 sm:max-w-lg">
            <div>
              <label className="text-sm">Team Name</label>
              <input
                value={form.name}
                onChange={(e)=>setForm((f)=>({...f, name: e.target.value}))}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="e.g., InnovateTech Solutions"
              />
            </div>
            <div>
              <label className="text-sm">College</label>
              <input
                value={form.college}
                onChange={(e)=>setForm((f)=>({...f, college: e.target.value}))}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                placeholder="Your college name"
              />
            </div>
            <button
              disabled={loading || !form.name || !form.college}
              onClick={createTeam}
              className="inline-flex w-fit items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {loading ? "Creating..." : "Create Team"}
            </button>
          </div>
        </section>
      )}

      {/* Invites for me */}
      <section className="mt-10">
        <h2 className="text-lg font-semibold">My Invites</h2>
        {invites.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No invites yet.</p>
        ) : (
          <div className="mt-3 grid gap-3 sm:max-w-xl">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between rounded-md border border-border bg-card p-3 text-sm">
                <div>
                  <p>Team: <span className="font-medium">{inv.teamName}</span></p>
                  <p className="text-muted-foreground">Status: {inv.status}</p>
                </div>
                {inv.status === "PENDING" ? (
                  <div className="flex items-center gap-2">
                    <button disabled={loading} onClick={() => acceptInvite(inv.id)} className="rounded-md bg-primary px-3 py-1 text-primary-foreground">Accept</button>
                    <button disabled={loading} onClick={() => declineInvite(inv.id)} className="rounded-md border border-border px-3 py-1">Decline</button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">{inv.status}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <Link href="/scoreboard" className="text-sm underline">View Scoreboard</Link>
      </section>
    </div>
  );
}