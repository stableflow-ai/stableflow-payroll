import { LedgerAdapter } from "@tronweb3/tronwallet-adapters";
import type { WalletError } from "@tronweb3/tronwallet-abstract-adapter";
import { LEDGER_CONNECT_DIALOG_DELAY_MS } from "./config";
import {
  cancelLedgerConnectChooser,
  LedgerConnectCancelledError,
  openLedgerConnectChooser,
  type LedgerConnectOutcome,
} from "./ledger-choice";

function sleep(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}

export class TronLedgerWalletAdapter extends LedgerAdapter {
  private aborted = false;
  private chooserBusy = false;

  override async connect(): Promise<void> {
    if (this.connected || this.chooserBusy) return;
    this.aborted = false;
    this.chooserBusy = true;
    try {
      await sleep(LEDGER_CONNECT_DIALOG_DELAY_MS);
      if (this.aborted) throw new LedgerConnectCancelledError();
      const outcome = await openLedgerConnectChooser({
        connectUsb: () => this.connectUsb(),
      });
      this.throwIfChooserFailed(outcome);
    } catch (error) {
      if (!this.aborted) {
        await super.disconnect().catch(() => undefined);
      }
      this.emit("error", error as WalletError);
      throw error;
    } finally {
      this.chooserBusy = false;
    }
  }

  override async disconnect(): Promise<void> {
    this.aborted = true;
    cancelLedgerConnectChooser();
    await super.disconnect();
  }

  private async connectUsb(): Promise<void> {
    await super.connect();
    if (this.aborted) {
      await super.disconnect().catch(() => undefined);
      throw new LedgerConnectCancelledError();
    }
  }

  private throwIfChooserFailed(outcome: LedgerConnectOutcome) {
    if (this.aborted || ("cancelled" in outcome && outcome.cancelled)) {
      throw new LedgerConnectCancelledError();
    }
    if (!outcome.ok) throw outcome.error;
  }
}
