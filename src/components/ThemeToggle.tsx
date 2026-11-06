"use client";

import { useState } from "react";
import styles from "./AppNav.module.css";

type Theme = "system" | "light" | "dark";
const NEXT: Record<Theme, Theme> = { system: "light", light: "dark", dark: "system" };
const LABEL: Record<Theme, string> = { system: "Auto", light: "Light", dark: "Dark" };

export function ThemeToggle({ initial }: { initial: Theme }) {
  const [theme, setTheme] = useState<Theme>(initial);
  function cycle() {
    const next = NEXT[theme];
    setTheme(next);
    document.cookie = `mc_theme=${next}; path=/; max-age=31536000; samesite=lax`;
    if (next === "system") document.documentElement.removeAttribute("data-theme");
    else document.documentElement.dataset.theme = next;
  }
  return (
    <button
      type="button"
      className={styles.themeButton}
      onClick={cycle}
      title={`Theme: ${LABEL[theme]}`}
      aria-label={`Theme: ${LABEL[theme]}`}
    >
      <span className={styles.themeIcon} aria-hidden="true" />
      <span className={styles.themeLabel}>{LABEL[theme]}</span>
    </button>
  );
}
