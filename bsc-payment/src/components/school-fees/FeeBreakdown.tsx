import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Separator } from '../ui/separator';
import { StudentFeeDetail, Club } from '../../types/types';

interface FeeBreakdownProps {
  studentFees: StudentFeeDetail[];
  totalAmount: number;
}

const FeeBreakdown: React.FC<FeeBreakdownProps> = ({
  studentFees,
  totalAmount
}) => {
  if (studentFees.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee Breakdown</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {studentFees.map((fee) => (
          <div key={fee.student_id} className="space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="font-semibold">{fee.student_name}</h4>
              <span className="font-bold text-primary">
                ₦{fee.fee_breakdown.final_amount.toLocaleString()}
              </span>
            </div>

            <div className="space-y-2 text-sm">
              {/* Base fees (dynamic) */}
              <div className="space-y-1.5 text-muted-foreground">
                {Object.entries(fee.fee_breakdown.fees ?? {}).map(([label, value]) => (
                  <FeeItem key={label} label={label} amount={Number(value) || 0} />
                ))}
              </div>

              {/* Club fees */}
              {fee.fee_breakdown.club_fees.length > 0 && (
                <>
                  <Separator className="my-2" />
                  <div className="space-y-1.5">
                    <p className="font-medium text-foreground">Club Fees:</p>
                    {fee.fee_breakdown.club_fees.map((club: Club) => club && (
                      <FeeItem
                        key={club.id}
                        label={club.name}
                        amount={club.price}
                        highlight
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Subtotal */}
              <Separator className="my-2" />
              <FeeItem
                label="Subtotal"
                amount={fee.fee_breakdown.subtotal}
                bold
              />

              {/* Discounts */}
              {(fee.fee_breakdown.discount_amount > 0 || fee.fee_breakdown.discount_percentage > 0) && (
                <div className="space-y-1.5 text-green-600">
                  {fee.fee_breakdown.discount_amount > 0 && (
                    <FeeItem
                      label="Fixed Discount"
                      amount={-fee.fee_breakdown.discount_amount}
                      discount
                    />
                  )}
                  {fee.fee_breakdown.discount_percentage > 0 && (
                    <FeeItem
                      label={`Discount (${fee.fee_breakdown.discount_percentage}%)`}
                      amount={-fee.fee_breakdown.percentage_discount_amount}
                      discount
                    />
                  )}
                </div>
              )}

              {/* Final amount */}
              <div className="pt-2 border-t">
                <FeeItem
                  label="Final Amount"
                  amount={fee.fee_breakdown.final_amount}
                  bold
                />
              </div>
            </div>

            {studentFees.length > 1 && <Separator className="mt-4" />}
          </div>
        ))}

        {/* Grand Total */}
        {studentFees.length > 1 && (
          <div className="pt-4 border-t-2">
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold">Total Amount</span>
              <span className="text-xl font-bold text-primary">
                ₦{totalAmount.toLocaleString()}
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface FeeItemProps {
  label: string;
  amount: number;
  bold?: boolean;
  discount?: boolean;
  highlight?: boolean;
}

const FeeItem: React.FC<FeeItemProps> = ({
  label,
  amount,
  bold = false,
  discount = false,
  highlight = false
}) => {
  return (
    <div className={`flex justify-between ${bold ? 'font-semibold text-foreground' : ''}`}>
      <span className={highlight ? 'text-indigo-600' : ''}>{label}</span>
      <span className={discount ? 'text-green-600' : highlight ? 'text-indigo-600' : ''}>
        {discount ? '-' : ''}₦{Math.abs(amount).toLocaleString()}
      </span>
    </div>
  );
};

export default FeeBreakdown;
