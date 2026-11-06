import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";
import styles from "./login.module.css";

export const metadata: Metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/runs";
  return (
    <main className={styles.wrap}>
      <div className={styles.card}>
        <h1>Mission Control</h1>
        <p className={styles.sub}>Sign in to manage your agents.</p>
        {process.env.MISSION_CONTROL_PASSWORD ? (
          <LoginForm next={safeNext} />
        ) : (
          <p className={styles.error}>
            Set <code>MISSION_CONTROL_PASSWORD</code> in <code>.env.local</code> and restart.
          </p>
        )}
      </div>
    </main>
  );
}
