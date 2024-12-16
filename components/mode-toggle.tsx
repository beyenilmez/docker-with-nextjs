"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ModeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => {
        const themeToSet = theme === "light" ? "dark" : "light";
        setTheme(themeToSet);
      }}
      className="relative w-9 h-9 flex items-center justify-center opacity-80 hover:opacity-100 duration-100 pt-1"
    >
      <Sun className="absolute opacity-100 dark:opacity-0" />
      <Moon className="absolute opacity-0 dark:opacity-100" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
