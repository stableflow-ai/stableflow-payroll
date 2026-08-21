export const MOCK_ENABLED = {
  home: true,
  contacts: true,
} as const;

export type MockDomain = keyof typeof MOCK_ENABLED;
