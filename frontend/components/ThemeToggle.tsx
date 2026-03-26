'use client';

import React from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { Moon, Sun } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg transition-colors hover:bg-gray-200 dark:hover:bg-gray-700"
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun size={20} className="text-yellow-500" />
      ) : (
        <Moon size={20} className="text-gray-700" />
      )}
    </button>
  );
};
