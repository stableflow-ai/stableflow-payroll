export const MOCK_ENABLED = {
  payroll: true,
} as const;

export type MockDomain = keyof typeof MOCK_ENABLED;
