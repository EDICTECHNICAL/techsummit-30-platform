"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function JudgeLogin() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/judge/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: 'include' // Ensure cookies are included
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setError(result.error || "Invalid judge credentials");
        setLoading(false);
        return;
      }
      
      // Add a small delay to ensure cookies are set before redirecting
      setTimeout(() => {
        window.location.href = "/judge"; // Use window.location instead of router.push for full page reload
      }, 500);
    } catch (err: any) {
      setError(err?.message || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold">Judge Console</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Access the judging panel to score team presentations
          </p>
        </div>
        {error && (
          <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm text-muted-foreground">Judge Username</label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:ring-2"
              placeholder="Your judge username"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:ring-2"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Access Judge Console"}
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-muted-foreground space-y-2">
          <div>
            <Link className="underline hover:text-foreground" href="/admin/login">Admin Login</Link>
            <span className="mx-2">•</span>
            <Link className="underline hover:text-foreground" href="/">Back to Home</Link>
          </div>
          <p className="text-xs">
            Judge accounts are provided by event organizers
          </p>
        </div>
      </div>
    </div>
  );
}