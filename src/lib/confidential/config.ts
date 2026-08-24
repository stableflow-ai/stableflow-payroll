export const ONE_CLICK_API_URL = "https://1click.chaindefuser.com";
export const ACCESS_REFRESH_SKEW_MS = 60_000;
export const NEARINTENTS_USER_SESSION_STORAGE_PREFIX = "stableflow-pay.nearintents-user-session.";

/** First 4 bytes of sha256("versioned_nonce"); marks a V1 Intents nonce. */
export const VERSIONED_NONCE_MAGIC = new Uint8Array([0x56, 0x28, 0xf6, 0xc6]);
export const VERSIONED_NONCE_VERSION = 0;
export const VERSIONED_NONCE_RANDOM_LENGTH = 15;
export const INTENTS_SALT_TTL_MS = 5 * 60_000;
export const INTENTS_SALT_METHOD = "current_salt";
