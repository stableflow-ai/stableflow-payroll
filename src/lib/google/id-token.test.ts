import { describe, expect, it } from "vitest";
import { parseGoogleCredential } from "./id-token";

function jwtWithPayload(payload: Record<string, unknown>): string {
  const json = JSON.stringify(payload);
  const b64 = Buffer.from(json, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
  return `header.${b64}.sig`;
}

describe("parseGoogleCredential", () => {
  it("reads name and email from the JWT payload", () => {
    const idToken = jwtWithPayload({ name: "Ada Lovelace", email: "ada@example.com" });
    expect(parseGoogleCredential(idToken)).toEqual({
      idToken,
      name: "Ada Lovelace",
      email: "ada@example.com",
    });
  });

  it("returns empty profile fields when the token is not a JWT", () => {
    expect(parseGoogleCredential("not-a-jwt")).toEqual({
      idToken: "not-a-jwt",
      name: "",
      email: "",
    });
  });
});
