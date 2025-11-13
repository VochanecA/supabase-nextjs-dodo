// components/ThemeToggle.tsx
'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';

interface ThemeToggleProps {
  variant?: 'floating' | 'header';
}

export default function ThemeToggle({ variant = 'floating' }: ThemeToggleProps) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    switch (theme) {
      case 'dark':
        return <Moon className="h-5 w-5 text-blue-400" />;
      case 'system':
        return <Monitor className="h-5 w-5 text-gray-500" />;
      default:
        return <Sun className="h-5 w-5 text-yellow-500" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'dark':
        return "Switch to system theme";
      case 'system':
        return "Switch to light theme";
      default:
        return "Switch to dark theme";
    }
  };

  // Floating variant (default)
  if (variant === 'floating') {
    if (!mounted) {
      return (
        <button className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700">
          <Monitor className="h-5 w-5 text-gray-400" />
        </button>
      );
    }

    return (
      <button
        onClick={toggleTheme}
        className="fixed bottom-6 right-6 z-50 p-3 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-200 group"
        aria-label={getLabel()}
        title={getLabel()}
      >
        {getIcon()}
      </button>
    );
  }

  // Header variant
  if (!mounted) {
    return (
      <button className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
        <Monitor className="h-5 w-5 text-gray-400" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      aria-label={getLabel()}
      title={getLabel()}
    >
      {getIcon()}
    </button>
  );
}