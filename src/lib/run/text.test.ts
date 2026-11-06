import { describe, expect, it } from "vitest";
import { normalizeRepo, summarizeToolInput, titleFromMessage } from "./text";

describe("normalizeRepo", () => {
  it("accepts owner/repo, URLs and short names with a default owner", () => {
    expect(normalizeRepo("thomasyeung687/golf-native")).toBe("thomasyeung687/golf-native");
    expect(normalizeRepo("https://github.com/a/b.git")).toBe("a/b");
    expect(normalizeRepo("golf-native", "thomasyeung687")).toBe("thomasyeung687/golf-native");
  });
  it("rejects junk", () => {
    expect(normalizeRepo("not a repo")).toBeNull();
    expect(normalizeRepo("")).toBeNull();
  });
});

describe("summarizeToolInput", () => {
  it("prefers the most descriptive field", () => {
    expect(summarizeToolInput({ command: "ls -la\n  foo" })).toBe("ls -la foo");
    expect(summarizeToolInput({ file_path: "a.ts", content: "x" })).toBe("a.ts");
    expect(summarizeToolInput({})).toBe("");
  });
});

describe("titleFromMessage", () => {
  it("uses the first line, truncated", () => {
    expect(titleFromMessage("Fix it\nmore detail")).toBe("Fix it");
    expect(titleFromMessage("x".repeat(100))).toHaveLength(72);
  });
});
