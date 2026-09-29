import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

// ============================================================
// CONTEXT
// ============================================================

const ThemeContext = createContext(null);

// ============================================================
// STORAGE KEY
// ============================================================

const THEME_STORAGE_KEY = "twinalai_darkmode";

// ============================================================
// THEME PROVIDER
// ============================================================

export const ThemeProvider = ({ children }) => {
  // ==========================================================
  // INITIAL THEME
  // ==========================================================

  const [darkMode, setDarkMode] = useState(() => {
    try {
      const stored = localStorage.getItem(
        THEME_STORAGE_KEY
      );

      if (stored !== null) {
        return stored === "true";
      }
    } catch (error) {
      console.error(
        "Failed to read theme preference:",
        error
      );
    }

    // Default = LIGHT MODE
    return false;
  });

  // ==========================================================
  // APPLY THEME TO HTML
  // ==========================================================

  useEffect(() => {
    const root = document.documentElement;

    // Always remove both first
    root.classList.remove("dark");
    root.classList.remove("light");

    // Apply exactly one theme
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.add("light");
    }

    // Save preference
    try {
      localStorage.setItem(
        THEME_STORAGE_KEY,
        String(darkMode)
      );
    } catch (error) {
      console.error(
        "Failed to save theme preference:",
        error
      );
    }
  }, [darkMode]);

  // ==========================================================
  // TOGGLE THEME
  // ==========================================================

  const toggleDarkMode = useCallback(() => {
    setDarkMode((previous) => !previous);
  }, []);

  // ==========================================================
  // ENABLE DARK MODE
  // ==========================================================

  const enableDarkMode = useCallback(() => {
    setDarkMode(true);
  }, []);

  // ==========================================================
  // ENABLE LIGHT MODE
  // ==========================================================

  const disableDarkMode = useCallback(() => {
    setDarkMode(false);
  }, []);

  // ==========================================================
  // SET THEME EXPLICITLY
  // ==========================================================

  const setTheme = useCallback((theme) => {
    if (theme === "dark") {
      setDarkMode(true);
      return;
    }

    if (theme === "light") {
      setDarkMode(false);
      return;
    }

    console.warn(
      `Invalid theme "${theme}". Use "light" or "dark".`
    );
  }, []);

  // ==========================================================
  // CONTEXT VALUE
  // ==========================================================

  const value = {
    darkMode,
    toggleDarkMode,
    enableDarkMode,
    disableDarkMode,
    setTheme,
  };

  // ==========================================================
  // PROVIDER
  // ==========================================================

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// ============================================================
// USE THEME
// ============================================================

export const useTheme = () => {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme must be used within ThemeProvider"
    );
  }

  return context;
};