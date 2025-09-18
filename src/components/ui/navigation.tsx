"use client";

import Link from "next/link";
import { BackButton } from "@/components/BackButton";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const navItems = [
  { href: "/", label: "Gallery" },
  { href: "/bento", label: "Bentos" },
  { href: "/casestudies", label: "Case Studies" },
  { href: "/contacts", label: "Contact" },
  { href: "/ctas", label: "CTAs" },
  { href: "/faqs", label: "FAQs" },
  { href: "/feature", label: "Features" },
  { href: "/footers", label: "Footers" },
  { href: "/hero", label: "Hero" },
  { href: "/navbars", label: "Navbars" },
  { href: "/pricing", label: "Pricing" },
  { href: "/stats", label: "Stats" },
  { href: "/team", label: "Team" },
  { href: "/testimonial", label: "Testimonials" },
];

export function Navigation() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<'light' | 'dark'>(
    typeof window !== 'undefined' && window.localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      window.localStorage.setItem('theme', theme);
    }
  }, [theme]);

  return (
    <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-1">
            <BackButton />
            <Link 
              href="/" 
              className="text-xl font-bold text-gray-900 dark:text-white hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
            >
              Orchids
            </Link>
          </div>
          <div className="flex items-center space-x-1 overflow-x-auto">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  pathname === item.href
                    ? "bg-gray-900 text-white dark:bg-blue-700 dark:text-white"
                    : "text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-blue-900"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <button
              aria-label="Toggle Dark Mode"
              className="ml-4 px-3 py-2 rounded-md text-sm font-medium transition-colors bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white hover:bg-gray-300 dark:hover:bg-gray-600"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            >
              {theme === 'light' ? '🌞 Light' : '🌙 Dark'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}