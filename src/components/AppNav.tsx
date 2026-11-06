"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useInboxCount } from "./useInboxCount";
import styles from "./AppNav.module.css";
import { ThemeToggle } from "./ThemeToggle";

const LINKS = [
  { href: "/runs", label: "Runs", icon: "≡" },
  { href: "/inbox", label: "Needs you", icon: "◆" },
  { href: "/runs/new", label: "New run", icon: "+" },
  { href: "/agents", label: "Agents", icon: "◎" },
] as const;

function isActive(pathname: string, href: string): boolean {
  if (href === "/runs") return pathname === "/runs" || /^\/runs\/(?!new)/.test(pathname);
  return pathname.startsWith(href);
}

export function AppNav({ theme, mock }: { theme: "system" | "light" | "dark"; mock: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const signOut = () =>
    void fetch("/api/logout", { method: "POST" }).then(() => {
      router.push("/login");
      router.refresh();
    });
  const inboxCount = useInboxCount();
  const links = LINKS.map((link) => (
    <Link
      key={link.href}
      href={link.href}
      className={`${styles.link} ${isActive(pathname, link.href) ? styles.active : ""}`}
    >
      <span className={styles.tabIcon} aria-hidden="true">
        {link.icon}
      </span>
      <span className={styles.linkLabel}>{link.label}</span>
      {link.href === "/inbox" && inboxCount > 0 ? (
        <span className={styles.count} aria-label={`${inboxCount} runs need you`}>
          {inboxCount}
        </span>
      ) : null}
    </Link>
  ));
  return (
    <>
      <header className={styles.bar}>
        <Link href="/runs" className={styles.brand}>
          <span className={styles.logo} aria-hidden="true" />
          Mission Control
        </Link>
        {mock ? <span className={styles.mock}>Mock data</span> : null}
        <nav className={styles.links} aria-label="Main">
          {links}
        </nav>
        <div className={styles.tools}>
          <ThemeToggle initial={theme} />
          <button type="button" className={styles.themeButton} onClick={signOut}>
            Sign out
          </button>
        </div>
      </header>
      <nav className={styles.tabbar} aria-label="Main">
        {links}
      </nav>
    </>
  );
}
