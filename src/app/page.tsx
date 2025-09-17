"use client"

import Image from "next/image";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1518779578993-ec3579fee39f?q=80&w=1974&auto=format&fit=crop"
          alt="Tech innovation background"
          width={2400}
          height={1200}
          priority
          className="absolute inset-0 h-full w-full object-cover opacity-20"
        />
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

      {/* Quick Links */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Link href="/quiz" className="group rounded-lg border border-border p-6 hover:bg-accent">
            <h4 className="font-semibold">Quiz Portal</h4>
            <p className="mt-2 text-sm text-muted-foreground">Leaders can start the 30-minute quiz when Round 1 is active.</p>
          </Link>
          <Link href="/voting" className="group rounded-lg border border-border p-6 hover:bg-accent">
            <h4 className="font-semibold">Voting Arena</h4>
            <p className="mt-2 text-sm text-muted-foreground">Cast votes post-pitches. Max 3 downvotes per team. Convert tokens → votes.</p>
          </Link>
          <Link href="/final" className="group rounded-lg border border-border p-6 hover:bg-accent">
            <h4 className="font-semibold">Finals Stage</h4>
            <p className="mt-2 text-sm text-muted-foreground">Rate peers (3–10) and track judge scores during Round 3.</p>
          </Link>
          <Link href="/admin" className="group rounded-lg border border-border p-6 hover:bg-accent">
            <h4 className="font-semibold">Admin Console</h4>
            <p className="mt-2 text-sm text-muted-foreground">Control round status, manage questions, and oversee the event.</p>
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