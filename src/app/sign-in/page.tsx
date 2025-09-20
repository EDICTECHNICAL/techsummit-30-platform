"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";


function SignInPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setError(result.error || "Login failed");
        return;
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem("user", JSON.stringify(result.user));
        if (result.token) {
          localStorage.setItem("auth-token", result.token);
        }
      }
      const redirectTo = searchParams?.get("from") || "/dashboard";
      router.push(redirectTo);
      router.refresh();
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const registrationSuccess = searchParams?.get("registered") === "true";

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 event-section-bg">
      <div className="w-full max-w-md event-card event-card-hover rounded-xl shadow-2xl p-8">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold event-text-gradient">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">Sign in to your Techpreneur Summit 3.0 account</p>
        </div>
        {registrationSuccess && (
          <div className="mb-4 p-4 rounded-md bg-green-500/10 border border-green-500/20 backdrop-blur-sm">
            <p className="text-sm text-green-600 dark:text-green-400">
              Registration successful! Please sign in with your credentials.
            </p>
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 rounded-md bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-input bg-background/50 backdrop-blur-sm px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background/50 backdrop-blur-sm px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-300"
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-input accent-primary"
                disabled={loading}
              />
              Remember me
            </label>
            <Link 
              href="/forgot-password" 
              className="text-sm text-primary hover:underline transition-colors"
            >
              Forgot password?
            </Link>
          </div>
          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="event-button-primary w-full rounded-md px-4 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Signing in...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>
        <div className="mt-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/sign-up" className="text-primary hover:underline font-medium transition-colors">
              Create one here
            </Link>
          </p>
          <Link 
            href="/" 
            className="text-sm text-muted-foreground hover:text-primary underline transition-colors"
          >
            ← Back to Techpreneur Summit 3.0
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense>
      <SignInPageContent />
    </Suspense>
  );
}