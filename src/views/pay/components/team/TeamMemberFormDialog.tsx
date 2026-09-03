import { useEffect, useState, type ReactNode } from "react";
import { IconFieldError } from "@/components/icons/field-error";
import { Button } from "@/components/ui/button/Button";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { cn } from "@/lib/utils";
import type { TeamMember, TeamMemberWrite } from "@/hooks/use-team-api";
import { CONTACT_NAME_MAX_LENGTH, EMAIL_MAX_LENGTH } from "../../config";
import { emailFieldError, teamMemberFormCanSave, walletFieldError } from "./utils";

const FIELD_CLASS =
  "h-9 w-full rounded-[6px] border bg-[#f6f6f6] px-3 font-montserrat text-sm font-medium outline-none placeholder:text-black/30";

export function TeamMemberFormDialog(props: {
  open: boolean;
  onClose: () => void;
  member: TeamMember | null;
  onSave: (input: TeamMemberWrite) => void;
  saving?: boolean;
}) {
  const { open, onClose, member, onSave, saving = false } = props;
  const isEdit = Boolean(member);
  const [name, setName] = useState("");
  const [position, setPosition] = useState("");
  const [evm, setEvm] = useState("");
  const [solana, setSolana] = useState("");
  const [near, setNear] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(member?.name ?? "");
    setPosition(member?.position ?? "");
    setEvm(member?.wallets.evm ?? "");
    setSolana(member?.wallets.solana ?? "");
    setNear(member?.wallets.near ?? "");
    setEmail(member?.email ?? "");
  }, [open, member]);

  const wallets = { evm, solana, near };
  const evmError = walletFieldError(evm, "evm");
  const solanaError = walletFieldError(solana, "solana");
  const nearError = walletFieldError(near, "near");
  const emailError = emailFieldError(email);
  const canSave = teamMemberFormCanSave({ name, email, wallets }) && !saving;

  function handleSave() {
    if (!canSave) return;
    onSave({
      name: name.trim(),
      position: position.trim(),
      email: email.trim(),
      wallets: {
        evm: evm.trim(),
        solana: solana.trim(),
        near: near.trim(),
      },
    });
  }

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? "Edit" : "Add"}>
      <Field label="Name">
        <input
          className={cn(FIELD_CLASS, "border-[#e3e3e3] text-black")}
          value={name}
          maxLength={CONTACT_NAME_MAX_LENGTH}
          onChange={(event) => setName(event.target.value)}
        />
      </Field>
      <Field label="Position" optional>
        <input
          className={cn(FIELD_CLASS, "border-[#e3e3e3] text-black")}
          value={position}
          maxLength={CONTACT_NAME_MAX_LENGTH}
          onChange={(event) => setPosition(event.target.value)}
        />
      </Field>
      <WalletField
        label="EVM Wallet Address"
        value={evm}
        error={evmError}
        onChange={setEvm}
      />
      <WalletField
        label="Solana Wallet Address"
        optional
        value={solana}
        error={solanaError}
        onChange={setSolana}
      />
      <WalletField
        label="NEAR Wallet Address"
        optional
        value={near}
        error={nearError}
        onChange={setNear}
      />
      <Field label="Email" optional>
        <input
          type="email"
          className={cn(
            FIELD_CLASS,
            emailError ? "border-[#ff5656] text-[#ff5656]" : "border-[#e3e3e3] text-black",
          )}
          value={email}
          maxLength={EMAIL_MAX_LENGTH}
          onChange={(event) => setEmail(event.target.value)}
        />
      </Field>
      <Button size="lg" className="mt-8 w-full" disabled={!canSave} loading={saving} onClick={handleSave}>
        Save
      </Button>
    </Dialog>
  );
}

function Field(props: {
  label: string;
  optional?: boolean;
  children: ReactNode;
}) {
  const { label, optional, children } = props;
  return (
    <label className="mt-6 block first:mt-0">
      <span className="font-montserrat text-sm font-medium text-[#606060]">{label}</span>
      {optional ? (
        <span className="ml-1 font-montserrat text-xs font-medium text-[#aaa]">(optional)</span>
      ) : null}
      <div className="mt-2">{children}</div>
    </label>
  );
}

function WalletField(props: {
  label: string;
  optional?: boolean;
  value: string;
  error: string | null;
  onChange: (value: string) => void;
}) {
  const { label, optional, value, error, onChange } = props;
  return (
    <Field label={label} optional={optional}>
      <div className="relative">
        <input
          className={cn(
            FIELD_CLASS,
            error ? "border-[#ff5656] pr-9 text-[#ff5656]" : "border-[#e3e3e3] text-black",
          )}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {error ? (
          <IconFieldError
            className="pointer-events-none absolute top-1/2 right-3 size-3 -translate-y-1/2 text-[#ff5656]"
          />
        ) : null}
      </div>
    </Field>
  );
}
