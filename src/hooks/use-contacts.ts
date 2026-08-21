import { useEffect, useState } from "react";
import { MOCK_ENABLED } from "@/mocks/config";
import {
  addContact,
  deleteContact,
  getContacts,
  subscribeContacts,
  updateContact,
  type Contact,
} from "@/mocks/contacts";

export type { Contact };

// TODO(api): replace mock read with TanStack Query when the backend contract is ready.
// 1. Add types in src/types/contacts.ts from the real API (do not reuse mock-local types blindly).
// 2. Add src/api/contacts.ts using http() and append the endpoint table in doc/api.md.
// 3. Add queryKeys.contacts in src/api/query-keys.ts.
// 4. Switch this hook to useQuery ({ enabled: Boolean(token), queryFn: real api }).
// 5. Set MOCK_ENABLED.contacts = false and delete src/mocks/contacts.ts.
export function useContacts() {
  if (!MOCK_ENABLED.contacts) {
    throw new Error("Contacts mock is disabled. Wire TanStack Query before turning MOCK_ENABLED.contacts off.");
  }

  const [contacts, setContacts] = useState<Contact[]>(() => getContacts());

  useEffect(() => {
    return subscribeContacts(() => {
      setContacts([...getContacts()]);
    });
  }, []);

  return {
    contacts,
    addContact,
    updateContact,
    deleteContact,
  };
}
