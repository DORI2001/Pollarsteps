'use client';

import React, { ReactNode, useEffect, useState } from 'react';

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

export const ThemeContext = React.createContext<ThemeContextType>({
  isDark: false,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check localStorage and system preference
    const stored = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    const shouldBeDark = stored ? stored === 'dark' : prefersDark;
    setIsDark(shouldBeDark);
    applyTheme(shouldBeDark);
  }, []);

  const applyTheme = (dark: boolean) => {
    if (typeof window !== 'undefined') {
      if (dark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', dark ? 'dark' : 'light');
    }
  };

  const toggleTheme = () => {
    setIsDark(prev => {
      const newIsDark = !prev;
      applyTheme(newIsDark);
      return newIsDark;
    });
  };

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
