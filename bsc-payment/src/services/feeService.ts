import axios from 'axios';
import { config } from '../config';
import type { StudentFee, StudentExamFee } from '../types/types';

// Types imported from shared backend definitions
export interface DiscountedFee {
  id: string;
  name: string;
  amount: number;
  discount_percentage: number;
  discounted_amount: number;
  final_amount: number;
}

export interface OutstandingFees {
  student_id: string;
  outstanding_school_fees: DiscountedFee[];
  outstanding_exam_fees: DiscountedFee[];
  total_school_fees: number;
  total_exam_fees: number;
  total_outstanding: number;
}

class FeeService {
  /**
   * Fetch all student fees for a given student
   */
  static async getStudentFees(studentId: string): Promise<StudentFee[]> {
    try {
      const response = await axios.get(
        `${config.apiUrl}/api/students/${studentId}/fees`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching student fees:', error);
      throw error;
    }
  }

  /**
   * Fetch all exam fees for a given student
   */
  static async getStudentExamFees(studentId: string): Promise<StudentExamFee[]> {
    try {
      const response = await axios.get(
        `${config.apiUrl}/api/students/${studentId}/exam-fees`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching student exam fees:', error);
      throw error;
    }
  }

  /**
   * Get outstanding fees for a student (unpaid fees only)
   */
  static async getOutstandingFees(studentId: string): Promise<OutstandingFees> {
    try {
      const response = await axios.get(
        `${config.apiUrl}/api/students/${studentId}/outstanding-fees`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching outstanding fees:', error);
      throw error;
    }
  }

  /**
   * Calculate discounted amount for a fee
   * Discount is percentage-based: discount_amount = amount * (discount_percentage / 100)
   */
  static applyDiscount(amount: number, discountPercentage: number): number {
    if (discountPercentage <= 0) {
      return amount;
    }
    const discountAmount = amount * (discountPercentage / 100);
    return amount - discountAmount;
  }

  /**
   * Get all unpaid student fees for payment
   */
  static async getUnpaidFees(studentId: string): Promise<StudentFee[]> {
    try {
      const response = await axios.get(
        `${config.apiUrl}/api/students/${studentId}/unpaid-fees`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching unpaid fees:', error);
      throw error;
    }
  }

  /**
   * Get all unpaid exam fees for payment
   */
  static async getUnpaidExamFees(studentId: string): Promise<StudentExamFee[]> {
    try {
      const response = await axios.get(
        `${config.apiUrl}/api/students/${studentId}/unpaid-exam-fees`
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching unpaid exam fees:', error);
      throw error;
    }
  }
}

export default FeeService;
