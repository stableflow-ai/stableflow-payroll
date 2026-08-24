export const MOCK_ENABLED = {
  home: true,
  contacts: true,
  request: true,
  history: true,
  analytics: true,
  partner: true,
} as const;

export type MockDomain = keyof typeof MOCK_ENABLED;
