export type Contact = {
  id: string;
  name: string;
  address: string;
  email: string | null;
};

const INITIAL_CONTACTS: Contact[] = [
  {
    id: "1",
    name: "Andrew",
    address: "0x54132d48c6c75d9dea1810c99f76424f32258dc1",
    email: "andrew@gmail.com",
  },
  {
    id: "2",
    name: "Billy Waton",
    address: "0x49932d48c6c75d9dea1810c99f76424f322f02a1",
    email: null,
  },
  {
    id: "3",
    name: "Blake Morris",
    address: "0x4b132d48c6c75d9dea1810c99f76424f322f02a2",
    email: "blake@example.com",
  },
  {
    id: "4",
    name: "Adam Levin",
    address: "0x4ad32d48c6c75d9dea1810c99f76424f322f02a3",
    email: null,
  },
  {
    id: "5",
    name: "Tai Verdes",
    address: "0x4ae32d48c6c75d9dea1810c99f76424f322f02a4",
    email: "tai@example.com",
  },
  {
    id: "6",
    name: "Hannah Petty",
    address: "0x4bc32d48c6c75d9dea1810c99f76424f322f02a5",
    email: null,
  },
  {
    id: "7",
    name: "Albert",
    address: "0x4ab32d48c6c75d9dea1810c99f76424f322f02a6",
    email: null,
  },
  {
    id: "8",
    name: "Zoey",
    address: "0x4ae32d48c6c75d9dea1810c99f76424f322f02a7",
    email: "zoey@example.com",
  },
];

let contacts: Contact[] = INITIAL_CONTACTS.map((row) => ({ ...row }));
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeContacts(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getContacts(): Contact[] {
  return contacts;
}

export function addContact(input: Omit<Contact, "id">): Contact {
  const next: Contact = { ...input, id: crypto.randomUUID() };
  contacts = [...contacts, next];
  emit();
  return next;
}

export function updateContact(id: string, input: Omit<Contact, "id">): Contact | null {
  let updated: Contact | null = null;
  contacts = contacts.map((row) => {
    if (row.id !== id) return row;
    updated = { ...row, ...input };
    return updated;
  });
  if (updated) emit();
  return updated;
}

export function deleteContact(id: string) {
  contacts = contacts.filter((row) => row.id !== id);
  emit();
}
