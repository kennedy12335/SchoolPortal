import { post } from './client';

export type FeeCalculationResponse = {
  total_amount: number;
  student_fees: {
    student_id: string;
    student_name: string;
    fee_breakdown: {
      fees: Record<string, number>;
      subtotal: number;
      final_amount: number;
      discount_amount?: number;
    };
  }[];
};

export const FeesApi = {
  calculate(student_ids: string[]) {
    return post<FeeCalculationResponse>(`/api/fees/calculate-fees`, {
      student_ids,
      student_club_ids: {},
    });
  },
};