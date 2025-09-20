"use client"

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';
import { Switch } from "@/components/ui/switch";

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function ThemeToggle({ className = '', size = 'md' }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-4 w-4'
  };

  const containerSizes = {
    sm: 'gap-2',
    md: 'gap-2',
    lg: 'gap-3'
  };

  return (
    <div className={`inline-flex items-center ${containerSizes[size]} ${className}`}>
      <Sun className={`${iconSizes[size]} ${theme === 'light' ? 'text-primary' : 'text-muted-foreground'} transition-colors`} />
      <Switch
        checked={theme === 'dark'}
        onCheckedChange={toggleTheme}
        aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        title={`Currently ${theme} mode. Click to switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      />
      <Moon className={`${iconSizes[size]} ${theme === 'dark' ? 'text-primary' : 'text-muted-foreground'} transition-colors`} />
    </div>
  );
}