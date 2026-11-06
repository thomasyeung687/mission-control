import "server-only";
import { liveBackend } from "./live";
import { mockBackend } from "./mock";
import type { Backend } from "./types";

export function isMockMode(): boolean {
  return process.env.MOCK === "1" || process.env.MOCK === "true";
}

export function backend(): Backend {
  return isMockMode() ? mockBackend : liveBackend;
}

export { BackendError } from "./types";
export type { Backend, LiveStream } from "./types";
