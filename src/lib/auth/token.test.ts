import { describe, expect, it } from "vitest";
import { passwordMatches, signSession, verifySession } from "./token";

describe("session tokens", () => {
  it("verifies a token signed with the same secret", async () => {
    expect(await verifySession("s", await signSession("s"))).toBe(true);
  });

  it("rejects other secrets, tampering, expiry and junk", async () => {
    const token = await signSession("s");
    expect(await verifySession("other", token)).toBe(false);
    expect(await verifySession("s", `9${token}`)).toBe(false);
    expect(await verifySession("s", token, Date.now() + 31 * 86_400_000)).toBe(false);
    expect(await verifySession("s", "nonsense")).toBe(false);
    expect(await verifySession("s", undefined)).toBe(false);
  });
});

describe("passwordMatches", () => {
  it("compares passwords", async () => {
    expect(await passwordMatches("hunter2", "hunter2")).toBe(true);
    expect(await passwordMatches("hunter2", "hunter3")).toBe(false);
  });
});
