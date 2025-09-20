"use client"

import Image from "next/image";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function HomePage() {
  const { data: session, isPending } = useSession();
  const isSignedIn = !!session?.user;
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Theme Toggle - Fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      
      {/* Hero */}
      <section className="relative overflow-hidden event-hero-bg">
        <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/50 to-transparent"></div>
        <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
          <div className="flex flex-col items-start gap-6">
            <span className="inline-flex items-center rounded-full bg-primary/10 backdrop-blur-sm px-4 py-2 text-sm font-medium text-primary ring-1 ring-primary/20">
              Axios EDIC • Thakur College of Engineering and Technology
            </span>
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
              TECHPRENEUR<br />
              <span className="event-text-gradient">SUMMIT 3.0</span>
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              Real World Problem Solving and Ignite Entrepreneurial Thinking
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6 max-w-3xl">
              <div className="event-card event-card-hover rounded-lg p-6">
                <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                  <span className="text-xl">🎯</span> OBJECTIVES
                </h3>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span> Exposure to Networking Opportunities
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span> Real World Problem Solving
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span> Ignite Entrepreneurial Thinking
                  </li>
                </ul>
              </div>
              <div className="event-card event-card-hover rounded-lg p-6">
                <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                  <span className="text-xl">👥</span> TEAM STRUCTURE
                </h3>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">4-5 Members per team</strong><br />
                  The Startup Strategy League
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/sign-up" className="event-button-primary inline-flex items-center rounded-md px-6 py-3 text-sm font-medium">
                Register Your Team
              </Link>
              <Link href="/sign-in" className="inline-flex items-center rounded-md border border-border bg-card/50 backdrop-blur-sm px-6 py-3 text-sm font-medium hover:bg-accent transition-all duration-300">
                Sign In
              </Link>
              <Link href="/scoreboard" className="inline-flex items-center rounded-md border border-border bg-card/50 backdrop-blur-sm px-6 py-3 text-sm font-medium hover:bg-accent transition-all duration-300">
                View Scoreboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Event Schedule */}
      <section className="event-section-bg mx-auto max-w-6xl px-6 py-12">
        <h2 className="text-3xl font-bold tracking-tight mb-8 text-center event-text-gradient">Event Schedule</h2>
        
        {/* Day 1 */}
        <div className="mb-12">
          <h3 className="text-2xl font-semibold mb-6 text-primary flex items-center gap-2">
            <span className="text-xl">📅</span> DAY 1 - 25 SEPTEMBER
          </h3>
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            <div className="event-card event-card-hover rounded-lg p-6">
              <h4 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                <span className="text-xl">🧠</span> ROUND 1 - QUIZ FOR TOKENS
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Test your knowledge and earn strategic tokens that will be crucial for the next round.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span> 15 questions in 30 minutes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span> Maximum 60 points available
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span> Token trade-offs per option (Marketing, Capital, Team, Strategy)
                </li>
              </ul>
            </div>
            
            <div className="event-card event-card-hover rounded-lg p-6">
              <h4 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                <span className="text-xl">🎤</span> ROUND 2 - 90 SEC PITCH AND VOTING
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Customer Acquiring - Present your idea and win the crowd's vote.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span> 90-second pitch presentation
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span> 30s team voting period
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span> Convert tokens to votes strategically
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span> Maximum 3 downvotes per team
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Day 2 */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-6 text-primary flex items-center gap-2">
            <span className="text-xl">📅</span> DAY 2 - 27 SEPTEMBER
          </h3>
          <div className="grid gap-6 sm:grid-cols-1 lg:grid-cols-2">
            <div className="event-card event-card-hover rounded-lg p-6">
              <h4 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                <span className="text-xl">🏆</span> ROUND 3 - 5 MIN PITCH
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Followed by Q&A and Points Acquisition - Your final chance to impress.
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span> 5-minute comprehensive pitch
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span> Q&A session with judges
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span> Teams rate each other (3-10 scale)
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span> Professional judge scoring
                </li>
              </ul>
            </div>
            
            <div className="event-card event-card-hover rounded-lg p-6">
              <h4 className="text-lg font-semibold text-primary mb-3 flex items-center gap-2">
                <span className="text-xl">🥇</span> ROUND 4 - EVALUATION
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                Points Acquisition, Evaluation and Result Declaration
              </p>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span> Final score calculation
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span> Judge deliberation
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span> Winner announcement
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">•</span> Prize distribution ceremony
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links - Only show competition portals if signed in */}
      <section className="mx-auto max-w-6xl px-6 pb-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {!isSignedIn && (
            <>
              <Link href="/sign-up" className="event-card event-card-hover group rounded-lg p-6">
                <h4 className="font-semibold text-primary">Register Your Team</h4>
                <p className="mt-2 text-sm text-muted-foreground">Sign up to participate in the event.</p>
              </Link>
              <Link href="/sign-in" className="event-card event-card-hover group rounded-lg p-6">
                <h4 className="font-semibold text-primary">Sign In</h4>
                <p className="mt-2 text-sm text-muted-foreground">Access your dashboard and competition portals.</p>
              </Link>
              <Link href="/scoreboard" className="event-card event-card-hover group rounded-lg p-6">
                <h4 className="font-semibold text-primary">View Scoreboard</h4>
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
          <Link href="/admin" className="event-card event-card-hover group rounded-lg p-6">
            <h4 className="font-semibold text-primary">Admin Console</h4>
            <p className="mt-2 text-sm text-muted-foreground">Control round status, manage questions, and oversee the event.</p>
          </Link>
          <Link href="/judge" className="event-card event-card-hover group rounded-lg p-6">
            <h4 className="font-semibold text-primary">Judge Console</h4>
            <p className="mt-2 text-sm text-muted-foreground">Score team presentations and evaluate final round performances.</p>
          </Link>
        </div>
      </section>

      {/* Contact Section */}
      <section className="mx-auto max-w-6xl px-6 py-12 border-t border-border/50">
        <h2 className="text-2xl font-bold tracking-tight mb-8 text-center event-text-gradient">Contact Us</h2>
        <div className="text-center mb-8">
          <p className="text-muted-foreground mb-6">For any queries, reach out to our organizing team:</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
            <div className="event-card event-card-hover rounded-lg p-4">
              <h4 className="font-semibold text-primary">Ayush Pardeshi</h4>
              <p className="text-sm text-muted-foreground">CEO</p>
              <p className="text-sm font-mono text-foreground">8766536270</p>
            </div>
            <div className="event-card event-card-hover rounded-lg p-4">
              <h4 className="font-semibold text-primary">Ahana Kulkarni</h4>
              <p className="text-sm text-muted-foreground">CTO</p>
              <p className="text-sm font-mono text-foreground">8928352406</p>
            </div>
            <div className="event-card event-card-hover rounded-lg p-4">
              <h4 className="font-semibold text-primary">Bhummi Girnara</h4>
              <p className="text-sm text-muted-foreground">COO</p>
              <p className="text-sm font-mono text-foreground">98698 32960</p>
            </div>
            <div className="event-card event-card-hover rounded-lg p-4">
              <h4 className="font-semibold text-primary">Hredey Chaand</h4>
              <p className="text-sm text-muted-foreground">CMO</p>
              <p className="text-sm font-mono text-foreground">9004724466</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Techpreneur Summit 3.0 • Axios EDIC • Thakur College of Engineering and Technology</p>
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