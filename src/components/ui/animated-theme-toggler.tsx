"use client";

import { Moon02, Sun } from "@untitled-ui/icons-react";
import { useRef, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/ThemeProvider";

interface AnimatedThemeTogglerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const AnimatedThemeToggler = ({ className, size = 'md' }: AnimatedThemeTogglerProps) => {
  const { theme, setTheme } = useTheme();
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // Handle mounting to prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Sync with theme provider
  useEffect(() => {
    if (mounted) {
      setIsDarkMode(theme === 'dark');
    }
  }, [theme, mounted]);

  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-9 w-9',
    lg: 'h-10 w-10'
  };

  const iconSizes = {
    sm: 16,
    md: 18,
    lg: 20
  };

  const changeTheme = async () => {
    if (!buttonRef.current || !mounted) return;

    const newTheme = theme === 'dark' ? 'light' : 'dark';

    // Simple fallback first - ensure theme always changes
    const fallbackChange = () => {
      setTheme(newTheme);
    };

    // Check if view transitions are supported
    if (!('startViewTransition' in document)) {
      fallbackChange();
      return;
    }

    try {
      const transition = (document as any).startViewTransition(() => {
        flushSync(() => {
          setTheme(newTheme);
        });
      });

      await transition.ready;

      const { top, left, width, height } =
        buttonRef.current.getBoundingClientRect();
      const y = top + height / 2;
      const x = left + width / 2;

      const right = window.innerWidth - left;
      const bottom = window.innerHeight - top;
      const maxRad = Math.hypot(Math.max(left, right), Math.max(top, bottom));

      document.documentElement.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${maxRad}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 700,
          easing: "ease-in-out",
          pseudoElement: "::view-transition-new(root)",
        },
      );
    } catch (error) {
      // Fallback if view transition fails
      console.warn('View transition failed, using fallback:', error);
      fallbackChange();
    }
  };

  // Don't render anything until mounted to prevent hydration mismatch
  if (!mounted) {
    return (
      <div className={cn(
        "inline-flex items-center justify-center rounded-md border border-input bg-background",
        sizeClasses[size],
        className
      )}>
        <div style={{ width: iconSizes[size], height: iconSizes[size] }} />
      </div>
    );
  }

  return (
    <button 
      ref={buttonRef} 
      onClick={changeTheme} 
      className={cn(
        "inline-flex items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-all duration-300",
        "hover:shadow-lg hover:scale-105 active:scale-95",
        "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
        sizeClasses[size],
        className
      )}
      aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
      title={`Currently ${theme} mode. Click to switch to ${isDarkMode ? 'light' : 'dark'} mode`}
    >
      {isDarkMode ? (
        <Sun 
          width={iconSizes[size]} 
          height={iconSizes[size]}
          className="text-orange-500 dark:text-orange-400 transition-colors duration-300" 
        />
      ) : (
        <Moon02 
          width={iconSizes[size]} 
          height={iconSizes[size]}
          className="text-slate-600 dark:text-slate-300 transition-colors duration-300" 
        />
      )}
    </button>
  );
};
