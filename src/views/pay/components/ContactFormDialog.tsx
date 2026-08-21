import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { Dialog } from "@/components/ui/dialog/Dialog";
import type { Contact } from "@/hooks/use-contacts";
import { detectAddressChainKind, isValidEmail } from "../utils";
import { CONTACT_NAME_MAX_LENGTH, EMAIL_MAX_LENGTH } from "../config";
import { isAddressValid } from "@/utils";

const FIELD_CLASS =
  "mt-2 h-9 w-full rounded-[6px] border border-[#e3e3e3] bg-[#f6f6f6] px-3 font-montserrat text-sm font-medium text-black outline-none placeholder:text-black/30";

export function ContactFormDialog(props: {
  open: boolean;
  onClose: () => void;
  contact: Contact | null;
  onSave: (input: { name: string; address: string; email: string | null }) => void;
}) {
  const { open, onClose, contact, onSave } = props;
  const isEdit = Boolean(contact);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setName(contact?.name ?? "");
    setAddress(contact?.address ?? "");
    setEmail(contact?.email ?? "");
    setError(null);
  }, [open, contact]);

  function handleSubmit() {
    const trimmedName = name.trim().slice(0, CONTACT_NAME_MAX_LENGTH);
    const trimmedAddress = address.trim();
    const trimmedEmail = email.trim().slice(0, EMAIL_MAX_LENGTH);
    if (!trimmedName) {
      setError("Name is required");
      return;
    }
    const kind = detectAddressChainKind(trimmedAddress);
    if (!kind || !isAddressValid(trimmedAddress, kind)) {
      setError("Enter a valid wallet address");
      return;
    }
    if (trimmedEmail && !isValidEmail(trimmedEmail)) {
      setError("Enter a valid email");
      return;
    }
    onSave({
      name: trimmedName,
      address: trimmedAddress,
      email: trimmedEmail || null,
    });
  }

  return (
    <Dialog open={open} onClose={onClose} title={isEdit ? "Edit" : "Add"} cardClassName="w-full md:w-[500px]">
      <label className="block">
        <span className="font-montserrat text-sm font-medium text-[#606060]">Name</span>
        <input
          className={FIELD_CLASS}
          value={name}
          maxLength={CONTACT_NAME_MAX_LENGTH}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="mt-6 block">
        <span className="font-montserrat text-sm font-medium text-[#606060]">Wallet Address</span>
        <input className={FIELD_CLASS} value={address} onChange={(event) => setAddress(event.target.value)} />
      </label>
      <label className="mt-6 block">
        <span className="font-montserrat text-sm font-medium text-[#606060]">Email</span>
        <span className="ml-1 font-montserrat text-xs font-medium text-[#aaa]">(optional)</span>
        <input
          className={FIELD_CLASS}
          type="email"
          value={email}
          maxLength={EMAIL_MAX_LENGTH}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      {error ? <p className="mt-3 font-montserrat text-sm text-danger">{error}</p> : null}
      <Button size="lg" className="mt-8 w-full" onClick={handleSubmit}>
        {isEdit ? "Edit" : "Add"}
      </Button>
    </Dialog>
  );
}
