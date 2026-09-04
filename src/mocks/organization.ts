/**
 * TODO(api): mock data until the organization contract exists.
 * Replace with:
 *   1. types in src/types/<domain>.ts
 *   2. a function in src/api/<domain>.ts
 *   3. a key in src/api/query-keys.ts
 *   4. queryFn -> the real api function
 *   5. delete src/mocks/organization.ts and its MOCK_ENABLED entry
 */

export type CreateOrganizationInput = {
  name: string;
  logoUrl?: string;
};

export type CreatedOrganization = {
  name: string;
  logoUrl?: string;
};

function delay(ms: number) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

export async function createOrganization(input: CreateOrganizationInput): Promise<CreatedOrganization> {
  await delay(400);
  return {
    name: input.name.trim(),
    logoUrl: input.logoUrl?.trim() || undefined,
  };
}
