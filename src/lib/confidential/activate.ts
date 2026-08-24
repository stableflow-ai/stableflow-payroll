import type { ChainKind, IntentSignInput, IntentSignedPayload } from "@/wallet";
import { INTENT_SIGN_TTL_MS, INTENTS_RECIPIENT } from "@/wallet/intents-sign";
import { authenticateUser, OneClickAuthError, probePrivateBalances } from "./one-click-auth";
import { createAuthNonce, getIntentsContractSalt } from "./versioned-nonce";
import {
  getNearintentsAccessToken,
  hasUsableNearintentsUserSession,
  readNearintentsUserSession,
  sessionNeedsRefresh,
  useNearintentsUserSessionStore,
  type NearintentsUserSession,
} from "@/stores/nearintents-user-session";
import { toIntentsAccountId } from "./to-intents-account-id";

export interface ActivateConfidentialInput {
  address: string;
  chainKind: ChainKind;
  signMessage: (input: IntentSignInput) => Promise<IntentSignedPayload>;
}

export interface ActivateConfidentialResult {
  session: NearintentsUserSession;
  corsFallback: boolean;
}

function sessionFromAuth(
  intentsAccountId: string,
  auth: { accessToken: string; refreshToken: string; expiresIn: number; refreshExpiresIn: number },
  now = Date.now(),
): NearintentsUserSession {
  return {
    intentsAccountId,
    accessToken: auth.accessToken,
    refreshToken: auth.refreshToken,
    accessExpiresAt: now + Math.max(auth.expiresIn, 1) * 1000,
    refreshExpiresAt: now + Math.max(auth.refreshExpiresIn, 1) * 1000,
    signedLocally: false,
  };
}

export async function getAccessToken(intentsAccountId: string): Promise<string | null> {
  return getNearintentsAccessToken(intentsAccountId);
}

/**
 * Prove ownership with an empty-intents MultiPayload, then exchange it for a
 * Near Intents User-Session. Existing unexpired sessions skip the wallet prompt.
 */
export async function activateConfidentialAccount(
  input: ActivateConfidentialInput,
): Promise<ActivateConfidentialResult> {
  const intentsAccountId = toIntentsAccountId(input.address, input.chainKind);
  const store = useNearintentsUserSessionStore.getState();

  if (hasUsableNearintentsUserSession(intentsAccountId)) {
    const existing = readNearintentsUserSession(intentsAccountId);
    if (existing) {
      if (sessionNeedsRefresh(existing)) {
        const token = await getNearintentsAccessToken(intentsAccountId);
        if (!token && !existing.signedLocally) {
          // Refresh failed; fall through to re-sign.
        } else {
          const latest = readNearintentsUserSession(intentsAccountId) ?? existing;
          return { session: latest, corsFallback: latest.signedLocally };
        }
      } else {
        return { session: existing, corsFallback: existing.signedLocally };
      }
    }
  }

  // 1Click rejects opaque random nonces with "timestamp validation failed".
  // Use a V1 versioned nonce (contract salt + deadline + timestamped random).
  const deadlineMs = Date.now() + INTENT_SIGN_TTL_MS;
  const salt = await getIntentsContractSalt();
  const signed = await input.signMessage({
    signerId: intentsAccountId,
    nonce: createAuthNonce(salt, deadlineMs),
    deadlineMs,
    recipient: INTENTS_RECIPIENT,
  });

  try {
    const auth = await authenticateUser(signed);
    const session = sessionFromAuth(intentsAccountId, auth);
    store.upsert(session);
    if (session.accessToken) {
      void probePrivateBalances(session.accessToken);
    }
    return { session, corsFallback: false };
  } catch (error) {
    // Authenticate can be blocked by CORS in the browser. The switch still
    // requires a successful wallet signature; do not treat CORS as success
    // without signing. Add a same-origin proxy or CORS allowlist later.
    if (error instanceof OneClickAuthError && error.corsLikely) {
      const session: NearintentsUserSession = {
        intentsAccountId,
        accessToken: null,
        refreshToken: null,
        accessExpiresAt: 0,
        refreshExpiresAt: 0,
        signedLocally: true,
      };
      store.upsert(session);
      return { session, corsFallback: true };
    }
    throw error;
  }
}
