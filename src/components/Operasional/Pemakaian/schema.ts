// src/components/Operasional/Pemakaian/schema.ts
import { z } from 'zod';

export type TabTypes = 'delta_pressure' | 'evc' | 'turbine';

const baseUsageSchema = {
  date: z.string().min(1, 'Tanggal wajib diisi'),
  customer_id: z.string().min(1, 'Customer wajib dipilih'),
  currency: z.string().min(1),
  exchange_rate: z.coerce.number().min(0),
  price_per_sm3: z.coerce.number().min(0),
  total_sales: z.coerce.number().min(0),
};

export const deltaPressureSchema = z.object({
  ...baseUsageSchema,
  license_plate: z.string().optional(),
  gtm_type: z.string().optional(),
  lwc: z.coerce.number().optional(),
  vol_nm3_at_200_bar_g: z.coerce.number().optional(),
  pressure_start: z.coerce.number().optional(),
  pressure_finish: z.coerce.number().optional(),
  pressure_difference: z.coerce.number().optional(),
  total_sm3: z.coerce.number().optional(),
  ghv: z.coerce.number().optional(),
  standard_1_sm3: z.coerce.number().optional(),
  mmbtu: z.coerce.number().optional(),
  mmbtu_per_sm3: z.coerce.number().optional(),
});
export type DeltaPressureFormValues = z.infer<typeof deltaPressureSchema>;

export const evcSchema = z.object({
  ...baseUsageSchema,
  license_plate: z.string().optional(),
  gtm_number: z.string().optional(),
  turbine_start: z.coerce.number().optional(),
  turbine_finish: z.coerce.number().optional(),
  turbine_difference: z.coerce.number().optional(),
  evc_start: z.coerce.number().optional(),
  evc_finish: z.coerce.number().optional(),
  evc_difference_sm3: z.coerce.number().optional(),
});
export type EvcFormValues = z.infer<typeof evcSchema>;

export const turbineSchema = z.object({
  ...baseUsageSchema,
  gtm_number: z.string().optional(),
  turbine_start: z.coerce.number().optional(),
  turbine_finish: z.coerce.number().optional(),
  turbine_difference: z.coerce.number().optional(),
  supply_pressure: z.coerce.number().optional(),
  temp_avg_prs: z.coerce.number().optional(),
  compression_factor: z.coerce.number().optional(),
  temp_base: z.coerce.number().optional(),
  pressure_standard: z.coerce.number().optional(),
  pressure_atm_standard: z.coerce.number().optional(),
  total_sm3: z.coerce.number().optional(),
  ghv: z.coerce.number().optional(),
  standard_1_sm3: z.coerce.number().optional(),
  mmbtu: z.coerce.number().optional(),
});
export type TurbineFormValues = z.infer<typeof turbineSchema>;
