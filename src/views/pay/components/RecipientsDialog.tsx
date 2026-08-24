import { RecipientAvatar } from "@/components/recipient-avatar/RecipientAvatar";
import { IconDelete } from "@/components/icons/delete";
import { IconPen } from "@/components/icons/pen";
import { IconPlus } from "@/components/icons/plus";
import { Button } from "@/components/ui/button/Button";
import { Dialog } from "@/components/ui/dialog/Dialog";
import type { Contact } from "@/hooks/use-contacts";
import { formatAddress, sameAddress } from "@/utils";
import { detectAddressChainKind } from "../utils";

export function RecipientsDialog(props: {
  open: boolean;
  onClose: () => void;
  contacts: Contact[];
  selectedAddress: string;
  onSelect: (contact: Contact) => void;
  onAdd: () => void;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}) {
  const { open, onClose, contacts, selectedAddress, onSelect, onAdd, onEdit, onDelete } = props;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Recipients"
      cardClassName="w-full md:w-[500px]"
      headerAction={
        <Button size="sm" className="gap-1.5 px-3" onClick={onAdd}>
          <IconPlus className="size-3 text-white" />
          Add
        </Button>
      }
    >
      <ul className="flex max-h-[min(70vh,520px)] flex-col gap-1">
        {contacts.map((contact) => {
          const selected = Boolean(
            selectedAddress
            && sameAddress(contact.wallet, selectedAddress, detectAddressChainKind(selectedAddress)),
          );
          return (
            <li
              key={contact.id}
              className={`group flex items-center gap-3 rounded-[12px] px-2 py-2 ${
                selected ? "bg-[#f6f6f6]" : "hover:bg-[#f6f6f6]"
              }`}
            >
              <RecipientAvatar
                name={contact.name}
                address={contact.wallet}
                className="size-8 text-xs"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-montserrat text-sm font-medium text-black">{contact.name}</p>
                <p className="font-montserrat text-[10px] text-[#606060]">{formatAddress(contact.wallet)}</p>
              </div>
              <div className="flex items-center gap-2 md:opacity-0 md:group-hover:opacity-100">
                <button
                  type="button"
                  aria-label="Edit"
                  className="cursor-pointer text-[#606060]"
                  onClick={() => onEdit(contact)}
                >
                  <IconPen className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Delete"
                  className="cursor-pointer text-[#606060]"
                  onClick={() => onDelete(contact)}
                >
                  <IconDelete className="size-3.5" />
                </button>
              </div>
              <Button size="sm" variant="normal" className="w-[79px]" onClick={() => onSelect(contact)}>
                Select
              </Button>
            </li>
          );
        })}
      </ul>
    </Dialog>
  );
}
