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
