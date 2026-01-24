export type ReceiptFee = {
  code: string;
  name: string;
  amount: number;
};


export type SchoolReceiptStudent = {
  student_id: string;
  name: string;
  year_group?: string | null;
  class_name?: string | null;
  fees: ReceiptFee[];

  total: number;
};

export type SchoolPaymentReceipt = {
  reference: string;
  amount: number;
  payment_method?: string | null;
  payer_name?: string | null;
  payer_email?: string | null;
  payer_phone?: string | null;
  students: SchoolReceiptStudent[];
  created_at?: string | null;
};

export type ExamReceiptBreakdown = {
  exam_id: string;
  exam_name: string;
  amount_paid: number;
  includes_textbook: boolean;
  textbook_cost: number;
};

export type ExamReceiptStudent = {
  student_id: string;
  name: string;
};

export type ExamPaymentReceipt = {
  reference: string;
  amount: number;
  payment_method?: string | null;
  payer_name?: string | null;
  payer_email?: string | null;
  payer_phone?: string | null;
  student: ExamReceiptStudent;
  examBreakdown: ExamReceiptBreakdown[];
  created_at?: string | null;
};