interface Block {
  type: string;
  text?: string;
}

export function blocksToText(blocks: readonly Block[]): string {
  return blocks
    .map((block) => {
      if (block.type === "text") return block.text ?? "";
      if (block.type === "redacted") return "[redacted]";
      return `[${block.type}]`;
    })
    .join("\n")
    .trim();
}

export function errorMessage(error: { type: string; message?: string }): string {
  const label = error.type.replaceAll("_", " ");
  return error.message ? `${label}: ${error.message}` : label;
}

const SUMMARY_KEYS = ["command", "file_path", "path", "pattern", "url", "query", "description"];

export function summarizeToolInput(input: Record<string, unknown>): string {
  for (const key of SUMMARY_KEYS) {
    const value = input[key];
    if (typeof value === "string" && value.trim()) return oneLine(value);
  }
  const first = Object.values(input).find((value) => typeof value === "string");
  return typeof first === "string" ? oneLine(first) : "";
}

function oneLine(value: string, max = 140): string {
  const flat = value.replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

export function titleFromMessage(message: string, max = 72): string {
  return oneLine(message.split("\n")[0] ?? message, max);
}

export function repoFromUrl(url: string): string {
  return url
    .replace(/^https?:\/\/github\.com\//, "")
    .replace(/\.git$/, "")
    .replace(/\/$/, "");
}

export function normalizeRepo(raw: string, defaultOwner?: string): string | null {
  const cleaned = repoFromUrl(raw.trim());
  if (!cleaned) return null;
  const withOwner = cleaned.includes("/") || !defaultOwner ? cleaned : `${defaultOwner}/${cleaned}`;
  return /^[\w.-]+\/[\w.-]+$/.test(withOwner) ? withOwner : null;
}
