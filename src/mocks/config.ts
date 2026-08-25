export const MOCK_ENABLED = {
  partner: true,
} as const;

export type MockDomain = keyof typeof MOCK_ENABLED;
