export interface Exam {
  id: string;
  exam_name: string;
  amount: number;
  extra_fees: number | null;
  allows_installments: boolean;
  applicable_grades: string | null;
}

export interface Student {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  grade: string;
  student_id: string;
  reg_number?: string;
  year_group?: string;
  class_name?: string;
  email?: string;
  school_fees_paid: boolean;
  discount_percentage?: number;
  discount_amount?: number;
  outstanding_balance?: number;
}

// Parent types
export interface Parent {
  id: string;
  auth_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
}

export interface StudentWithStatus {
  id: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  email?: string;
  reg_number: string;
  year_group: string;
  class_name: string;
  school_fees_paid: boolean;
  outstanding_balance: number | null;
}

export interface ParentDashboardData {
  parent: Parent;
  students: StudentWithStatus[];
}

export interface FeeCategory {
  name: string;
  amount: number;
  description?: string;
}

export interface Fees {
  tuition: number;
  boarding: number;
  utility: number;
  prize_giving_day: number;
  year_book: number;
  offering_and_hairs: number;
  total: number;
}

export interface FeeBreakdown{
  // Dynamic fees map: key is fee name/code, value is amount
  fees: Record<string, number>
  subtotal: number
  discount_amount: number
  discount_percentage: number
  percentage_discount_amount: number
  final_amount: number
}


export interface StudentFeeDetail{
    student_id: number
    student_name: string
    fee_breakdown: FeeBreakdown
}

export interface CalculatedFees{
  total_amount: number
  student_fees: StudentFeeDetail[]
}

// ============ Normalized Fee Types ============

export interface Fee {
  id: string;
  code: string;
  name: string;
  amount: number;
  extra_fees: number;
  description: string;
}

export interface StudentFee {
  id: string;
  student_id: string;
  fee_id: string;
  amount: number;
  discount_percentage: number;
  paid: boolean;
  payment_reference: string | null;
  fee: Fee;
}

export interface StudentExamFee {
  id: string;
  student_id: string;
  exam_fee_id: string;
  amount: number;
  discount_percentage: number;
  paid: boolean;
  payment_reference: string | null;
}

// ============ Admin Dashboard Types ============

export interface ClassPaymentSummary {
  class_name: string;
  total_students: number;
  paid_count: number;
  unpaid_count: number;
  payment_rate: number;
  total_collected: number;
}

export interface YearGroupPaymentSummary {
  year_group: string;
  total_students: number;
  paid_count: number;
  unpaid_count: number;
  payment_rate: number;
  total_collected: number;
  classes: ClassPaymentSummary[];
}

export interface StudentPaymentInfo {
  id: string;
  reg_number: string;
  first_name: string;
  last_name: string;
  year_group: string;
  class_name: string;
  school_fees_paid: boolean;
  outstanding_balance: number | null;
}

export interface PaginatedStudentPaymentInfo {
  items: StudentPaymentInfo[];
  total: number;
  limit: number;
  offset: number;
}

export interface SchoolFeesOverview {
  total_students: number;
  total_paid: number;
  total_unpaid: number;
  overall_payment_rate: number;
  total_amount_collected: number;
  by_year_group: YearGroupPaymentSummary[];
}

export interface ExamPaymentSummary {
  exam_id: string;
  exam_name: string;
  applicable_grades: string[] | null;
  total_applicable_students: number;
  total_registered: number;
  fully_paid_count: number;
  partially_paid_count: number;
  unpaid_count: number;
  total_amount_expected: number;
  total_amount_collected: number;
  collection_rate: number;
}

export interface StudentExamInfo {
  student_id: string;
  reg_number: string;
  first_name: string;
  last_name: string;
  year_group: string;
  class_name: string;
  amount_due: number;
  amount_paid: number;
  is_fully_paid: boolean;
}

export interface PaginatedStudentExamInfo {
  items: StudentExamInfo[];
  total: number;
  limit: number;
  offset: number;
}

export interface ExamAnalyticsResponse {
  total_exams: number;
  exams: ExamPaymentSummary[];
}

export interface ClubMembershipSummary {
  club_id: string;
  club_name: string;
  price: number;
  capacity: number | null;
  total_members: number;
  confirmed_members: number;
  pending_members: number;
  capacity_utilization: number | null;
  total_revenue: number;
}

export interface ClubMemberInfo {
  student_id: string;
  reg_number: string;
  first_name: string;
  last_name: string;
  year_group: string;
  class_name: string;
  payment_confirmed: boolean;
  status: string;
}

export interface PaginatedClubMemberInfo {
  items: ClubMemberInfo[];
  total: number;
  limit: number;
  offset: number;
}

export interface ClubAnalyticsResponse {
  total_clubs: number;
  total_memberships: number;
  total_revenue: number;
  clubs: ClubMembershipSummary[];
}

export interface DashboardOverview {
  total_students: number;
  school_fees_paid_count: number;
  school_fees_unpaid_count: number;
  school_fees_collection_rate: number;
  total_school_fees_collected: number;
  total_exam_registrations: number;
  total_exam_fees_collected: number;
  total_club_memberships: number;
  total_club_revenue: number;
  recent_payments_count: number;
}

// Year groups for filtering
export const YEAR_GROUPS = [
  'Year 6',
  'Year 7',
  'Year 8',
  'Year 9',
  'Year 10',
  'Year 11',
  'Year 12',
] as const;

export const CLASS_NAMES = [
  'Amber',
  'Emerald',
  'Ivory',
  'Spring',
  'Diamond',
] as const;
