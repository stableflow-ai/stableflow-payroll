export const MOCK_ENABLED = {
  payroll: true,
  reimbursement: true,
  bonus: true,
} as const;

export type MockDomain = keyof typeof MOCK_ENABLED;
