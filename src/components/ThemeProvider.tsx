"use client";

import * as React from "react";

type Theme = "light" | "dark" | "netflix" | "teal" | "orange";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("dark");

  const setTheme = (newTheme: Theme) => {
    const root = window.document.documentElement;
    
    // Remove all theme classes
    root.classList.remove("light", "dark", "theme-netflix", "theme-teal", "theme-orange");
    
    // Add new theme class
    if (newTheme === "netflix") {
      root.classList.add("dark", "theme-netflix");
    } else if (newTheme === "teal") {
      root.classList.add("dark", "theme-teal");
    } else if (newTheme === "orange") {
      root.classList.add("dark", "theme-orange");
    } else {
      root.classList.add(newTheme);
    }
    
    setThemeState(newTheme);
    localStorage.setItem("app-theme", newTheme);
  };

  React.useEffect(() => {
    const savedTheme = localStorage.getItem("app-theme") as Theme;
    if (savedTheme) {
      setTheme(savedTheme);
    } else {
      setTheme("dark");
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = React.useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
