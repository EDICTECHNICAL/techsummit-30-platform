import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/quiz", label: "Quiz" },
  { href: "/voting", label: "Voting" },
  { href: "/final", label: "Finals" },
  { href: "/scoreboard", label: "Scoreboard" },
];

export function DashboardNavbar({ onToggleTheme }: { onToggleTheme: () => void }) {
  const { theme } = useTheme();
  return (
    <nav
      className="fixed top-0 left-0 w-full z-50 backdrop-blur-lg border-b border-gray-200/20"
      style={{ background: "linear-gradient(90deg, rgba(30,32,38,0.85) 60%, rgba(60,64,80,0.85) 100%)", boxShadow: "0 4px 32px 0 rgba(30,32,38,0.12)" }}
    >
      <div className="flex items-center justify-between px-10 py-5 overflow-x-auto">
        <div className="flex gap-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-semibold text-white hover:text-blue-400 transition-colors px-5 py-2 rounded-xl shadow-sm"
              style={{ background: "rgba(30,32,38,0.18)", border: "1px solid rgba(255,255,255,0.18)" }}
            >
              {link.label}
            </Link>
          ))}
        </div>
        <button
          onClick={onToggleTheme}
          className={`ml-4 px-5 py-2 rounded-full border border-blue-400 bg-white/10 ${theme === "dark" ? "text-blue-400" : "text-blue-700"} font-semibold shadow-lg hover:bg-blue-400/20`}
        >
          {theme === "dark" ? "🌙" : "☀️"}
        </button>
      </div>
    </nav>
  );
}
