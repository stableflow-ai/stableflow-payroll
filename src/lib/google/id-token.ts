import { GOOGLE_CLIENT_ID, isGoogleSignInConfigured } from "./config";
import { loadGoogleIdentityScript } from "./load-scripts";

export interface GoogleIdTokenProfile {
  idToken: string;
  name: string;
  email: string;
}

type CredentialListener = (profile: GoogleIdTokenProfile) => void;

let initialized = false;
let credentialListener: CredentialListener | null = null;

function textClaim(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function parseGoogleCredential(idToken: string): GoogleIdTokenProfile {
  const payloadPart = idToken.split(".")[1];
  if (!payloadPart) {
    return { idToken, name: "", email: "" };
  }
  try {
    const padded = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const padLength = (4 - (padded.length % 4)) % 4;
    const bytes = Uint8Array.from(atob(`${padded}${"=".repeat(padLength)}`), (char) =>
      char.charCodeAt(0),
    );
    const payload = JSON.parse(new TextDecoder().decode(bytes)) as Record<string, unknown>;
    return {
      idToken,
      name: textClaim(payload.name),
      email: textClaim(payload.email),
    };
  } catch {
    return { idToken, name: "", email: "" };
  }
}

function handleCredentialResponse(response: google.accounts.id.CredentialResponse) {
  if (!response.credential) return;
  credentialListener?.(parseGoogleCredential(response.credential));
}

export function setGoogleIdCredentialListener(listener: CredentialListener | null) {
  credentialListener = listener;
}

export async function ensureGoogleIdClient(): Promise<typeof google.accounts.id> {
  if (!isGoogleSignInConfigured()) {
    throw new Error("Google sign-in is not configured");
  }
  await loadGoogleIdentityScript();
  const id = window.google?.accounts?.id;
  if (!id) {
    throw new Error("Google Identity Services failed to load");
  }
  if (!initialized) {
    id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
      auto_select: false,
      cancel_on_tap_outside: true,
      ux_mode: "popup",
    });
    initialized = true;
  }
  return id;
}

export function renderGoogleIdButton(parent: HTMLElement, width: number) {
  const id = window.google?.accounts?.id;
  if (!id) return;
  parent.replaceChildren();
  id.renderButton(parent, {
    type: "standard",
    theme: "outline",
    size: "large",
    text: "signin_with",
    shape: "rectangular",
    logo_alignment: "center",
    width,
  });
}
