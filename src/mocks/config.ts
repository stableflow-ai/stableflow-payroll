export const MOCK_ENABLED = {
  employeeOverview: true,
  payroll: true,
} as const;

export type MockDomain = keyof typeof MOCK_ENABLED;
