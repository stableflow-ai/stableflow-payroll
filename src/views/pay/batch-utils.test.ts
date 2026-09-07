import { describe, expect, it } from "vitest";
import { batchEmailError, isDraftValid, parseImportRows } from "./batch-utils";

const findNone = () => undefined;

describe("parseImportRows", () => {
  it("reads email from a named header after recipient", () => {
    const rows = parseImportRows(
      [
        ["recipient", "email", "amount", "token", "network", "memo"],
        ["0x557be3f47a45499385f60cd64e2ff455e42a3311", "alice@example.com", "100", "USDC", "eth", "payroll"],
      ],
      findNone,
      "",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.email).toBe("alice@example.com");
    expect(rows[0]?.address).toBe("0x557be3f47a45499385f60cd64e2ff455e42a3311");
    expect(rows[0]?.amount).toBe("100");
  });

  it("leaves email empty when the header is absent", () => {
    const rows = parseImportRows(
      [
        ["recipient", "amount", "token", "network", "memo"],
        ["0x557be3f47a45499385f60cd64e2ff455e42a3311", "100", "USDC", "eth", "payroll"],
      ],
      findNone,
      "",
    );
    expect(rows[0]?.email).toBe("");
    expect(rows[0]?.amount).toBe("100");
  });

  it("does not treat the second positional column as email", () => {
    const rows = parseImportRows(
      [["0x557be3f47a45499385f60cd64e2ff455e42a3311", "100", "USDC", "eth", "payroll"]],
      findNone,
      "",
    );
    expect(rows[0]?.email).toBe("");
    expect(rows[0]?.amount).toBe("100");
  });
});

describe("batchEmailError", () => {
  it("allows an empty email and rejects an invalid one", () => {
    expect(batchEmailError("")).toBeNull();
    expect(batchEmailError("not-an-email")).toBe("Enter a valid email");
    expect(batchEmailError("alice@example.com")).toBeNull();
  });
});

describe("isDraftValid", () => {
  it("rejects a filled but invalid email", () => {
    const [row] = parseImportRows(
      [
        ["recipient", "email", "amount", "token", "network", "memo"],
        ["0x557be3f47a45499385f60cd64e2ff455e42a3311", "bad", "100", "USDC", "eth", ""],
      ],
      findNone,
      "",
    );
    expect(row).toBeDefined();
    if (!row) return;
    expect(batchEmailError(row.email)).toBe("Enter a valid email");
    expect(isDraftValid(row)).toBe(false);
  });
});
