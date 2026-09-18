export interface PayrollConfigChain {
  network: string;
  chainId: string;
  chainName: string;
  logo: string;
  explorer: string;
  batchPay: boolean;
}

export interface PayrollConfigToken {
  symbol: string;
  network: string;
  decimals: number;
  contractAddress: string;
  price: string;
  supportPayment: boolean;
  supportReceive: boolean;
}

export interface PayrollConfig {
  chains: PayrollConfigChain[];
  tokens: PayrollConfigToken[];
}
