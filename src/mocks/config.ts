export const MOCK_ENABLED = {
  request: true,
  partner: true,
} as const;

export type MockDomain = keyof typeof MOCK_ENABLED;
