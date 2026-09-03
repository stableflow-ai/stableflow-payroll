export const MOCK_ENABLED = {
  paymentForms: true,
} as const;

export type MockDomain = keyof typeof MOCK_ENABLED;
