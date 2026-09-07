export const MOCK_ENABLED = {
  paymentForms: true,
  employeeOverview: true,
  payroll: true,
  expense: true,
  bonus: true,
  invite: true,
  history: true,
  settings: true,
} as const;

export type MockDomain = keyof typeof MOCK_ENABLED;
