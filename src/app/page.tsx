"use client"

import Image from "next/image";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

export default function HomePage() {
  const { data: session, isPending } = useSession();
  const isSignedIn = !!session?.user;
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="flex flex-col items-start gap-6">
            <span className="inline-flex items-center rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground ring-1 ring-border">Entrepreneurship Club • College Event</span>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              Techpreneur Summit 3.0
            </h1>
            <p className="max-w-2xl text-muted-foreground">
              Build, pitch, and compete across 3 rounds over 2 days. Form a team of 5 with 1 leader, conquer the token-based quiz, win the crowd in voting, and seal the deal in the final with peer and judge scores.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/sign-up" className="inline-flex items-center rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90">
                Register Your Team
              </Link>
              <Link href="/sign-in" className="inline-flex items-center rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-accent">
                Sign In
              </Link>
              <Link href="/scoreboard" className="inline-flex items-center rounded-md border border-border px-5 py-2.5 text-sm font-medium hover:bg-accent">
                View Scoreboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Event Highlights */}
      <section className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Round 1: Quiz", desc: "15 questions • 30 mins • Max 60 pts • Token trade-offs per option (Marketing, Capital, Team, Strategy)." },
            { title: "Round 2: Voting", desc: "2-min pitch • 30s team voting • Leaders vote • Max 3 downvotes across all votes • Convert 1 token per category → 1 vote." },
            { title: "Round 3: Finals", desc: "5-min pitch • Teams rate 3–10 (integer) • Judges score • Tie-breaker uses original votes only." },
            { title: "Team Structure", desc: "Each team has 5 members including exactly 1 leader who handles submissions and votes." },
          ].map((c) => (
            <div key={c.title} className="rounded-lg border border-border bg-card p-5">
              <h3 className="text-lg font-semibold">{c.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Links - Only show competition portals if signed in */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {!isSignedIn && (
            <>
              <Link href="/sign-up" className="group rounded-lg border border-border p-6 hover:bg-accent">
                <h4 className="font-semibold">Register Your Team</h4>
                <p className="mt-2 text-sm text-muted-foreground">Sign up to participate in the event.</p>
              </Link>
              <Link href="/sign-in" className="group rounded-lg border border-border p-6 hover:bg-accent">
                <h4 className="font-semibold">Sign In</h4>
                <p className="mt-2 text-sm text-muted-foreground">Access your dashboard and competition portals.</p>
              </Link>
              <Link href="/scoreboard" className="group rounded-lg border border-border p-6 hover:bg-accent">
                <h4 className="font-semibold">View Scoreboard</h4>
                <p className="mt-2 text-sm text-muted-foreground">See team rankings and scores.</p>
              </Link>
            </>
          )}
            {/* Competition links are now only visible in dashboard after login */}
            {isSignedIn && (
              <>
                {/* Competition links are now only visible in dashboard after login */}
              </>
            )}
          <Link href="/admin" className="group rounded-lg border border-border p-6 hover:bg-accent">
            <h4 className="font-semibold">Admin Console</h4>
            <p className="mt-2 text-sm text-muted-foreground">Control round status, manage questions, and oversee the event.</p>
          </Link>
          <Link href="/judge" className="group rounded-lg border border-border p-6 hover:bg-accent">
            <h4 className="font-semibold">Judge Console</h4>
            <p className="mt-2 text-sm text-muted-foreground">Score team presentations and evaluate final round performances.</p>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border bg-card/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Techpreneur Summit 3.0 • Entrepreneurship Club</p>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/sign-in" className="hover:underline">Sign In</Link>
            <Link href="/sign-up" className="hover:underline">Sign Up</Link>
            <Link href="/scoreboard" className="hover:underline">Scoreboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}