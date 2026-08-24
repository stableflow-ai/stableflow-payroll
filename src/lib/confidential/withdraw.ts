import * as nearintentsApi from "@/api/nearintents";
import { QUICK_PAY_SLIPPAGE_TOLERANCE } from "@/views/pay/config";
import { toIntentsAccountId } from "@/lib/confidential/to-intents-account-id";
import { getPrivateBalances, privateAvailableForToken } from "@/lib/confidential/one-click-auth";
import { getNearintentsAccessToken } from "@/stores/nearintents-user-session";
import {
  NEARINTENTS_CONFIDENTIALITY,
  NEARINTENTS_DEPOSIT_TYPE,
  NEARINTENTS_INTENT_STANDARD,
  NEARINTENTS_INTENT_TYPE,
  NEARINTENTS_RECIPIENT_TYPE,
  NEARINTENTS_SWAP_TYPE,
} from "@/types/nearintents";
import { Big } from "@/utils";
import type { ChainKind, GeneratedIntent, IntentSignedPayload } from "@/wallet";

const QUOTE_DEADLINE_MS = 10 * 60_000;
const STATUS_POLL_MS = 2_000;
const STATUS_POLL_ATTEMPTS = 15;
const TERMINAL_STATUS = new Set(["SUCCESS", "FAILED", "REFUNDED"]);

export interface WithdrawConfidentialInput {
  address: string;
  chainKind: ChainKind;
  assetId: string;
  amount: string;
  decimals: number;
  signGeneratedIntent: (intent: GeneratedIntent) => Promise<IntentSignedPayload>;
}

function toMinorAmount(amount: string, decimals: number): string {
  return new Big(amount).times(new Big(10).pow(decimals)).round(0, Big.roundDown).toFixed(0);
}

async function assertPrivateBalance(input: WithdrawConfidentialInput, intentsAccountId: string): Promise<void> {
  const accessToken = await getNearintentsAccessToken(intentsAccountId);
  if (!accessToken) {
    throw new Error("Private session expired. Turn on Receive Privately and sign again.");
  }
  const balances = await getPrivateBalances(accessToken);
  const available = new Big(privateAvailableForToken(balances, input.assetId) || "0");
  const needed = new Big(toMinorAmount(input.amount, input.decimals));
  if (available.lt(needed)) {
    throw new Error("Insufficient private balance");
  }
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, ms));
}

/**
 * Withdraw private (confidential) balance to the main-chain wallet.
 *
 * Quote + generate-intent go through our `/v1/nearintents` Partner-key proxy.
 * TODO(api): replace submit-intent + status polling with
 * `POST /v1/pay/request/received/:id/withdraw/submit` when the product API
 * records the row, calls 1Click `v0/submit-intent`, and polls `v0/status`.
 */
export async function withdrawConfidentialPayment(input: WithdrawConfidentialInput): Promise<{
  depositAddress: string;
  status?: string;
}> {
  const intentsAccountId = toIntentsAccountId(input.address, input.chainKind);
  await assertPrivateBalance(input, intentsAccountId);
  const quoted = await nearintentsApi.nearintentsQuote({
    dry: false,
    swapType: NEARINTENTS_SWAP_TYPE.ExactInput,
    originAsset: input.assetId,
    depositType: NEARINTENTS_DEPOSIT_TYPE.ConfidentialIntents,
    destinationAsset: input.assetId,
    amount: toMinorAmount(input.amount, input.decimals),
    recipient: input.address.trim(),
    recipientType: NEARINTENTS_RECIPIENT_TYPE.DestinationChain,
    refundTo: intentsAccountId,
    refundType: NEARINTENTS_DEPOSIT_TYPE.ConfidentialIntents,
    confidentiality: NEARINTENTS_CONFIDENTIALITY.Advanced,
    deadline: new Date(Date.now() + QUOTE_DEADLINE_MS).toISOString(),
    slippageTolerance: QUICK_PAY_SLIPPAGE_TOLERANCE,
  });
  const depositAddress = quoted.quote?.depositAddress?.trim();
  if (!depositAddress) {
    throw new Error("Withdraw quote did not return a deposit address");
  }

  const generated = await nearintentsApi.nearintentsGenerateIntent({
    type: NEARINTENTS_INTENT_TYPE.SwapTransfer,
    standard: NEARINTENTS_INTENT_STANDARD[input.chainKind],
    signerId: intentsAccountId,
    depositAddress,
  });
  if (!generated.intent) {
    throw new Error("generate-intent did not return a payload");
  }

  const signedData = await input.signGeneratedIntent(generated.intent);

  // TODO(api): POST /v1/pay/request/received/:id/withdraw/submit with signedData.
  await nearintentsApi.nearintentsSubmitIntent({
    type: NEARINTENTS_INTENT_TYPE.SwapTransfer,
    signedData,
  });

  let status: string | undefined;
  for (let attempt = 0; attempt < STATUS_POLL_ATTEMPTS; attempt++) {
    const result = await nearintentsApi.nearintentsStatus(depositAddress, quoted.quote?.depositMemo);
    status = result.status;
    if (status && TERMINAL_STATUS.has(status)) break;
    await sleep(STATUS_POLL_MS);
  }
  if (status === "FAILED" || status === "REFUNDED") {
    throw new Error(`Withdraw ${status.toLowerCase()}`);
  }
  return { depositAddress, status };
}
