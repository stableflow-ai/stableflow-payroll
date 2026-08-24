export interface PayRecipient {
  id: string;
  name: string;
  wallet: string;
  email: string | null;
}

export interface PayRecipientBody {
  name: string;
  wallet: string;
  email?: string | null;
}
