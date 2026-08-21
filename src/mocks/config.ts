export const MOCK_ENABLED = {
  home: true,
} as const;

export type MockDomain = keyof typeof MOCK_ENABLED;
