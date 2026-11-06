import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { BackendError } from "../types";

let client: Anthropic | null = null;

export function anthropic(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new BackendError(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local, or run with MOCK=1.",
      503,
    );
  }
  client ??= new Anthropic();
  return client;
}

export function githubToken(): string {
  const token = process.env.GITHUB_TOKEN;
  if (!token) throw new BackendError("GITHUB_TOKEN is not set; it is needed to mount repos.", 503);
  return token;
}
