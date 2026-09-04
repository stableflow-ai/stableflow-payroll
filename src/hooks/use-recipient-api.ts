import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import {
  createRecipient,
  deleteRecipient,
  listRecipients,
  updateRecipient,
} from "@/api/recipient";
import { useAuthStore } from "@/stores/auth";
import type { PayRecipientBody } from "@/types/recipient";

export function useRecipientsQuery(enabled = true) {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: queryKeys.recipient.all,
    queryFn: listRecipients,
    enabled: Boolean(token) && enabled,
  });
}

export function useRecipientMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.recipient.all });

  const createMutation = useMutation({
    mutationFn: (body: PayRecipientBody) => createRecipient(body),
    onSuccess: invalidate,
  });
  const updateMutation = useMutation({
    mutationFn: (input: { id: string; body: PayRecipientBody }) => updateRecipient(input.id, input.body),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteRecipient(id),
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, deleteMutation };
}
