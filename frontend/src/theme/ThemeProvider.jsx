import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const THEME_STORAGE_KEY = "theme";
const LIGHT_THEME = "light";
const DARK_THEME = "dark";

const ThemeContext = createContext(null);

const getSystemTheme = () => {
  if (typeof window === "undefined") {
    return LIGHT_THEME;
  }

  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? DARK_THEME
    : LIGHT_THEME;
};

const getInitialTheme = () => {
  if (typeof window === "undefined") {
    return LIGHT_THEME;
  }

  try {
    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);

    if (storedTheme === LIGHT_THEME || storedTheme === DARK_THEME) {
      return storedTheme;
    }
  } catch (error) {
    // Ignore storage failures and fall back to system preference.
  }

  return getSystemTheme();
};

const applyTheme = (theme) => {
  if (typeof document === "undefined") {
    return;
  }

  const root = document.documentElement;
  root.classList.toggle("dark", theme === DARK_THEME);
  root.style.colorScheme = theme;

  const themeColor = theme === DARK_THEME ? "#020617" : "#ffffff";
  const themeColorMeta = document.querySelector('meta[name="theme-color"]');

  if (themeColorMeta) {
    themeColorMeta.setAttribute("content", themeColor);
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch (error) {
    // Persisting the preference is best effort.
  }
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      isDarkMode: theme === DARK_THEME,
      setTheme,
      toggleTheme: () => {
        setTheme((currentTheme) =>
          currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME,
        );
      },
    }),
    [theme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useThemeContext = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }

  return context;
};

export default ThemeProvider;