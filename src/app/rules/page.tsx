"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Trophy, Clock, Users, Target, Award, CheckCircle, AlertTriangle, FileText, Shield, Zap } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useIsMobile } from "@/hooks/use-mobile";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "../../components/ui/badge";

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

export default function RulesPage() {
  const isMobile = useIsMobile();
  const [user, setUser] = useState<User | null>(null);
  const [isPending, setIsPending] = useState(true);

  useEffect(() => {
    setIsPending(true);
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

  if (isPending) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading competition rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 text-foreground overflow-x-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-primary/5 rounded-full blur-2xl animate-pulse" style={{animationDelay: '4s'}}></div>
      </div>

      {/* Header */}
      <div className="border-b border-border/50 bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link 
                href="/dashboard" 
                className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-all duration-200 group"
              >
                <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                Back to Dashboard
              </Link>
              <div className="h-6 w-px bg-border/50" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Competition Rules</h1>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {user && (
                <div className="hidden sm:flex items-center gap-3 px-4 py-2 bg-primary/5 backdrop-blur-sm border border-primary/20 rounded-lg">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Welcome,</span>
                    <span className="font-semibold text-foreground ml-1">{user.name}</span>
                  </div>
                  {user.team && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                      {user.team.name}
                    </Badge>
                  )}
                </div>
              )}
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      <div className="relative pt-8 pb-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-6 group">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div className="text-left">
                <h1 className="font-bold text-xl bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                  TECHPRENEUR
                </h1>
                <p className="text-xs text-muted-foreground -mt-1">SUMMIT 2.0</p>
              </div>
            </div>
            <h2 className="text-3xl font-black mb-4 bg-gradient-to-r from-foreground via-primary to-accent bg-clip-text text-transparent">
              The Startup Strategy League
            </h2>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-accent/20 rounded-2xl blur opacity-25"></div>
              <p className="relative text-lg text-muted-foreground max-w-3xl mx-auto p-6 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl">
                An entrepreneurial strategy game where teams navigate the challenges of building and scaling a startup. 
                Through creativity, strategic decision-making, and resource management, you'll compete to dominate the marketplace and climb the leaderboard.
                Each team starts the quiz with 3 tokens in each of the four categories: Marketing, Capital, Team, and Strategy. Use tokens strategically when answering questions.
              </p>
            </div>
          </div>

          {/* Quick Overview */}
          <div className="relative group mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-2xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
            <Card className="relative bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                    <Zap className="h-5 w-5 text-white" />
                  </div>
                  Competition Overview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  <div className="text-center group">
                    <div className="bg-gradient-to-br from-primary/20 to-primary/10 backdrop-blur-sm rounded-xl p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform border border-primary/20">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">Team Based</h3>
                    <p className="text-sm text-muted-foreground">2-4 members per team</p>
                  </div>
                  <div className="text-center group">
                    <div className="bg-gradient-to-br from-accent/20 to-accent/10 backdrop-blur-sm rounded-xl p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform border border-accent/20">
                      <Clock className="h-8 w-8 text-accent" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">Multiple Rounds</h3>
                    <p className="text-sm text-muted-foreground">Quiz, Voting & Final rounds</p>
                  </div>
                  <div className="text-center group">
                    <div className="bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm rounded-xl p-4 w-16 h-16 mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform border border-primary/20">
                      <Trophy className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg mb-1">Competitive</h3>
                    <p className="text-sm text-muted-foreground">Strategic gameplay</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Competition Structure */}
          <div className="relative group mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-2xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
            <Card className="relative bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-accent to-primary rounded-lg flex items-center justify-center">
                    <Target className="h-5 w-5 text-white" />
                  </div>
                  Competition Structure
                </CardTitle>
                <CardDescription className="text-base">
                  The competition consists of three main phases designed to test different entrepreneurial skills
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Round 1: Quiz */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative border border-primary/20 rounded-xl p-6 bg-primary/5 backdrop-blur-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold shadow-lg">1</div>
                      <div>
                        <h3 className="text-xl font-bold text-primary mb-1">Knowledge Round (Quiz)</h3>
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30">Individual</Badge>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      Test your entrepreneurial knowledge and business acumen through a comprehensive quiz covering startup fundamentals, 
                      market dynamics, and strategic thinking.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm bg-background/50 backdrop-blur-sm p-3 rounded-lg border border-border/50">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-medium">20 multiple-choice questions</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm bg-background/50 backdrop-blur-sm p-3 rounded-lg border border-border/50">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-medium">Time limit: 15 minutes</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm bg-background/50 backdrop-blur-sm p-3 rounded-lg border border-border/50">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="font-medium">Individual scoring contributes to team total</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Round 2: Voting */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 to-accent/10 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative border border-accent/20 rounded-xl p-6 bg-accent/5 backdrop-blur-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-gradient-to-br from-accent to-accent/80 text-white rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold shadow-lg">2</div>
                      <div>
                        <h3 className="text-xl font-bold text-accent mb-1">Strategy Round (Voting)</h3>
                        <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/30">Team</Badge>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-4 leading-relaxed">
                      Demonstrate strategic thinking by evaluating and voting on various business scenarios, 
                      startup pitches, and market opportunities.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm bg-background/50 backdrop-blur-sm p-3 rounded-lg border border-border/50">
                        <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                        <span className="font-medium">Multiple voting scenarios</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm bg-background/50 backdrop-blur-sm p-3 rounded-lg border border-border/50">
                        <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                        <span className="font-medium">Team consensus required</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm bg-background/50 backdrop-blur-sm p-3 rounded-lg border border-border/50">
                        <CheckCircle className="h-4 w-4 text-accent flex-shrink-0" />
                        <span className="font-medium">Strategic decision making</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Round 3: Final */}
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary/15 to-accent/15 dark:from-primary/25 dark:to-accent/25 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                  <div className="relative border border-primary/20 dark:border-primary/30 rounded-xl p-6 bg-gradient-to-br from-primary/5 to-accent/5 dark:from-primary/10 dark:to-accent/10 backdrop-blur-sm">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="bg-gradient-to-br from-primary to-accent text-white rounded-full w-12 h-12 flex items-center justify-center text-lg font-bold shadow-lg dark:shadow-primary/20">3</div>
                      <div>
                        <h3 className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1">Final Round (Presentation)</h3>
                        <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/30 dark:bg-primary/20 dark:text-primary-foreground dark:border-primary/40">Team</Badge>
                      </div>
                    </div>
                    <p className="text-muted-foreground dark:text-muted-foreground/80 mb-4 leading-relaxed">
                      Present your startup concept, business model, and growth strategy to a panel of judges
                      and receive peer evaluations from other teams.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 text-sm bg-background/50 dark:bg-background/30 backdrop-blur-sm p-3 rounded-lg border border-border/50 dark:border-border/30">
                        <CheckCircle className="h-4 w-4 text-primary dark:text-primary/90 flex-shrink-0" />
                        <span className="font-medium text-foreground dark:text-foreground/90">5-minute team presentation</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm bg-background/50 dark:bg-background/30 backdrop-blur-sm p-3 rounded-lg border border-border/50 dark:border-border/30">
                        <CheckCircle className="h-4 w-4 text-primary dark:text-primary/90 flex-shrink-0" />
                        <span className="font-medium text-foreground dark:text-foreground/90">Judge evaluation and scoring</span>
                      </div>
                      <div className="flex items-center gap-3 text-sm bg-background/50 dark:bg-background/30 backdrop-blur-sm p-3 rounded-lg border border-border/50 dark:border-border/30">
                        <CheckCircle className="h-4 w-4 text-primary dark:text-primary/90 flex-shrink-0" />
                        <span className="font-medium text-foreground dark:text-foreground/90">Peer rating system</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Important Guidelines */}
          <div className="relative group mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/30 to-red-500/30 rounded-2xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
            <Card className="relative bg-card/80 backdrop-blur-xl border border-orange-500/20 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-orange-600 dark:text-orange-400">
                  <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-white" />
                  </div>
                  Important Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4">
                  <div className="flex items-start gap-4 p-4 bg-orange-50/50 dark:bg-orange-900/20 backdrop-blur-sm rounded-xl border border-orange-200/50 dark:border-orange-800/50">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Shield className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-orange-700 dark:text-orange-300 mb-2">Fair Play</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">All participants must maintain integrity throughout the competition. Any form of cheating or misconduct will result in immediate disqualification.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-orange-50/50 dark:bg-orange-900/20 backdrop-blur-sm rounded-xl border border-orange-200/50 dark:border-orange-800/50">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Clock className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-orange-700 dark:text-orange-300 mb-2">Time Management</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">Each round has strict time limits. Late submissions or presentations will not be accepted under any circumstances.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-orange-50/50 dark:bg-orange-900/20 backdrop-blur-sm rounded-xl border border-orange-200/50 dark:border-orange-800/50">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Users className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-orange-700 dark:text-orange-300 mb-2">Team Collaboration</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">All team members must participate actively. Teams with inactive members may face point deductions.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 p-4 bg-orange-50/50 dark:bg-orange-900/20 backdrop-blur-sm rounded-xl border border-orange-200/50 dark:border-orange-800/50">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FileText className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-bold text-orange-700 dark:text-orange-300 mb-2">Documentation</h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">Keep records of your strategies and decisions. You may be asked to explain your reasoning during evaluations.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Scoring System */}
          <div className="relative group mb-8">
            <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500/30 to-amber-500/30 rounded-2xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
            <Card className="relative bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-lg flex items-center justify-center">
                    <Award className="h-5 w-5 text-white" />
                  </div>
                  Scoring System
                </CardTitle>
                <CardDescription className="text-base">
                  Understanding how points are awarded across different rounds
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-primary/10 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <div className="relative text-center p-6 bg-primary/5 backdrop-blur-sm rounded-xl border border-primary/20">
                        <div className="text-3xl font-black text-primary mb-2">30%</div>
                        <div className="text-base font-bold mb-1">Quiz Round</div>
                        <div className="text-sm text-muted-foreground">Individual knowledge</div>
                      </div>
                    </div>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 to-accent/10 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <div className="relative text-center p-6 bg-accent/5 backdrop-blur-sm rounded-xl border border-accent/20">
                        <div className="text-3xl font-black text-accent mb-2">30%</div>
                        <div className="text-base font-bold mb-1">Voting Round</div>
                        <div className="text-sm text-muted-foreground">Strategic decisions</div>
                      </div>
                    </div>
                    <div className="relative group">
                      <div className="absolute -inset-1 bg-gradient-to-r from-primary/15 to-accent/15 rounded-xl blur opacity-50 group-hover:opacity-75 transition-opacity"></div>
                      <div className="relative text-center p-6 bg-gradient-to-br from-primary/5 to-accent/5 backdrop-blur-sm rounded-xl border border-primary/20">
                        <div className="text-3xl font-black bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-2">40%</div>
                        <div className="text-base font-bold mb-1">Final Round</div>
                        <div className="text-sm text-muted-foreground">Presentation & evaluation</div>
                      </div>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary/10 to-accent/10 rounded-xl blur opacity-50"></div>
                    <div className="relative text-center p-4 bg-background/50 backdrop-blur-sm rounded-xl border border-border/50">
                      <p className="text-sm text-muted-foreground font-medium">
                        Final ranking is determined by total accumulated points across all rounds
                      </p>
                    </div>
                    <div className="relative mt-3 text-sm text-muted-foreground">
                      Finals Qualification: The top 70% of teams by ranking qualify for the final presentation round; the bottom 30% will be eliminated.
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Contact & Support */}
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 to-accent/30 rounded-2xl blur opacity-25 group-hover:opacity-75 transition-opacity duration-300"></div>
            <Card className="relative bg-card/80 backdrop-blur-xl border border-border/50 shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl">Need Help?</CardTitle>
                <CardDescription className="text-base">
                  For questions, technical issues, or clarifications about the rules
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    If you encounter any technical issues or have questions about the competition rules, 
                    please contact the organizing team immediately.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/30 hover:bg-primary/10 transition-colors">
                      Event Organizers Available
                    </Badge>
                    <Badge variant="outline" className="bg-accent/5 text-accent border-accent/30 hover:bg-accent/10 transition-colors">
                      Technical Support Ready
                    </Badge>
                    <Badge variant="outline" className="bg-primary/5 text-primary border-primary/30 hover:bg-primary/10 transition-colors">
                      Real-time Assistance
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}