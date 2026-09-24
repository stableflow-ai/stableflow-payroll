import { useEffect, useState } from "react";
import { Button } from "@stableflow/pay-ui/button";
import { Dialog } from "@stableflow/pay-ui/dialog";
import { BUTTON_SIZE, BUTTON_VARIANT } from "@stableflow/pay-ui/button";
import {
  LEDGER_CONNECT_DIALOG_DESCRIPTION,
  LEDGER_CONNECT_DIALOG_TITLE,
  LEDGER_CONNECT_RETRY_LABEL,
  LEDGER_CONNECT_USB_LABEL,
} from "./config";
import {
  cancelLedgerConnectChooser,
  getLedgerConnectDialogState,
  submitLedgerUsbConnect,
  subscribeLedgerConnectDialog,
} from "./ledger-choice";

export function LedgerConnectDialog() {
  const [state, setState] = useState(getLedgerConnectDialogState);

  useEffect(() => subscribeLedgerConnectDialog(() => {
    setState(getLedgerConnectDialogState());
  }), []);

  return (
    <Dialog
      open={state.open && (!state.usbBusy || Boolean(state.usbError))}
      onClose={cancelLedgerConnectChooser}
      title={LEDGER_CONNECT_DIALOG_TITLE}
      elevated
      cardClassName="md:w-[417px] bg-[#10141f] text-white border-[0] shadow-[0px_8px_20px_rgba(0,0,0,0.6)]"
      titleClassName="text-white"
      closeClassName="text-white"
    >
      <p className="font-montserrat text-sm text-white">
        {LEDGER_CONNECT_DIALOG_DESCRIPTION}
      </p>
      <div className="mt-6 flex flex-col gap-3 pb-5">
        <Button
          size={BUTTON_SIZE.Lg}
          variant={BUTTON_VARIANT.Normal}
          className="w-full bg-[#10141f] border-[#1a1f2e] hover:bg-[#1a1f2e] text-white"
          disabled={state.usbBusy}
          loading={state.usbBusy}
          onClick={() => {
            void submitLedgerUsbConnect();
          }}
        >
          {state.usbError ? LEDGER_CONNECT_RETRY_LABEL : LEDGER_CONNECT_USB_LABEL}
        </Button>
        {state.usbError ? (
          <p className="font-montserrat text-sm text-danger">{state.usbError}</p>
        ) : null}
      </div>
    </Dialog>
  );
}
