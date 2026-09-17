import { useWallet as useSolanaAdapter } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@/components/ui/button/config";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { Switch } from "@/components/ui/switch/Switch";
import useToast from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { useSquadsSdkStore } from "@/stores/squads-sdk";
import { formatAddress } from "@/utils";
import { setSquadsSdkBinding } from "@/wallet/solana/session";
import {
  bindingFromVaultChoice,
  inspectSquadsPaste,
  type SquadsPasteResult,
} from "@/wallet/solana/multisig/resolve";
import { useSquadsMode } from "@/wallet/solana/multisig/use-squads-mode";

const FIELD_CLASS =
  "h-10 w-full rounded-[8px] border border-[#e3e3e3] bg-white px-3 font-montserrat text-sm text-black outline-none placeholder:text-[#909090]";

export function PayFromSquadSection(props: {
  visible: boolean;
}) {
  const { visible } = props;
  const { publicKey } = useSolanaAdapter();
  const member = publicKey?.toBase58() ?? "";
  const toast = useToast();
  const { isSdk, isResolving, vaultAddress } = useSquadsMode();
  const persistedRow = useSquadsSdkStore((state) => (member ? state.byMember[member] : undefined));
  const bind = useSquadsSdkStore((state) => state.bind);
  const unbind = useSquadsSdkStore((state) => state.unbind);
  const [wantSquad, setWantSquad] = useState(false);
  const [draft, setDraft] = useState("");
  const [lookingUp, setLookingUp] = useState(false);
  const [selector, setSelector] = useState<Extract<SquadsPasteResult, { kind: "multisig" }> | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  if (!visible || !member) return null;

  const boundVault = vaultAddress || persistedRow?.vaultAddress || null;
  const panelOpen = wantSquad || isSdk || Boolean(persistedRow) || Boolean(selector);

  const applyBinding = (next: Parameters<typeof bind>[0]) => {
    bind(next);
    setSquadsSdkBinding(next);
    setDraft("");
    setSelector(null);
  };

  const turnOff = () => {
    unbind(member);
    setSquadsSdkBinding(null);
    setDraft("");
    setSelector(null);
  };

  const lookup = async () => {
    setLookingUp(true);
    try {
      const result = await inspectSquadsPaste({ pasted: draft, member });
      if (result.kind === "vault") {
        applyBinding(result.binding);
        return;
      }
      setSelector(result);
      setSelectedIndex(0);
    } catch (error) {
      toast.fail({ title: error instanceof Error ? error.message : String(error ?? "") });
    } finally {
      setLookingUp(false);
    }
  };

  const confirmVault = () => {
    if (!selector) return;
    try {
      applyBinding(bindingFromVaultChoice({
        member,
        multisigPda: selector.info.multisigPda,
        vaultIndex: selectedIndex,
      }));
    } catch (error) {
      toast.fail({ title: error instanceof Error ? error.message : String(error ?? "") });
    }
  };

  return (
    <div className="mt-3">
      <div className="flex items-center justify-between gap-3">
        <p className="font-montserrat text-xs font-medium text-[#606060]">Pay from Squad</p>
        <Switch
          checked={panelOpen}
          loading={lookingUp || isResolving}
          onCheckedChange={(checked) => {
            setWantSquad(checked);
            if (!checked) turnOff();
          }}
        />
      </div>
      {panelOpen && boundVault ? (
        <p className="mt-1.5 font-montserrat text-[11px] leading-4 text-[#606060]">
          Vault (funds): {formatAddress(boundVault)}
        </p>
      ) : panelOpen ? (
        <div className="mt-2 flex items-center gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Paste vault or Squad address"
            className={FIELD_CLASS}
          />
          <Button
            type="button"
            variant={BUTTON_VARIANT.Normal}
            size={BUTTON_SIZE.Md}
            disabled={!draft.trim() || lookingUp}
            onClick={() => void lookup()}
            className="!text-sm"
          >
            Bind
          </Button>
        </div>
      ) : null}
      <Dialog
        open={Boolean(selector)}
        onClose={() => setSelector(null)}
        title="Select Squad vault"
      >
        <p className="font-montserrat text-sm text-[#606060]">
          Confirm the vault that holds the paying funds. Index 0 is selected by default.
        </p>
        <div className="mt-3 max-h-60 space-y-2 overflow-y-auto">
          {selector?.vaults.map((row) => (
            <button
              key={row.index}
              type="button"
              onClick={() => setSelectedIndex(row.index)}
              className={cn(
                "flex w-full items-center justify-between rounded-[8px] border px-3 py-2 text-left font-montserrat text-sm",
                selectedIndex === row.index ? "border-black bg-[#f6f6f6]" : "border-[#e3e3e3] bg-white",
              )}
            >
              <span>Vault {row.index}</span>
              <span className="text-[#606060]">{formatAddress(row.vaultAddress)}</span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant={BUTTON_VARIANT.Normal} size={BUTTON_SIZE.Md} onClick={() => setSelector(null)}>
            Cancel
          </Button>
          <Button type="button" size={BUTTON_SIZE.Md} onClick={confirmVault}>
            Confirm
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
