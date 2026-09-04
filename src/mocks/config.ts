export const MOCK_ENABLED = {
  paymentForms: true,
  team: true,
  employeeOverview: true,
} as const;

export type MockDomain = keyof typeof MOCK_ENABLED;
