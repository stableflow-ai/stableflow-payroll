export const MOCK_ENABLED = {
  paymentForms: true,
  team: true,
  employeeOverview: true,
  adminOverview: true,
  payroll: true,
  expense: true,
  bonus: true,
} as const;

export type MockDomain = keyof typeof MOCK_ENABLED;
