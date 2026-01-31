import { get, post } from './client';
import { ExamPaymentReceipt } from '@schoolpayment/shared';

export type VerifyResponse = { status: string };

export type PayForExamPayload = {
  student_id: string;
  exam_payments: { exam_id: string | number; amount_paid: number }[];
  amount: number;
  payment_method?: string;
  parent_id: string;
};

export type InitializeResponse = {
  status: boolean;
  message: string;
  data?: {
    authorization_url: string;
    reference: string;
  };
};

export type StudentExamListItem = {
  exam_id: string;
  exam_name: string;
  exam_price: number;
  extra_fees: number;
  extra_fees_name?: string;
  allows_installments?: boolean;
  amount_paid: number;
  amount_due: number;
  is_fully_paid: boolean;
};

export type StudentExamListResponse = {
  id: string | null;
  year_group: string | null;
  class_name: string | null;
  student_id: string;
  exam_list: StudentExamListItem[];
};

export const ExamsApi = {
  verify(reference: string) {
    return post<VerifyResponse>(`/api/exams/verify/${reference}`);
  },
  getReceipt(reference: string) {
    return get<ExamPaymentReceipt>(`/api/exams/receipt/${reference}`);
  },
  payForExam(payload: PayForExamPayload) {
    return post<InitializeResponse>(`/api/exams/pay-for-exam`, payload);
  },
  getStudentExamList(studentId: string) {
    return get<StudentExamListResponse>(
      `/api/exams/get-student-exam-list?student_id=${encodeURIComponent(studentId)}`
    );
  },
};