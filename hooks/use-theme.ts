import { createContext, useContext } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type DayViewMode = "edit" | "preview";

export interface ThemeContextType {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  colorScheme: "light" | "dark";
  dayViewMode: DayViewMode;
  setDayViewMode: (mode: DayViewMode) => void;
  hasSeenOnboarding: boolean;
  completeOnboarding: () => Promise<void>;
}

export const ThemeContext = createContext<ThemeContextType | undefined>(
  undefined,
);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
