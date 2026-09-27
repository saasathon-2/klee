import { useEffect, useState, type ReactNode } from "react";
import { ThemeContext, type Accent, type Theme } from "./theme-context";

function getInitialTheme(): Theme {
	const stored = localStorage.getItem("theme");
	if (stored === "light" || stored === "dark") return stored;
	return window.matchMedia("(prefers-color-scheme: dark)").matches
		? "dark"
		: "light";
}

function getInitialAccent(): Accent {
	return "yellow";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
	const [theme, setTheme] = useState<Theme>(getInitialTheme);
	const [accent, setAccent] = useState<Accent>(getInitialAccent);

	useEffect(() => {
		document.documentElement.setAttribute("data-theme", theme);
		localStorage.setItem("theme", theme);
	}, [theme]);
	useEffect(() => {
		document.documentElement.setAttribute("data-accent", accent);
		localStorage.setItem("accent", accent);
	}, [accent]);

	const toggleTheme = () =>
		setTheme((t) => (t === "dark" ? "light" : "dark"));

	return (
		<ThemeContext.Provider
			value={{ theme, accent, setTheme, setAccent, toggleTheme }}
		>
			{children}
		</ThemeContext.Provider>
	);
}
