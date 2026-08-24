import { useRecipientMutations, useRecipientsQuery } from "@/hooks/use-recipient-api";
import type { PayRecipient } from "@/types/recipient";

export type Contact = PayRecipient;

export function useContacts() {
  const query = useRecipientsQuery();
  const { createMutation, updateMutation, deleteMutation } = useRecipientMutations();

  return {
    contacts: query.data ?? [],
    isPending: query.isPending,
    addContact: (input: { name: string; address: string; email: string | null }) =>
      createMutation.mutateAsync({
        name: input.name,
        address: input.address,
        email: input.email || undefined,
      }),
    updateContact: (id: string, input: { name: string; address: string; email: string | null }) =>
      updateMutation.mutateAsync({
        id,
        body: {
          name: input.name,
          address: input.address,
          email: input.email || undefined,
        },
      }),
    deleteContact: (id: string) => deleteMutation.mutateAsync(id),
  };
}
