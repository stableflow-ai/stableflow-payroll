import { describe, expect, it } from "vitest";
import {
  emailAvatarGradient,
  emailAvatarInitial,
  emailAvatarSeed,
} from "./EmailAvatar";

describe("email avatar", () => {
  it("seeds from a lowercased trimmed email", () => {
    expect(emailAvatarSeed("  Ada@Example.COM  ", "Ada")).toBe("ada@example.com");
    expect(emailAvatarSeed("   ", "Ada Lovelace")).toBe("Ada Lovelace");
    expect(emailAvatarSeed("", "")).toBe("?");
  });

  it("uses the email local-part initial, then the name", () => {
    expect(emailAvatarInitial("Ada Lovelace", "bob@example.com")).toBe("B");
    expect(emailAvatarInitial("Ada Lovelace", "ada@example.com")).toBe("A");
    expect(emailAvatarInitial("Ada Lovelace", "  ")).toBe("A");
    expect(emailAvatarInitial("", "  ")).toBe("?");
  });

  it("keeps the same gradient for the same email and differs across emails", () => {
    const first = emailAvatarGradient(emailAvatarSeed("ada@example.com"));
    const again = emailAvatarGradient(emailAvatarSeed("ADA@example.com"));
    const other = emailAvatarGradient(emailAvatarSeed("bob@example.com"));
    expect(first).toBe(again);
    expect(first).not.toBe(other);
    expect(first.startsWith("linear-gradient(135deg, hsl(")).toBe(true);
  });
});
