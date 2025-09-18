"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function SignInPage() {
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
        body: JSON.stringify({ 
          username: username.trim(), 
          password 
        })
      });
      
      const result = await res.json();
      
      if (!res.ok || !result.success) {
        setError(result.error || "Login failed");
        return;
      }

      // Store user data in localStorage for client-side access
      if (typeof window !== 'undefined') {
        localStorage.setItem("user", JSON.stringify(result.user));
        
        // Also store token for API requests
        if (result.token) {
          localStorage.setItem("auth-token", result.token);
        }
      }

      // Redirect to dashboard or intended page
      const redirectTo = searchParams?.get("from") || "/dashboard";
      router.push(redirectTo);
      router.refresh(); // Ensure page refreshes to pick up new auth state
      
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err?.message || "Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const registrationSuccess = searchParams?.get("registered") === "true";

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-lg">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>
        
        {registrationSuccess && (
          <div className="mb-4 p-3 rounded-md bg-green-50 border border-green-200">
            <p className="text-sm text-green-800">
              Registration successful! Please sign in with your credentials.
            </p>
          </div>
        )}
        
        {error && (
          <div className="mb-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}
        
        <form className="space-y-4" onSubmit={onSubmit}>
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-muted-foreground mb-1">
              Username
            </label>
            <input
              id="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              placeholder="Enter your username"
              disabled={loading}
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-muted-foreground mb-1">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
              placeholder="Enter your password"
              disabled={loading}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input 
                type="checkbox" 
                checked={rememberMe} 
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-input"
                disabled={loading}
              />
              Remember me
            </label>
            <Link 
              href="/forgot-password" 
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          
          <button
            type="submit"
            disabled={loading || !username.trim() || !password}
            className="w-full rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
        
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link href="/sign-up" className="text-primary hover:underline font-medium">
              Create one here
            </Link>
          </p>
          <Link 
            href="/" 
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}