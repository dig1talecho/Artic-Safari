import { z } from 'zod'

// Shared validation for every booking-creation entry point (dispatch console,
// tour packages modal, taximeter widget, admin command palette). Centralized
// here so a bad/malicious payload is rejected before it reaches Supabase,
// regardless of which UI produced it.
export const bookingInsertSchema = z.object({
  customer_name: z.string().trim().min(1, 'Name is required').max(200),
  customer_email: z.string().trim().max(320),
  customer_phone: z.string().trim().max(40).nullable(),
  booking_type: z.string().min(1).max(50),
  item_title: z.string().trim().min(1, 'Item title is required').max(200),
  booking_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'booking_date must be YYYY-MM-DD'),
  scheduled_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'scheduled_time must be HH:MM')
    .nullable()
    .optional(),
  total_price: z.number().positive('Price must be greater than zero').max(50000, 'Price is out of range'),
  notes: z.string().max(2000),
  status: z.string().min(1).max(20),
})

export type BookingInsertInput = z.infer<typeof bookingInsertSchema>

export const distanceRequestSchema = z.object({
  origin: z.string().trim().min(3, 'Pickup address is too short').max(300),
  destination: z.string().trim().min(3, 'Drop-off address is too short').max(300),
})

export const pricingRulesUpdateSchema = z.object({
  base_fee: z.number().nonnegative().max(10000),
  price_per_km: z.number().nonnegative().max(1000),
  night_rate_multiplier: z.number().min(1).max(5),
  min_price: z.number().nonnegative().max(50000),
})
