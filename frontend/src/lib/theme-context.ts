import { createContext } from "react";

export type Theme = "light" | "dark";
export type Accent = "yellow" | "blue" | "coral" | "violet";

export interface ThemeContextValue {
	theme: Theme;
	accent: Accent;
	setTheme: (theme: Theme) => void;
	setAccent: (accent: Accent) => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
