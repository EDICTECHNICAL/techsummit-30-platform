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
        <div className="relative mobile-padding mx-auto max-w-6xl py-12 sm:py-20 lg:py-28">
          <div className="flex flex-col items-start gap-4 sm:gap-6">
            <span className="inline-flex items-center rounded-full bg-primary/10 backdrop-blur-sm px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium text-primary ring-1 ring-primary/20">
              Axios EDIC • Thakur College of Engineering and Technology
            </span>
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold tracking-tight leading-tight">
              TECHPRENEUR<br />
              <span className="event-text-gradient">SUMMIT 3.0</span>
            </h1>
            <p className="max-w-2xl text-base sm:text-lg text-muted-foreground">
              Real World Problem Solving and Ignite Entrepreneurial Thinking
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 my-4 sm:my-6 w-full max-w-3xl">
              <div className="mobile-card">
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
              <div className="mobile-card">
                <h3 className="font-semibold text-primary mb-3 flex items-center gap-2">
                  <span className="text-xl">👥</span> TEAM STRUCTURE
                </h3>
                <p className="text-sm text-muted-foreground">
                  <strong className="text-foreground">4-5 Members per team</strong><br />
                  The Startup Strategy League
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 my-4 sm:my-6 w-full max-w-3xl">
              <Link href="/sign-up" className="inline-flex w-full sm:flex-1 items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors duration-200 min-h-[48px]">
                Register Your Team
              </Link>
              <Link href="/sign-in" className="inline-flex w-full sm:flex-1 items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium text-foreground hover:bg-accent transition-colors duration-200 min-h-[48px]">
                Sign In
              </Link>
              <Link href="/scoreboard" className="inline-flex w-full sm:flex-1 items-center justify-center rounded-md border border-input bg-background/50 px-6 py-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors duration-200 min-h-[48px]">
                View Scoreboard
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Event Schedule */}
      <section className="event-section-bg mobile-padding mx-auto max-w-6xl py-12 sm:py-16">
        <h2 className="mobile-title tracking-tight mb-8 sm:mb-12 text-center event-text-gradient">Event Schedule</h2>
        
        {/* Day 1 */}
        <div className="mb-12 sm:mb-16">
          <div className="text-center mb-6 sm:mb-8">
            <h3 className="mobile-subtitle text-primary inline-flex items-center gap-3 px-6 py-3 bg-primary/10 rounded-full border border-primary/20">
              <span className="text-2xl">📅</span> 
              <span>DAY 1 - 25 SEPTEMBER</span>
            </h3>
          </div>
          <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-2">
            <div className="mobile-card hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🧠</span>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-primary mb-1">ROUND 1</h4>
                  <p className="text-sm font-medium text-muted-foreground">QUIZ FOR TOKENS</p>
                </div>
              </div>
              <p className="mobile-body text-muted-foreground mb-4 leading-relaxed">
                Test your knowledge and earn strategic tokens that will be crucial for the next round.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <span className="text-primary text-sm">•</span>
                  <span className="text-sm text-muted-foreground">15 questions in 30 minutes</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <span className="text-primary text-sm">•</span>
                  <span className="text-sm text-muted-foreground">Maximum 60 points available</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <span className="text-primary text-sm">•</span>
                  <span className="text-sm text-muted-foreground">Token trade-offs per option (Marketing, Capital, Team, Strategy)</span>
                </div>
              </div>
            </div>
            
            <div className="mobile-card hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🎤</span>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-primary mb-1">ROUND 2</h4>
                  <p className="text-sm font-medium text-muted-foreground">90 SEC PITCH AND VOTING</p>
                </div>
              </div>
              <p className="mobile-body text-muted-foreground mb-4 leading-relaxed">
                Customer Acquiring - Present your idea and win the crowd's vote.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <span className="text-primary text-sm">•</span>
                  <span className="text-sm text-muted-foreground">90-second pitch presentation</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <span className="text-primary text-sm">•</span>
                  <span className="text-sm text-muted-foreground">30s team voting period</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <span className="text-primary text-sm">•</span>
                  <span className="text-sm text-muted-foreground">Convert tokens to votes strategically</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <span className="text-primary text-sm">•</span>
                  <span className="text-sm text-muted-foreground">Maximum 3 downvotes per team</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Day 2 */}
        <div className="mb-8 sm:mb-12">
          <div className="text-center mb-6 sm:mb-8">
            <h3 className="mobile-subtitle text-primary inline-flex items-center gap-3 px-6 py-3 bg-primary/10 rounded-full border border-primary/20">
              <span className="text-2xl">📅</span> 
              <span>DAY 2 - 27 SEPTEMBER</span>
            </h3>
          </div>
          <div className="grid gap-6 sm:gap-8 grid-cols-1 lg:grid-cols-2">
            <div className="mobile-card hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🏆</span>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-primary mb-1">ROUND 3</h4>
                  <p className="text-sm font-medium text-muted-foreground">5 MIN PITCH</p>
                </div>
              </div>
              <p className="mobile-body text-muted-foreground mb-4 leading-relaxed">
                Followed by Q&A and Points Acquisition - Your final chance to impress.
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <span className="text-primary text-sm">•</span>
                  <span className="text-sm text-muted-foreground">5-minute comprehensive pitch</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <span className="text-primary text-sm">•</span>
                  <span className="text-sm text-muted-foreground">Q&A session with judges</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <span className="text-primary text-sm">•</span>
                  <span className="text-sm text-muted-foreground">Teams rate each other (3-10 scale)</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <span className="text-primary text-sm">•</span>
                  <span className="text-sm text-muted-foreground">Professional judge scoring</span>
                </div>
              </div>
            </div>
            
            <div className="mobile-card hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary">
              <div className="flex items-start gap-3 mb-4">
                <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="text-2xl">🥇</span>
                </div>
                <div>
                  <h4 className="text-lg font-semibold text-primary mb-1">ROUND 4</h4>
                  <p className="text-sm font-medium text-muted-foreground">EVALUATION</p>
                </div>
              </div>
              <p className="mobile-body text-muted-foreground mb-4 leading-relaxed">
                Points Acquisition, Evaluation and Result Declaration
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <span className="text-primary text-sm">•</span>
                  <span className="text-sm text-muted-foreground">Final score calculation</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <span className="text-primary text-sm">•</span>
                  <span className="text-sm text-muted-foreground">Judge deliberation</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <span className="text-primary text-sm">•</span>
                  <span className="text-sm text-muted-foreground">Winner announcement</span>
                </div>
                <div className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <span className="text-primary text-sm">•</span>
                  <span className="text-sm text-muted-foreground">Prize distribution ceremony</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links - Only show competition portals if signed in */}
      <section className="mobile-padding mx-auto max-w-6xl py-8 sm:py-12 mt-8">
        <h2 className="mobile-subtitle tracking-tight mb-6 sm:mb-8 text-center event-text-gradient">Quick Access</h2>
        <div className="grid gap-4 sm:gap-6 auto-rows-fr">
          {/* User Links Row */}
          {!isSignedIn && (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-6">
              <Link href="/sign-up" className="mobile-card group hover:bg-accent/50 transition-colors duration-200 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-lg">📝</span>
                  </div>
                  <h4 className="font-semibold text-primary">Register Your Team</h4>
                </div>
                <p className="mobile-body text-muted-foreground flex-1">Sign up to participate in the event.</p>
              </Link>
              <Link href="/sign-in" className="mobile-card group hover:bg-accent/50 transition-colors duration-200 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🔐</span>
                  </div>
                  <h4 className="font-semibold text-primary">Sign In</h4>
                </div>
                <p className="mobile-body text-muted-foreground flex-1">Access your dashboard and competition portals.</p>
              </Link>
              <Link href="/scoreboard" className="mobile-card group hover:bg-accent/50 transition-colors duration-200 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <span className="text-lg">🏆</span>
                  </div>
                  <h4 className="font-semibold text-primary">View Scoreboard</h4>
                </div>
                <p className="mobile-body text-muted-foreground flex-1">See team rankings and scores.</p>
              </Link>
            </div>
          )}
          
          {/* Admin Links Row */}
          <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2">
            <Link href="/admin" className="mobile-card group hover:bg-accent/50 transition-colors duration-200 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-lg">⚙️</span>
                </div>
                <h4 className="font-semibold text-primary">Admin Console</h4>
              </div>
              <p className="mobile-body text-muted-foreground flex-1">Control round status, manage questions, and oversee the event.</p>
            </Link>
            <Link href="/judge" className="mobile-card group hover:bg-accent/50 transition-colors duration-200 flex flex-col h-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="text-lg">👨‍⚖️</span>
                </div>
                <h4 className="font-semibold text-primary">Judge Console</h4>
              </div>
              <p className="mobile-body text-muted-foreground flex-1">Score team presentations and evaluate final round performances.</p>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="mobile-padding mx-auto max-w-6xl py-8 sm:py-12 border-t border-border/50">
        <h2 className="mobile-subtitle tracking-tight mb-6 sm:mb-8 text-center event-text-gradient">Contact Us</h2>
        <div className="text-center mb-6 sm:mb-8">
          <p className="mobile-body text-muted-foreground mb-4 sm:mb-6">For any queries, reach out to our organizing team:</p>
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 max-w-4xl mx-auto">
            <div className="mobile-card text-center">
              <h4 className="font-semibold text-primary">Ayush Pardeshi</h4>
              <p className="mobile-body text-muted-foreground">CEO</p>
              <p className="mobile-body font-mono text-foreground">8766536270</p>
            </div>
            <div className="mobile-card text-center">
              <h4 className="font-semibold text-primary">Ahana Kulkarni</h4>
              <p className="mobile-body text-muted-foreground">CTO</p>
              <p className="mobile-body font-mono text-foreground">8928352406</p>
            </div>
            <div className="mobile-card text-center">
              <h4 className="font-semibold text-primary">Bhummi Girnara</h4>
              <p className="mobile-body text-muted-foreground">COO</p>
              <p className="mobile-body font-mono text-foreground">98698 32960</p>
            </div>
            <div className="mobile-card text-center">
              <h4 className="font-semibold text-primary">Hredey Chaand</h4>
              <p className="mobile-body text-muted-foreground">CMO</p>
              <p className="mobile-body font-mono text-foreground">9004724466</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-border bg-card/60 py-6 sm:py-8 mt-12">
        <div className="mobile-padding mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">© {new Date().getFullYear()} Techpreneur Summit 3.0 • Axios EDIC • Thakur College of Engineering and Technology</p>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 text-xs sm:text-sm">
            <Link href="/sign-in" className="hover:underline px-2 py-1">Sign In</Link>
            <Link href="/sign-up" className="hover:underline px-2 py-1">Sign Up</Link>
            <Link href="/scoreboard" className="hover:underline px-2 py-1">Scoreboard</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}