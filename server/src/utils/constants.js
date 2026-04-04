// Payout tiers — fixed parametric amounts
export const PAYOUT_TIERS = {
  heavy_rain_60: { label: 'Heavy Rain (60 min)', payout: 200, currency: 'INR' },
  heavy_rain_90: { label: 'Heavy Rain (90 min)', payout: 350, currency: 'INR' },
  extreme_heat:  { label: 'Extreme Heat',        payout: 200, currency: 'INR' },
  severe_aqi:    { label: 'Severe AQI',           payout: 500, currency: 'INR' },
  flash_flood:   { label: 'Flash Flood',          payout: 800, currency: 'INR' },
  curfew:        { label: 'Curfew / Section 144', payout: 800, currency: 'INR' },
}

// Weekly premium bands
export const WEEKLY_PREMIUM_BANDS = {
  low_standard:    { premium: 39,  maxPayout: 1200 },
  medium_standard: { premium: 59,  maxPayout: 1800 },
  high_standard:   { premium: 79,  maxPayout: 2500 },
  high_heavy:      { premium: 99,  maxPayout: 3000 },
}

// Fraud thresholds
export const FRAUD_THRESHOLDS = {
  soft_hold:    70,
  auto_reject:  90,
}

// Claim eligibility rules
export const CLAIM_RULES = {
  min_enrollment_weeks:    2,   // Must hold policy 2+ weeks before claiming
  max_claims_per_4_weeks:  2,   // Claim frequency cap
  enrollment_freeze_hours: 48,  // Lock new enrollments 48hrs before forecasted event
}
