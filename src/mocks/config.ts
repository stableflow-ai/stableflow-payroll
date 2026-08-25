export const MOCK_ENABLED = {
  partnerReports: true,
} as const;

export type MockDomain = keyof typeof MOCK_ENABLED;
