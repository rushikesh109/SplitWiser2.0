"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Moon, Sun, Laptop } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const themes = ["system", "light", "dark"];

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const currentTheme = theme === "system" ? systemTheme : theme;

  const getIcon = (theme) => {
    switch (theme) {
      case "light":
        return <Sun className="h-4 w-4" />;
      case "dark":
        return <Moon className="h-4 w-4" />;
      case "system":
      default:
        return <Laptop className="h-4 w-4" />;
    }
  };

  const getLabel = (theme) => {
    switch (theme) {
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      case "system":
      default:
        return "System";
    }
  };

  const cycleTheme = () => {
    const next = themes[(themes.indexOf(theme || "system") + 1) % themes.length];
    setTheme(next);
  };

  return (
    <button
      onClick={cycleTheme}
      aria-label="Toggle Theme"
      className="flex items-center gap-3"
    >
      {/* Toggle Switch */}
      <div
        className={`relative w-11 h-6 rounded-full transition-colors duration-300
          ${currentTheme === "dark" ? "bg-gray-900" : "bg-gray-300"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md
            transition-transform duration-300 cursor-pointer
            ${currentTheme === "dark" ? "translate-x-5" : "translate-x-0"}`}
        />
      </div>
  
      {/* Dynamic Label */}
      <span className="hidden sm:inline text-sm font-medium text-black dark:text-white cursor-pointer">
  {currentTheme === "dark" ? "switch to Light" : "switch to Dark"}
</span>

    </button>
  );
  
  
}
