// src/components/Keuangan/Payroll/schema.ts
import { z } from 'zod';

export const localPayrollSchema = z.object({
  employee_id: z.string().min(1, 'Karyawan wajib dipilih'),
  period: z.string().min(1, 'Periode wajib diisi'),
  basic_salary: z.coerce.number().min(0).optional(),
  allowance: z.coerce.number().min(0).optional(),
  overtime: z.coerce.number().min(0).optional(),
  incentive_bonus: z.coerce.number().min(0).optional(),
  others_income: z.coerce.number().min(0).optional(),
  pph21: z.coerce.number().min(0).optional(),
  bpjs: z.coerce.number().min(0).optional(),
  debt_deduction: z.coerce.number().min(0).optional(),
  others_deduction: z.coerce.number().min(0).optional(),
});

export type LocalPayrollFormValues = z.infer<typeof localPayrollSchema>;

export interface PayrollRow extends LocalPayrollFormValues {
  id: string;
  employee_name?: string;
  calculated_income?: number;
  calculated_deduction?: number;
  net_salary?: number;
}
