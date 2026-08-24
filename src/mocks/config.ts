export const MOCK_ENABLED = {
  home: true,
  contacts: true,
  request: true,
  history: true,
  analytics: true,
} as const;

export type MockDomain = keyof typeof MOCK_ENABLED;
