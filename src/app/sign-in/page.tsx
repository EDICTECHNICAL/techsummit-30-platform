"use client"

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function SignInPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await authClient.signIn.email({
        email, password, rememberMe, callbackURL: "/dashboard"
      });
      if (error?.code) {
        setError("Invalid email or password");
        setLoading(false);
        return;
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.message || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
        <h1 className="text-2xl font-bold">Sign in</h1>
        {sp.get("registered") === "true" && (
          <p className="mt-2 rounded-md bg-accent px-3 py-2 text-sm">Registration successful. Please sign in.</p>
        )}
        {error && (
          <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm text-muted-foreground">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:ring-2"
              placeholder="you@example.com"
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
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={rememberMe} onChange={(e)=>setRememberMe(e.target.checked)} />
              Remember me
            </label>
            <Link href="/sign-up" className="text-sm underline">Create account</Link>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          <Link className="underline" href="/">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}