-- =====================================================================
-- Taximeter rates: Tromsø Taxi's published tariff + 10%
-- =====================================================================
--
-- SOURCE
-- https://www.tromsotaxi.no/bestill-taxi/ (read 18 August 2026). Their
-- weekday daytime tariff, 06:00-18:00, taxi for 1-4 passengers:
--
--   startpris      60,00 kr
--   kilometerpris  12,60 kr
--   minuttpris      8,70 kr
--   minstepris    132,00 kr
--
-- Each figure below is that number x 1.10, rounded to the øre:
--
--   66,00  =  60,00 x 1.10
--   13,86  =  12,60 x 1.10
--    9,57  =   8,70 x 1.10
--  145,00  = 132,00 x 1.10  (145,20 rounded to a whole krone)
--
-- NOTE ON THE PER-MINUTE RATE
-- This is the first time it is not zero. Norwegian taxis charge for
-- distance AND time, which is why a 6 km trip through town costs more
-- than 6 km on the E8. Leaving it at zero would have made every slow
-- winter journey unprofitable.
--
-- SAFE TO RE-RUN. Reverting: the previous values were
-- base_fee 500, price_per_km 35, price_per_minute 0, min_price 800.
-- =====================================================================

update pricing_rules set
  base_fee              = 66.00,
  price_per_km          = 13.86,
  price_per_minute      = 9.57,
  min_price             = 145.00,

  -- ONE BAND, NOT FIVE — read this before you judge the number.
  --
  -- Tromsø Taxi runs five time bands (weekday evening 1.21, Saturday
  -- daytime 1.30, weekend nights 1.35, holidays 1.45). Our schema has a
  -- single "night / weekend" multiplier covering 22:00-06:00 plus all of
  -- Saturday and Sunday, so it cannot reproduce their table exactly.
  --
  -- 1.30 is the middle of the range their bands span across the hours ours
  -- covers. It slightly overcharges a weekday evening and slightly
  -- undercharges a Saturday night, by a few percent either way.
  --
  -- If you want their exact five bands, say so and I will add a
  -- pricing_tariffs table. Their whole structure is one base set times a
  -- per-band multiplier, which is the shape we already have -- it needs
  -- rows instead of a single column, not a new formula.
  night_rate_multiplier = 1.30,

  updated_at = now();


-- ---------------------------------------------------------------------
-- Vehicle classes
-- ---------------------------------------------------------------------
-- Tromsø Taxi does not publish maxitaxi rates ("Egne priser gjelder for
-- maxitaxi"), only that 5+ passengers is priced on request. So 1.5x for
-- the Large class is our own choice, not theirs, and it is yours to change
-- from the Taximeter screen.
update fleet_classes set multiplier = 1.0, updated_at = now() where code = 'small';
update fleet_classes set multiplier = 1.5, updated_at = now() where code = 'large';


-- =====================================================================
-- VERIFY — real Tromsø routes at the new rates
-- =====================================================================
-- Paste this after running the update. Compare the "small_day" column
-- against tromsotaxi.no: it should be almost exactly 10% higher.
--
-- with trips (name, km, mins) as (
--   values
--     ('Airport -> Prostneset',   6.5, 12),
--     ('Centre -> Tromsdalen',    4.0, 10),
--     ('Centre -> Ersfjordbotn', 25.0, 35),
--     ('Long transfer',          45.0, 55)
-- )
-- select t.name, t.km, t.mins,
--        calculate_transfer_fare(t.km, t.mins, 'small', '2026-08-19 12:00+02') as small_day,
--        calculate_transfer_fare(t.km, t.mins, 'small', '2026-08-19 02:00+02') as small_night,
--        calculate_transfer_fare(t.km, t.mins, 'large', '2026-08-19 12:00+02') as large_day,
--        calculate_transfer_fare(t.km, t.mins, 'large', '2026-08-19 02:00+02') as large_night
-- from trips t order by t.km;
--
-- Expected small_day, worked by hand from 66 + km x 13.86 + min x 9.57:
--   6.5 km / 12 min ->  271 kr   (Tromsø Taxi: 246 kr)
--   4.0 km / 10 min ->  218 kr   (Tromsø Taxi: 198 kr)
--  25.0 km / 35 min ->  747 kr   (Tromsø Taxi: 679 kr)
--  45.0 km / 55 min -> 1216 kr   (Tromsø Taxi: 1105 kr)
-- =====================================================================
