"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const POLL_MS = 20_000;

export function useInboxCount(): number {
  const pathname = usePathname();
  const [count, setCount] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const load = () =>
      fetch("/api/inbox")
        .then((response) => (response.ok ? response.json() : { count: 0 }))
        .then((data: { count: number }) => !cancelled && setCount(data.count))
        .catch(() => undefined);
    void load();
    const timer = setInterval(load, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [pathname]);
  return count;
}
