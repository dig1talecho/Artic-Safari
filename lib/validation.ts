import { z } from 'zod'

// Shared validation for every booking-creation entry point (dispatch console,
// tour packages modal, taximeter widget, admin command palette). Centralized
// here so a bad/malicious payload is rejected before it reaches Supabase,
// regardless of which UI produced it.
export const bookingInsertSchema = z.object({
  // Optional client-generated UUID. Lets a caller (e.g. the add-ons cart)
  // know the booking's id up front to attach related rows, without
  // needing an anon SELECT-back policy on bookings -- DB default handles
  // it when omitted, exactly like before.
  id: z.string().uuid().optional(),
  customer_name: z.string().trim().min(1, 'Name is required').max(200),
  customer_email: z.string().trim().toLowerCase().email('Please enter a valid email address').max(320),
  customer_phone: z
    .string()
    .trim()
    .regex(/^[+]?[\d\s()-]{7,20}$/, 'Please enter a valid phone number')
    .max(40)
    .nullable(),
  booking_type: z.string().min(1).max(50),
  item_title: z.string().trim().min(1, 'Item title is required').max(200),
  booking_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'booking_date must be YYYY-MM-DD')
    .refine((val) => {
      const parsed = new Date(`${val}T00:00:00`)
      if (Number.isNaN(parsed.getTime())) return false
      const today = new Date(new Date().toDateString())
      const twoYearsOut = new Date(today)
      twoYearsOut.setFullYear(today.getFullYear() + 2)
      return parsed >= today && parsed <= twoYearsOut
    }, 'Please choose a real date between today and 2 years from now'),
  scheduled_time: z
    .string()
    .regex(/^\d{2}:\d{2}$/, 'scheduled_time must be HH:MM')
    .nullable()
    .optional(),
  total_price: z.number().positive('Price must be greater than zero').max(50000, 'Price is out of range'),
  notes: z.string().max(2000),
  status: z.string().min(1).max(20),
  // B2B partner attribution: the client may suggest a promo code, but
  // partner_id/commission_amount are only ever set by the
  // resolve_booking_partner() DB trigger -- never trusted from here.
  promo_code: z.string().trim().max(50).nullable().optional(),
  // Loyalty: a *request* to spend points, not an instruction. The
  // apply_loyalty_redemption() trigger re-reads the real balance and
  // decides points_redeemed/loyalty_discount server-side, so an inflated
  // value here simply gets clamped rather than trusted.
  points_requested: z.number().int().nonnegative().max(1_000_000).optional(),
  // Structured pickup / drop-off. Optional so guest bookings that only ever
  // had a typed address keep validating; the DB constraint enforces that a
  // lat never arrives without its lng.
  pickup_address: z.string().trim().max(300).nullable().optional(),
  pickup_lat: z.number().min(-90).max(90).nullable().optional(),
  pickup_lng: z.number().min(-180).max(180).nullable().optional(),
  dropoff_address: z.string().trim().max(300).nullable().optional(),
  dropoff_lat: z.number().min(-90).max(90).nullable().optional(),
  dropoff_lng: z.number().min(-180).max(180).nullable().optional(),
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

// ---------------- B2B partners ----------------

export const partnerInsertSchema = z.object({
  hotel_name: z.string().trim().min(1).max(200),
  contact_name: z.string().trim().max(200).nullable().optional(),
  contact_email: z.string().trim().email().max(320).nullable().optional(),
  commission_rate: z.number().min(0).max(1),
  promo_code: z
    .string()
    .trim()
    .min(3)
    .max(50)
    .regex(/^[A-Za-z0-9_-]+$/, 'Promo code may only contain letters, numbers, - and _'),
  customer_discount_percent: z.number().min(0).max(50).default(0),
  active: z.boolean().default(true),
})

// ---------------- Tour add-ons ----------------

export const tourAddonInsertSchema = z.object({
  tour_id: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  description: z.string().max(1000).default(''),
  price: z.number().nonnegative().max(20000),
  active: z.boolean().default(true),
})

export const cartAddonSchema = z.object({
  addon_id: z.string().uuid(),
  name: z.string().trim().min(1).max(200),
  quantity: z.number().int().positive().max(20),
  price_at_booking: z.number().nonnegative().max(20000),
})

// ---------------- Driver tracking ----------------

export const driverLocationUpdateSchema = z.object({
  booking_id: z.string().uuid(),
  driver_name: z.string().trim().min(1).max(200),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  heading: z.number().min(0).max(360).nullable().optional(),
  speed: z.number().nonnegative().max(300).nullable().optional(),
})

// ---------------- AI concierge ----------------

export const itineraryPreferencesSchema = z.object({
  pax: z.number().int().positive().max(20),
  vibe: z.enum(['relaxed', 'adventurous', 'romantic', 'family', 'photography']),
  cold_tolerance: z.enum(['low', 'medium', 'high']),
  stay_duration_days: z.number().int().positive().max(30),
  booking_id: z.string().uuid().nullable().optional(),
})

// ---------------- Weather automation ----------------

export const weatherStatusSchema = z.enum(['SCHEDULED', 'DELAYED', 'AUTO_CANCELLED'])

// ---------------- VIP charter ----------------

export const charterRequestSchema = z.object({
  customer_name: z.string().trim().min(1).max(200),
  customer_email: z.string().trim().email().max(320),
  customer_phone: z.string().trim().max(40).nullable().optional(),
  vehicle_type: z.enum(['suv', 'van', 'luxury_sedan', 'minibus']),
  catering_preferences: z.string().max(500).nullable().optional(),
  pax: z.number().int().positive().max(60),
})

// ---------------- Geofenced pickup ----------------

export const pickupPointSchema = z.object({
  name: z.string().trim().min(1).max(200),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  geofence_radius_m: z.number().int().positive().max(5000).default(300),
})

// ---------------- Loyalty / reward points ----------------

// Admin-editable earn/redeem rules. Mirrors pricing_rules: a single row,
// validated the same way before it reaches Supabase.
export const loyaltyRulesUpdateSchema = z.object({
  points_per_100_kr: z.number().int().nonnegative().max(1000),
  kr_per_point: z.number().nonnegative().max(100),
  min_redeem_points: z.number().int().nonnegative().max(100_000),
  max_redeem_percent: z.number().int().min(0).max(90),
})

// Admin goodwill credit/debit. `kind` is pinned to 'adjustment' because
// the RLS policy only accepts that value from a client -- 'earned' and
// 'redeemed' rows are written exclusively by DB triggers.
export const loyaltyAdjustmentSchema = z.object({
  user_id: z.string().uuid(),
  points: z.number().int().refine((n) => n !== 0, 'Points must be non-zero'),
  kind: z.literal('adjustment'),
  reason: z.string().trim().min(1, 'A reason is required').max(500),
})

// Client-side preview only -- the authoritative number comes back on the
// inserted booking row as points_redeemed / loyalty_discount.
export const loyaltyRedeemRequestSchema = z.object({
  points_requested: z.number().int().nonnegative().max(1_000_000),
})
