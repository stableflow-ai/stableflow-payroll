import type { ChainKind, IntentSignInput, IntentSignedPayload } from "@/wallet";
import { INTENT_SIGN_TTL_MS, INTENTS_RECIPIENT } from "@/wallet/intents-sign";
import { authenticateUser, OneClickAuthError, probePrivateBalances, refreshUserSession } from "./one-click-auth";
import { createAuthNonce, getIntentsContractSalt } from "./versioned-nonce";
import {
  hasUsableSession,
  readUserSession,
  sessionNeedsRefresh,
  writeUserSession,
  type UserSession,
} from "./session";
import { toIntentsAccountId } from "./to-intents-account-id";

export interface ActivateConfidentialInput {
  address: string;
  chainKind: ChainKind;
  signMessage: (input: IntentSignInput) => Promise<IntentSignedPayload>;
}

export interface ActivateConfidentialResult {
  session: UserSession;
  corsFallback: boolean;
}

function sessionFromAuth(
  intentsAccountId: string,
  auth: { accessToken: string; refreshToken: string; expiresIn: number; refreshExpiresIn: number },
  now = Date.now(),
): UserSession {
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
  const session = readUserSession(intentsAccountId);
  if (!session) return null;
  if (session.signedLocally) return null;
  if (!sessionNeedsRefresh(session)) return session.accessToken;
  if (!session.refreshToken) return null;
  try {
    const next = await refreshUserSession(session.refreshToken);
    const updated: UserSession = {
      ...session,
      accessToken: next.accessToken,
      accessExpiresAt: Date.now() + Math.max(next.expiresIn, 1) * 1000,
    };
    writeUserSession(updated);
    return updated.accessToken;
  } catch {
    return null;
  }
}

/**
 * Prove ownership with an empty-intents MultiPayload, then exchange it for a
 * User-Session. Existing unexpired sessions skip the wallet prompt.
 */
export async function activateConfidentialAccount(
  input: ActivateConfidentialInput,
): Promise<ActivateConfidentialResult> {
  const intentsAccountId = toIntentsAccountId(input.address, input.chainKind);

  if (hasUsableSession(intentsAccountId)) {
    const existing = readUserSession(intentsAccountId);
    if (existing) {
      if (sessionNeedsRefresh(existing)) {
        await getAccessToken(intentsAccountId);
      }
      const latest = readUserSession(intentsAccountId) ?? existing;
      return { session: latest, corsFallback: latest.signedLocally };
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
    writeUserSession(session);
    if (session.accessToken) {
      void probePrivateBalances(session.accessToken);
    }
    return { session, corsFallback: false };
  } catch (error) {
    // Authenticate can be blocked by CORS in the browser. The switch still
    // requires a successful wallet signature; do not treat CORS as success
    // without signing. Add a same-origin proxy or CORS allowlist later.
    if (error instanceof OneClickAuthError && error.corsLikely) {
      const session: UserSession = {
        intentsAccountId,
        accessToken: null,
        refreshToken: null,
        accessExpiresAt: 0,
        refreshExpiresAt: 0,
        signedLocally: true,
      };
      writeUserSession(session);
      return { session, corsFallback: true };
    }
    throw error;
  }
}
