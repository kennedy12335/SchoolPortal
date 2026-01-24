import { get, post } from './client';
import { SchoolPaymentReceipt } from '@schoolpayment/shared';

export type VerifyResponse = { status: string };

export type InitializeSchoolPayload = {
  student_ids: string[];
  amount: number;
  parent_id: string;
  payment_method?: string;
  description?: string;
  student_fee_ids?: string[];
};

export type InitializeResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    reference: string;
  };
};

export const PaymentsApi = {
  verify(reference: string) {
    return post<VerifyResponse>(`/api/payments/verify/${reference}`);
  },
  getReceipt(reference: string) {
    return get<SchoolPaymentReceipt>(`/api/payments/receipt/${reference}`);
  },
  initializeSchoolFees(payload: InitializeSchoolPayload) {
    return post<InitializeResponse>(`/api/payments/initialize`, payload);
  },
};