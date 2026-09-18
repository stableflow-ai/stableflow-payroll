/**
 * Tron batch payouts are larger than one Ledger APDU chunk, so the Ledger
 * adapter falls back to hash signing. The Tron app refuses that unless
 * Blind signing is on, so warn before an approval is spent on-chain.
 */

import { TRON_LEDGER_ADAPTER_NAME, TRON_LEDGER_SIGN_CHUNK_LIMIT } from "./config";
import { getTronSigner } from "./session";

/** tag + length + "type.googleapis.com/protocol.TriggerSmartContract" */
const TYPE_URL_FIELD_BYTES = 51;
/** tag + length + 21-byte Tron address */
const ADDRESS_FIELD_BYTES = 23;
/** Contract.type = TriggerSmartContract */
const CONTRACT_TYPE_FIELD_BYTES = 2;

const USER_CANCELLED_MESSAGE = "User rejected transaction";

function varintBytes(value: number | bigint): number {
  let rest = BigInt(value);
  let size = 1;
  while (rest >= 0x80n) {
    rest /= 0x80n;
    size += 1;
  }
  return size;
}

function lengthDelimitedBytes(payload: number): number {
  return 1 + varintBytes(payload) + payload;
}

function callDataBytes(callData: string): number {
  return Math.ceil(callData.trim().replace(/^0x/i, "").length / 2);
}

/** Size of the `contract` field the way hw-app-trx `getNextLength` measures it. */
export function tronLedgerSignFieldBytes(input: { callData: string; callValue?: bigint }): number {
  const callValue = input.callValue ?? 0n;
  const triggerBytes = ADDRESS_FIELD_BYTES * 2
    + lengthDelimitedBytes(callDataBytes(input.callData))
    + (callValue > 0n ? 1 + varintBytes(callValue) : 0);
  const anyBytes = TYPE_URL_FIELD_BYTES + lengthDelimitedBytes(triggerBytes);
  return lengthDelimitedBytes(CONTRACT_TYPE_FIELD_BYTES + lengthDelimitedBytes(anyBytes));
}

export function needsTronLedgerBlindSigning(input: { callData: string; callValue?: bigint }): boolean {
  return tronLedgerSignFieldBytes(input) > TRON_LEDGER_SIGN_CHUNK_LIMIT;
}

type LedgerBlindSignListener = () => void;

let pending: { resolve: (confirmed: boolean) => void } | null = null;
const listeners = new Set<LedgerBlindSignListener>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function getLedgerBlindSignNoticeState(): { open: boolean } {
  return { open: pending !== null };
}

export function subscribeLedgerBlindSignNotice(listener: LedgerBlindSignListener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function confirmLedgerBlindSignNotice(): void {
  const current = pending;
  pending = null;
  current?.resolve(true);
  notify();
}

export function cancelLedgerBlindSignNotice(): void {
  const current = pending;
  pending = null;
  current?.resolve(false);
  notify();
}

export function openLedgerBlindSignNotice(): Promise<boolean> {
  pending?.resolve(false);
  return new Promise((resolve) => {
    pending = { resolve };
    notify();
  });
}

let acknowledgedFor: string | null = null;

export async function ensureTronLedgerBlindSigning(input: {
  callData: string;
  callValue?: bigint;
}): Promise<void> {
  const signer = getTronSigner();
  if (!signer || signer.adapterName !== TRON_LEDGER_ADAPTER_NAME) return;
  if (!needsTronLedgerBlindSigning(input)) return;
  if (acknowledgedFor === signer.address) return;
  if (!(await openLedgerBlindSignNotice())) throw new Error(USER_CANCELLED_MESSAGE);
  acknowledgedFor = signer.address;
}
