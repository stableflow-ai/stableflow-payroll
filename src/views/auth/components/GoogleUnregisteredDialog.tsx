import { Button } from "@/components/ui/button/Button";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { RESET_PASSWORD_DIALOG_CARD_CLASS } from "../config";

export function GoogleUnregisteredDialog(props: {
  open: boolean;
  onClose: () => void;
  onBind: () => void;
  onRegister: () => void;
}) {
  const { open, onClose, onBind, onRegister } = props;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Google account not registered"
      cardClassName={RESET_PASSWORD_DIALOG_CARD_CLASS}
    >
      <p className="font-montserrat text-sm font-medium text-[#909090]">
        This Google account is not registered. Bind it to an existing email, or create a new account.
      </p>
      <div className="mt-6 flex items-center justify-between gap-3">
        <Button className="flex-1" size="lg" variant="normal" onClick={onRegister}>
          Register
        </Button>
        <Button className="flex-1" size="lg" onClick={onBind}>
          Bind
        </Button>
      </div>
    </Dialog>
  );
}
