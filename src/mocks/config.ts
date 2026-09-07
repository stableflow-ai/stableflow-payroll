export const MOCK_ENABLED = {
  paymentForms: true,
  employeeOverview: true,
  payroll: true,
  bonus: true,
  history: true,
} as const;

export type MockDomain = keyof typeof MOCK_ENABLED;
