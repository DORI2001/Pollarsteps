'use client';

import React from 'react';
import { useTheme } from '@/providers/ThemeProvider';
import { Moon, Sun } from 'lucide-react';

export const ThemeToggle: React.FC = () => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-9 h-9 flex items-center justify-center rounded-full transition-all duration-300 ease-out hover:scale-110 active:scale-95"
      style={{
        background: isDark
          ? 'rgba(250, 204, 21, 0.12)'
          : 'rgba(100, 116, 139, 0.08)',
      }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      data-tooltip={isDark ? 'Light mode' : 'Dark mode'}
    >
      <div
        style={{
          transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease',
          transform: isDark ? 'rotate(0deg)' : 'rotate(-90deg)',
        }}
      >
        {isDark ? (
          <Sun size={18} className="text-yellow-400" strokeWidth={2.5} />
        ) : (
          <Moon size={18} className="text-slate-500" strokeWidth={2.5} />
        )}
      </div>
    </button>
  );
};
