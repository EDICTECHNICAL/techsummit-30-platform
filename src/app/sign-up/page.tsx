"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function SignUpPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await authClient.signUp.email({ email, name, password });
      if (error?.code) {
        setError(error.code === "USER_ALREADY_EXISTS" ? "User already registered" : "Registration failed");
        setLoading(false);
        return;
      }
      router.push("/sign-in?registered=true");
    } catch (err: any) {
      setError(err?.message || "Registration failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-6">
        <h1 className="text-2xl font-bold">Create your account</h1>
        {error && (
          <p className="mt-3 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</p>
        )}
        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <div>
            <label className="text-sm text-muted-foreground">Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 outline-none focus:ring-2"
              placeholder="Your name"
            />
          </div>
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
              placeholder="Create a password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>
        <div className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account? <Link className="underline" href="/sign-in">Sign in</Link>
        </div>
      </div>
    </div>
  );
}