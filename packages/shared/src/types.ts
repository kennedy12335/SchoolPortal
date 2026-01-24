// Shared domain and receipt types usable by web admin and mobile

export type FeeItem = {
  code: string;
  name: string;
  amount: number;
};

export type ClubItem = {
  id: string;
  name: string;
  price: number;
};

export type SchoolReceiptStudent = {
  student_id: string;
  name: string;
  year_group?: string | null;
  class_name?: string | null;
  fees: FeeItem[];
  clubs: ClubItem[];
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
  includes_textbook?: boolean;
  textbook_cost?: number;
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

export type StudentSummary = {
  id: string;
  first_name: string;
  last_name: string;
  year_group?: string | null;
  class_name?: string | null;
  school_fees_paid?: boolean;
};
