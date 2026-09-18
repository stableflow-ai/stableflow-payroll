import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button/Button";
import { Dialog } from "@/components/ui/dialog/Dialog";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@/components/ui/button/config";
import {
  LEDGER_BLIND_SIGN_CANCEL_LABEL,
  LEDGER_BLIND_SIGN_CONFIRM_LABEL,
  LEDGER_BLIND_SIGN_DIALOG_DESCRIPTION,
  LEDGER_BLIND_SIGN_DIALOG_TITLE,
} from "./config";
import {
  cancelLedgerBlindSignNotice,
  confirmLedgerBlindSignNotice,
  getLedgerBlindSignNoticeState,
  subscribeLedgerBlindSignNotice,
} from "./ledger-blind-sign";

export function LedgerBlindSignDialog() {
  const [state, setState] = useState(getLedgerBlindSignNoticeState);

  useEffect(() => subscribeLedgerBlindSignNotice(() => {
    setState(getLedgerBlindSignNoticeState());
  }), []);

  return (
    <Dialog
      open={state.open}
      onClose={cancelLedgerBlindSignNotice}
      title={LEDGER_BLIND_SIGN_DIALOG_TITLE}
      cardClassName="md:w-[417px] bg-[#10141f] text-white border-[0] shadow-[0px_8px_20px_rgba(0,0,0,0.6)]"
      titleClassName="text-white"
      closeClassName="text-white"
    >
      <p className="font-montserrat text-sm text-white">
        {LEDGER_BLIND_SIGN_DIALOG_DESCRIPTION}
      </p>
      <div className="mt-6 flex flex-col gap-3 pb-5">
        <Button
          size={BUTTON_SIZE.Lg}
          variant={BUTTON_VARIANT.Normal}
          className="w-full bg-[#10141f] border-[#1a1f2e] hover:bg-[#1a1f2e] text-white"
          onClick={confirmLedgerBlindSignNotice}
        >
          {LEDGER_BLIND_SIGN_CONFIRM_LABEL}
        </Button>
        <Button
          size={BUTTON_SIZE.Lg}
          variant={BUTTON_VARIANT.Normal}
          className="w-full bg-[#10141f] border-[#1a1f2e] hover:bg-[#1a1f2e] text-white"
          onClick={cancelLedgerBlindSignNotice}
        >
          {LEDGER_BLIND_SIGN_CANCEL_LABEL}
        </Button>
      </div>
    </Dialog>
  );
}
