"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MagicCard } from "@/components/ui/magic-card";
import { Settings01, ArrowLeft } from "@untitled-ui/icons-react";

export default function AdminLogin() {
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
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const result = await res.json();
      if (!res.ok || !result.success) {
        setError(result.error || "Invalid admin credentials");
        setLoading(false);
        return;
      }
      router.push("/admin");
    } catch (err: any) {
      setError(err?.message || "Login failed");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 event-section-bg safe-area-padding">
      <MagicCard 
        className="w-full max-w-md shadow-2xl rounded-2xl border border-border/50 backdrop-blur-sm bg-card/80" 
        gradientSize={300}
        gradientColor="#466F89" 
        gradientFrom="#466F89" 
        gradientTo="#34414A"
        gradientOpacity={0.6}
      >
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="text-center mb-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <Settings01 width={24} height={24} className="text-primary" />
              </div>
              <h1 className="text-3xl font-bold event-text-gradient">Admin Portal</h1>
            </div>
            <p className="text-muted-foreground mobile-body">Administrative access required</p>
          </div>
          {error && (
            <div className="mb-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur-sm">
              <p className="mobile-body text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label htmlFor="username" className="block mobile-body font-medium text-foreground mb-2">
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mobile-input"
                placeholder="Admin username"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="password" className="block mobile-body font-medium text-foreground mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mobile-input"
                placeholder="••••••••"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="event-button-primary w-full rounded-md px-4 py-3 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </span>
              ) : (
                "Access Admin Portal"
              )}
            </button>
          </form>
          <div className="mt-6 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center gap-2 mobile-body text-muted-foreground hover:text-foreground underline transition-colors"
            >
              <ArrowLeft width={16} height={16} />
              Back to Home
            </Link>
          </div>
        </div>
      </MagicCard>
    </div>
  );
}
