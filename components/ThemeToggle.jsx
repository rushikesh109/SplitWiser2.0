"use client";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label="Toggle Theme"
      className="flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium border transition-all
                 bg-gray-100 text-black border-gray-300 hover:bg-gray-200
                 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700
                 sm:px-4 sm:py-2 sm:text-base"
    >
      {isDark ? (
        <>
          <Sun className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">Light Mode</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4 sm:h-5 sm:w-5" />
          <span className="hidden sm:inline">Dark Mode</span>
        </>
      )}
    </button>
  );
}
