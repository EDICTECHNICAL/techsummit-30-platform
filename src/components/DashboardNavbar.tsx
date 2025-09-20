"use client";

import { useState } from "react";
import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/quiz", label: "Quiz", icon: "🧠" },
  { href: "/voting", label: "Voting", icon: "🗳️" },
  { href: "/final", label: "Finals", icon: "🏆" },
  { href: "/scoreboard", label: "Scoreboard", icon: "📊" },
];

export function DashboardNavbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <>
        {/* Mobile Header */}
        <nav
          className="fixed top-0 left-0 w-full z-50 backdrop-blur-lg border-b border-gray-200/20 safe-area-top"
          style={{ background: "linear-gradient(90deg, rgba(30,32,38,0.95) 60%, rgba(60,64,80,0.95) 100%)", boxShadow: "0 4px 32px 0 rgba(30,32,38,0.12)" }}
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <BackButton />
              <span className="font-bold text-white text-lg">TechSummit 3.0</span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                variant="ghost"
                size="icon"
                className="p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                aria-label="Toggle menu"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {isMenuOpen ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  )}
                </svg>
              </Button>
            </div>
          </div>
          
          {/* Mobile Dropdown Menu */}
          {isMenuOpen && (
            <div 
              className="border-t border-gray-200/20 bg-inherit"
              style={{ background: "rgba(30,32,38,0.98)" }}
            >
              <div className="px-4 py-2 space-y-1">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center gap-3 font-semibold text-white hover:text-blue-400 transition-colors px-4 py-3 rounded-lg hover:bg-white/10"
                  >
                    <span className="text-lg">{link.icon}</span>
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </nav>

        {/* Mobile Bottom Navigation */}
        <div className="mobile-nav safe-area-padding">
          <div className="grid grid-cols-5 h-full">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="mobile-nav-item"
              >
                <span className="text-lg mb-1">{link.icon}</span>
                <span className="text-xs">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </>
    );
  }

  // Desktop/Tablet Navigation
  return (
    <nav
      className="fixed top-0 left-0 w-full z-50 backdrop-blur-lg border-b border-gray-200/20"
      style={{ background: "linear-gradient(90deg, rgba(30,32,38,0.85) 60%, rgba(60,64,80,0.85) 100%)", boxShadow: "0 4px 32px 0 rgba(30,32,38,0.12)" }}
    >
      <div className="flex items-center justify-between px-6 lg:px-10 py-4 lg:py-5">
        <div className="flex gap-2 lg:gap-3 items-center overflow-x-auto">
          <BackButton />
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-semibold text-white hover:text-blue-400 transition-colors px-3 lg:px-5 py-2 rounded-xl shadow-sm whitespace-nowrap"
              style={{ background: "rgba(30,32,38,0.18)", border: "1px solid rgba(255,255,255,0.18)" }}
            >
              <span className="hidden sm:inline">{link.label}</span>
              <span className="sm:hidden text-lg">{link.icon}</span>
            </Link>
          ))}
        </div>
        <ThemeToggle />
      </div>
    </nav>
  );
}
