"use client";

import { useEffect, useState } from "react";

const UNITS: Array<[number, Intl.RelativeTimeFormatUnit]> = [
  [60, "second"],
  [60, "minute"],
  [24, "hour"],
  [7, "day"],
  [4.35, "week"],
  [12, "month"],
  [Infinity, "year"],
];

const format = new Intl.RelativeTimeFormat("en", { numeric: "auto", style: "short" });

export function relative(iso: string, now: number): string {
  let value = (Date.parse(iso) - now) / 1000;
  for (const [size, unit] of UNITS) {
    if (Math.abs(value) < size) return format.format(Math.round(value), unit);
    value /= size;
  }
  return iso;
}

export function RelativeTime({ iso }: { iso: string }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);
  return (
    <time dateTime={iso} title={new Date(iso).toLocaleString()} suppressHydrationWarning>
      {relative(iso, now)}
    </time>
  );
}
