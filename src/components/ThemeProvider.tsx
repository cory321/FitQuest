import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
	theme: Theme;
	toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
	const [theme, setTheme] = useState<Theme>(() => {
		// Check if class was already applied by blocking script
		const root = document.documentElement;
		if (root.classList.contains('dark')) {
			return 'dark';
		}
		if (root.classList.contains('light')) {
			return 'light';
		}

		// Fallback: Check localStorage first
		const storedTheme = localStorage.getItem('theme') as Theme | null;
		if (storedTheme) {
			return storedTheme;
		}
		// Otherwise check system preference
		if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
			return 'dark';
		}
		return 'light';
	});

	useEffect(() => {
		// Update document class and localStorage when theme changes
		const root = document.documentElement;
		root.classList.remove('light', 'dark');
		root.classList.add(theme);
		localStorage.setItem('theme', theme);

		// Update meta theme-color for mobile browsers
		let metaThemeColor = document.querySelector('meta[name="theme-color"]');
		if (!metaThemeColor) {
			metaThemeColor = document.createElement('meta');
			metaThemeColor.setAttribute('name', 'theme-color');
			document.head.appendChild(metaThemeColor);
		}

		// Set theme color based on current theme
		const bgColor = theme === 'dark' ? 'rgb(15, 23, 42)' : 'rgb(245, 247, 250)';
		metaThemeColor.setAttribute('content', bgColor);
	}, [theme]);

	const toggleTheme = () => {
		setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
	};

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
}

export function useTheme() {
	const context = useContext(ThemeContext);
	if (context === undefined) {
		throw new Error('useTheme must be used within a ThemeProvider');
	}
	return context;
}
