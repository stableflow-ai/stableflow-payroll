import { useQuery } from "@tanstack/react-query";
import { MOCK_ENABLED } from "@/mocks/config";
import { getBonusOverviewMock } from "@/mocks/bonus";
import { useAuthStore } from "@/stores/auth";
import {
  BONUS_MOCK_VARIANT,
  type BonusMockVariant,
} from "@/views/bonus/config";

/**
 * TODO(api): mock data until the bonus overview contract exists.
 * Replace with:
 *   1. types in src/types/bonus.ts
 *   2. a function in src/api/bonus.ts
 *   3. a key in src/api/query-keys.ts
 *   4. queryFn -> the real api function
 *   5. delete src/mocks/bonus.ts and its MOCK_ENABLED entry
 */
export function useBonusOverviewQuery(
  variant: BonusMockVariant = BONUS_MOCK_VARIANT.Empty,
) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: ["mock", "bonus", "overview", variant],
    queryFn: () => getBonusOverviewMock(variant),
    enabled: Boolean(token) && MOCK_ENABLED.bonus,
    placeholderData: (previous) => previous,
  });
}
