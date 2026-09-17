import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { SquadsSdkBinding } from "@/wallet/solana/multisig/types";

type SquadsSdkBindingRecord = Omit<SquadsSdkBinding, "member">;

interface SquadsSdkState {
  byMember: Record<string, SquadsSdkBindingRecord>;
  bind: (binding: SquadsSdkBinding) => void;
  unbind: (member: string) => void;
  bindingFor: (member: string | null | undefined) => SquadsSdkBinding | null;
}

export const useSquadsSdkStore = create<SquadsSdkState>()(
  persist(
    (set, get) => ({
      byMember: {},
      bind: (binding) => {
        const member = binding.member.trim();
        if (!member) return;
        set((state) => ({
          byMember: {
            ...state.byMember,
            [member]: {
              vaultAddress: binding.vaultAddress,
              multisigPda: binding.multisigPda,
              vaultIndex: binding.vaultIndex,
            },
          },
        }));
      },
      unbind: (member) => {
        const key = member.trim();
        if (!key) return;
        set((state) => {
          if (!(key in state.byMember)) return state;
          const next = { ...state.byMember };
          delete next[key];
          return { byMember: next };
        });
      },
      bindingFor: (member) => {
        const key = member?.trim();
        if (!key) return null;
        const row = get().byMember[key];
        if (!row) return null;
        return { member: key, ...row };
      },
    }),
    {
      name: "stableflow-pay:squads-sdk:v1",
    },
  ),
);
