import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';

// Secure wrapped storage container safe for sandboxed third-party iframe environments
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("Storage access blocked by browser options or iframe sandbox:", e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("Storage write blocked by browser options or iframe sandbox:", e);
    }
  }
};

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const stored = safeLocalStorage.getItem('theme');
    if (stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      return 'dark';
    }
    return 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    safeLocalStorage.setItem('theme', theme);
  }, [theme]);

  const toggle = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <button
      id="theme-mode-toggle"
      onClick={toggle}
      className="p-1.5 md:p-2 rounded-lg cursor-pointer text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-50 bg-gray-100 dark:bg-gray-800 transition-colors duration-150 border border-gray-200 dark:border-gray-700"
      aria-label="Toggle Theme Mode"
    >
      {theme === 'light' ? (
        <Moon className="w-4 h-4 md:w-5 md:h-5 text-blue-600 dark:text-blue-400" />
      ) : (
        <Sun className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
      )}
    </button>
  );
}
