import { get } from './client';


export type StudentSummary = {
  id: string;
  reg_number: string;
  first_name: string;
  middle_name?: string | null;
  last_name: string;
  year_group: string;
  class_name: string;
  email?: string | null;
  outstanding_balance?: number | null;
  school_fees_paid: boolean;

};

export type ParentResponse = {
  id: string;
  auth_id: string;
  first_name: string;
  last_name: string;
  email?: string | null;
  phone?: string | null;
};

export type ParentStudentsResponse = {
  parent: ParentResponse;
  students: StudentSummary[];
};

export const ParentsApi = {
  getParentStudents(parentId: string) {
    return get<ParentStudentsResponse>(`/api/parents/${parentId}/students`);
  },
};