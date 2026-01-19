"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { Moon, Sun, Laptop } from "lucide-react";

const THEMES = ["system", "light", "dark"];

export default function ThemeToggle() {
  const { theme, setTheme, systemTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const clickSoundRef = useRef(null);

  useEffect(() => {
    setMounted(true);

    if (typeof Audio !== "undefined") {
      clickSoundRef.current = new Audio("/click.mp3");
      clickSoundRef.current.volume = 0.3;
    }
  }, []);

  if (!mounted) return null;

  const currentTheme = theme === "system" ? systemTheme : theme;
  const cycleTheme = () => {
    if (clickSoundRef.current) {
      clickSoundRef.current.currentTime = 0;
      clickSoundRef.current.play();
    }
  
    const resolvedTheme =
      theme === "system" ? systemTheme : theme;
  
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <button
      onClick={cycleTheme}
      aria-label={`Switch to ${currentTheme === "dark" ? "light" : "dark"} mode`}
      className="flex items-center gap-3 cursor-pointer "
    >
      {/* Toggle Switch */}
      <div
        className={`relative w-11 h-6 rounded-full transition-colors duration-300
          ${currentTheme === "dark" ? "bg-gray-900" : "bg-gray-300"}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-md
            transition-transform duration-300
            ${currentTheme === "dark" ? "translate-x-5" : "translate-x-0"}`}
        />
      </div>

      {/* Auto-hidden label on mobile */}
      <span className="hidden sm:inline text-sm font-medium text-black dark:text-white">
        {currentTheme === "dark" ? "Light" : "Dark"}
      </span>
    </button>
  );
}
