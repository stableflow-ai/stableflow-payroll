import { describe, expect, it } from "vitest";
import { drawerRowFieldError, firstDrawerFormError, type DrawerFormErrorRow } from "./form-drawer-utils";

function row(partial: Partial<DrawerFormErrorRow> = {}): DrawerFormErrorRow {
  return {
    name: "Ada",
    addressError: null,
    email: "",
    token: { id: "usdc" },
    amount: "10",
    ...partial,
  };
}

describe("drawerRowFieldError", () => {
  it("checks name, address, email, token, then amount", () => {
    expect(drawerRowFieldError(row({ name: "  " }))).toBe("Name is required");
    expect(drawerRowFieldError(row({ addressError: "Unrecognized address" }))).toBe(
      "Unrecognized address",
    );
    expect(drawerRowFieldError(row({ email: "not-an-email" }))).toBe("Enter a valid email");
    expect(drawerRowFieldError(row({ token: null }))).toBe("Select a token");
    expect(drawerRowFieldError(row({ amount: "" }))).toBe("Amount is required");
    expect(drawerRowFieldError(row({ amount: "0" }))).toBe("Amount must be greater than 0");
    expect(drawerRowFieldError(row())).toBeNull();
  });
});

describe("firstDrawerFormError", () => {
  it("reports an empty title before row errors", () => {
    expect(
      firstDrawerFormError({
        titleLabel: "Bonus Title",
        title: "  ",
        rows: [row({ name: "" })],
      }),
    ).toBe("Bonus Title is required");
  });

  it("prefixes table errors with the row number", () => {
    expect(
      firstDrawerFormError({
        titleLabel: "Expense Title",
        title: "September",
        rows: [row(), row({ name: "" })],
      }),
    ).toBe("Row 2: Name is required");
  });

  it("skips the title check when no titleLabel is passed", () => {
    expect(firstDrawerFormError({ rows: [row({ name: "" })] })).toBe("Row 1: Name is required");
  });

  it("returns null when title and rows are valid", () => {
    expect(
      firstDrawerFormError({
        titleLabel: "Payment Title",
        title: "Office",
        rows: [row()],
      }),
    ).toBeNull();
  });
});
