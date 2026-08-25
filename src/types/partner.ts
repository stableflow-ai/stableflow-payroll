export interface PayPartner {
  id: number;
  userId: number;
  firstName: string;
  lastName: string;
  company: string;
  purpose: string;
  website: string;
  telegram: string;
  description: string;
  createdAt: string;
}

export interface PayCreatePartnerBody {
  first_name: string;
  last_name: string;
  company: string;
  purpose: string;
  website: string;
  telegram: string;
  description: string;
}

export interface PayCreatePartnerResp {
  id: number;
}

export interface PayPartnerKey {
  id: number;
  userId: number;
  label: string;
  apiKey: string;
  createdAt: string;
  status: number;
}

export interface PayPartnerKeyLabelBody {
  label: string;
}
