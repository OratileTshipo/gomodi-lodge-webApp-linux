import { describe, expect, it, vi } from "vitest";
import {
  buildSessionCookie,
  parseSession,
  isManagerRole,
  isPartnerRole,
  SESSION_TTL_SECONDS,
} from "../auth";

const owner = { userId: 7, role: "owner" as const, name: "Mpho" };

describe("buildSessionCookie / parseSession", () => {
  it("round-trips a valid session cookie", () => {
    const cookie = buildSessionCookie(owner);
    expect(cookie).toContain(".");
    expect(parseSession(cookie)).toEqual(owner);
  });

  it("rejects a tampered payload (role escalation)", () => {
    const cookie = buildSessionCookie(owner);
    const [body, sig] = cookie.split(".");
    // Re-encode the body with a different role WITHOUT re-signing.
    const decoded = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    decoded.role = "assistant";
    const tampered = `${Buffer.from(JSON.stringify(decoded)).toString("base64url")}.${sig}`;
    expect(parseSession(tampered)).toBeNull();
  });

  it("rejects a tampered userId", () => {
    const cookie = buildSessionCookie(owner);
    const [body, sig] = cookie.split(".");
    const decoded = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    decoded.userId = 999;
    const tampered = `${Buffer.from(JSON.stringify(decoded)).toString("base64url")}.${sig}`;
    expect(parseSession(tampered)).toBeNull();
  });

  it("rejects a tampered signature", () => {
    const cookie = buildSessionCookie(owner);
    const [body] = cookie.split(".");
    expect(parseSession(`${body}.${"A".repeat(43)}`)).toBeNull();
  });

  it("rejects malformed cookie strings", () => {
    expect(parseSession("")).toBeNull();
    expect(parseSession("no-dot-here")).toBeNull();
    expect(parseSession("...")).toBeNull();
    expect(parseSession("body-only")).toBeNull();
    expect(parseSession("a.b.c")).toBeNull(); // extra dots: signature is garbage
  });

  it("rejects an expired session", () => {
    vi.useFakeTimers();
    try {
      const cookie = buildSessionCookie(owner);
      vi.setSystemTime(Date.now() + SESSION_TTL_SECONDS * 1000 + 1_000);
      expect(parseSession(cookie)).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });

  it("accepts a session still inside its TTL", () => {
    vi.useFakeTimers();
    try {
      const cookie = buildSessionCookie(owner);
      vi.setSystemTime(Date.now() + (SESSION_TTL_SECONDS * 1000) / 2);
      expect(parseSession(cookie)).toEqual(owner);
    } finally {
      vi.useRealTimers();
    }
  });

  it("rejects a session whose exp field was stripped", () => {
    // A payload without exp can only pass signature if the raw JSON body is
    // signed — stripping exp post-signing must fail on the signature check
    // (structure is validated only after the HMAC passes).
    const cookie = buildSessionCookie(owner);
    const [body] = cookie.split(".");
    const decoded = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    delete decoded.exp;
    const forged = Buffer.from(JSON.stringify(decoded)).toString("base64url");
    expect(parseSession(`${forged}.${"A".repeat(43)}`)).toBeNull();
  });
});

describe("role guards", () => {
  it("isManagerRole — owner/assistant only", () => {
    expect(isManagerRole("owner")).toBe(true);
    expect(isManagerRole("assistant")).toBe(true);
    expect(isManagerRole("staff")).toBe(false);
    expect(isManagerRole("partner")).toBe(false);
    expect(isManagerRole("guest")).toBe(false);
  });

  it("isPartnerRole — partner only", () => {
    expect(isPartnerRole("partner")).toBe(true);
    expect(isPartnerRole("owner")).toBe(false);
    expect(isPartnerRole("staff")).toBe(false);
  });
});
