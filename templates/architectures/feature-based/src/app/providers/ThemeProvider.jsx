import { useEffect, useState } from "react";
import { ThemeContext } from "../contexts/themecontext";

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") ?? "light"
  );

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.dataset.theme =
      theme === "dark" ? "dark" : "light";
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
