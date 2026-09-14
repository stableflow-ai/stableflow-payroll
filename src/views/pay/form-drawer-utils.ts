import { amountError, batchEmailError } from "./batch-utils";

export interface DrawerFormErrorRow {
  name: string;
  addressError: string | null;
  email: string;
  token: unknown | null;
  amount: string;
}

export function drawerRowFieldError(row: DrawerFormErrorRow): string | null {
  if (!row.name.trim()) return "Name is required";
  if (row.addressError) return row.addressError;
  const email = batchEmailError(row.email);
  if (email) return email;
  if (!row.token) return "Select a token";
  return amountError(row.amount);
}

export function firstDrawerFormError(input: {
  titleLabel?: string;
  title?: string;
  rows: readonly DrawerFormErrorRow[];
}): string | null {
  if (input.titleLabel && !input.title?.trim()) {
    return `${input.titleLabel} is required`;
  }
  for (let index = 0; index < input.rows.length; index += 1) {
    const row = input.rows[index];
    if (!row) continue;
    const error = drawerRowFieldError(row);
    if (error) return `Row ${index + 1}: ${error}`;
  }
  return null;
}
