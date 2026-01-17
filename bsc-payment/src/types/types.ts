export interface Club {
  id: string;
  name: string;
  price: number;
  description?: string;
  capacity?: number;
}

export interface Exam {
  id: string;
  exam_name: string;
  amount: number;
  extra_fees: number | null;
  allows_installments: boolean;
  applicable_grades: string | null;
}

export interface ClubMembership {
  club: Club;
  status?: string;
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
  club_memberships: ClubMembership[];
  selectedClubs?: number[]; // Track selected clubs for each student
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
  club_memberships: ClubMembership[];
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
    tuition: number
    boarding: number
    utility: number
    prize_giving_day: number
    year_book: number
    offering_and_hairs: number
    club_fees: Club[]
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
