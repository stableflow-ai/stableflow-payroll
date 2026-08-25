import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/api/query-keys";
import {
  createPartner,
  createPartnerKey,
  deletePartnerKey,
  getPartner,
  listPartnerKeys,
  updatePartnerKeyLabel,
} from "@/api/partner";
import { useAuthStore } from "@/stores/auth";
import type { PayCreatePartnerBody, PayPartner, PayPartnerKeyLabelBody } from "@/types/partner";

const EMPTY_PARTNER: Omit<PayPartner, "id"> = {
  userId: 0,
  firstName: "",
  lastName: "",
  company: "",
  purpose: "",
  website: "",
  telegram: "",
  description: "",
  createdAt: "",
};

export function usePartnerQuery() {
  const token = useAuthStore((state) => state.token);
  return useQuery({
    queryKey: queryKeys.partner.me,
    queryFn: getPartner,
    enabled: Boolean(token),
  });
}

export function usePartnerKeysQuery() {
  const token = useAuthStore((state) => state.token);
  const partnerQuery = usePartnerQuery();
  const isPartner = Boolean(partnerQuery.data?.id);
  return useQuery({
    queryKey: queryKeys.partner.keys,
    queryFn: listPartnerKeys,
    enabled: Boolean(token) && isPartner,
  });
}

export function useCreatePartnerMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: PayCreatePartnerBody) => createPartner(body),
    onSuccess: (resp) => {
      queryClient.setQueryData<PayPartner | null>(queryKeys.partner.me, (current) =>
        current?.id ? current : { id: resp.id, ...EMPTY_PARTNER },
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.partner.me });
    },
  });
}

export function usePartnerKeyMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: queryKeys.partner.keys });

  const createMutation = useMutation({
    mutationFn: (body: PayPartnerKeyLabelBody) => createPartnerKey(body),
    onSuccess: invalidate,
  });
  const updateMutation = useMutation({
    mutationFn: (input: { id: number; label: string }) =>
      updatePartnerKeyLabel(input.id, { label: input.label }),
    onSuccess: invalidate,
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => deletePartnerKey(id),
    onSuccess: invalidate,
  });

  return { createMutation, updateMutation, deleteMutation };
}
