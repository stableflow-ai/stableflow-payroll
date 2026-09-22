import { PAY_API_PREFIX } from "@/api/config";
import { apiNumber, apiText, asRecord } from "@/api/map";
import { http } from "@/lib/http";
import type { PayrollConfig, PayrollConfigChain, PayrollConfigToken } from "@/types/payroll-config";

function asBoolean(value: unknown, fallback = true): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lower = value.trim().toLowerCase();
    if (lower === "true") return true;
    if (lower === "false") return false;
  }
  return fallback;
}

function mapConfigChain(raw: unknown): PayrollConfigChain {
  const row = asRecord(raw) ?? {};
  return {
    network: apiText(row.network),
    chainId: apiText(row.chain_id ?? row.chainId),
    chainName: apiText(row.chain_name ?? row.chainName),
    logo: apiText(row.logo),
    explorer: apiText(row.explorer),
    batchPay: asBoolean(row.batch_pay ?? row.batchPay),
  };
}

function mapConfigToken(raw: unknown): PayrollConfigToken {
  const row = asRecord(raw) ?? {};
  return {
    symbol: apiText(row.symbol),
    network: apiText(row.network),
    decimals: apiNumber(row.decimals) ?? 0,
    contractAddress: apiText(row.contract_address ?? row.contractAddress),
    price: apiText(row.price),
    supportPayment: asBoolean(row.support_payment ?? row.supportPayment),
    supportReceive: asBoolean(row.support_receive ?? row.supportReceive),
  };
}

export function mapPayrollConfig(raw: unknown): PayrollConfig {
  const row = asRecord(raw) ?? {};
  const chains = Array.isArray(row.chains) ? row.chains.map(mapConfigChain) : [];
  const tokens = Array.isArray(row.tokens) ? row.tokens.map(mapConfigToken) : [];
  return { chains, tokens };
}

export async function getPayrollConfig(): Promise<PayrollConfig> {
  return mapPayrollConfig(await http<unknown>(`${PAY_API_PREFIX}/config`));
}
