export interface PayRecipient {
  id: string;
  name: string;
  address: string;
  email: string | null;
}

export interface PayRecipientBody {
  name: string;
  address: string;
  email?: string | null;
}
