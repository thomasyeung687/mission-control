import "server-only";
import { cookies } from "next/headers";

export type Theme = "system" | "light" | "dark";

export async function currentTheme(): Promise<Theme> {
  const value = (await cookies()).get("mc_theme")?.value;
  return value === "light" || value === "dark" ? value : "system";
}
