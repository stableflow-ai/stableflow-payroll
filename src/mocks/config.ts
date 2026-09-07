export const MOCK_ENABLED = {
  employeeOverview: true,
  payroll: true,
  expense: true,
  bonus: true,
  history: true,
} as const;

export type MockDomain = keyof typeof MOCK_ENABLED;
