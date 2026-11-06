"use client";

import { useLayoutEffect, useRef } from "react";

const NEAR_BOTTOM_PX = 120;

export function useStickToBottom(deps: unknown[]) {
  const ref = useRef<HTMLDivElement>(null);
  const pinned = useRef(true);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    const onScroll = () => {
      pinned.current =
        element.scrollHeight - element.scrollTop - element.clientHeight < NEAR_BOTTOM_PX;
    };
    element.addEventListener("scroll", onScroll, { passive: true });
    return () => element.removeEventListener("scroll", onScroll);
  }, []);

  useLayoutEffect(() => {
    const element = ref.current;
    if (element && pinned.current) element.scrollTop = element.scrollHeight;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}
