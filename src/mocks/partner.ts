export type PartnerRegistration = {
  firstName: string;
  lastName: string;
  company: string;
  purpose: string;
  website: string;
  telegram: string;
  additionalDetails: string;
};

export type PartnerApiKey = {
  id: string;
  label: string;
  key: string;
  createdAt: string;
};

let isPartner = false;
let registration: PartnerRegistration | null = null;
let apiKeys: PartnerApiKey[] = [];

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribePartner(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getIsPartner() {
  return isPartner;
}

export function getPartnerRegistration() {
  return registration;
}

export function getPartnerApiKeys(): PartnerApiKey[] {
  return apiKeys;
}

export function registerPartner(input: PartnerRegistration) {
  registration = { ...input };
  isPartner = true;
  emit();
}

export function createApiKey(label: string): PartnerApiKey {
  const next: PartnerApiKey = {
    id: crypto.randomUUID(),
    label: label.trim(),
    key: `sk-${crypto.randomUUID().replaceAll("-", "")}`,
    createdAt: new Date().toISOString(),
  };
  apiKeys = [...apiKeys, next];
  emit();
  return next;
}

export function updateApiKeyLabel(id: string, label: string): PartnerApiKey | null {
  let updated: PartnerApiKey | null = null;
  apiKeys = apiKeys.map((row) => {
    if (row.id !== id) return row;
    updated = { ...row, label: label.trim() };
    return updated;
  });
  if (updated) emit();
  return updated;
}

export function deleteApiKey(id: string) {
  apiKeys = apiKeys.filter((row) => row.id !== id);
  emit();
}
