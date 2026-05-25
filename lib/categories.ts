export type CategoryKey =
  // Medical
  | "medical_treatment"
  | "dental_emergency"
  | "mental_health"
  | "rehabilitation"
  | "personal_accident"
  | "accidental_death"
  | "disability"

  // Travel
  | "trip_cancellation"
  | "trip_interruption"
  | "trip_shortening"
  | "travel_delay"
  | "baggage_loss"
  | "baggage_delay"
  | "rescue_service"

  // Property & Belongings
  | "personal_belongings"
  | "valuables"
  | "cash_and_documents"
  | "purchase_protection"
  | "return_guarantee"

  // Home
  | "fire_damage"
  | "water_damage"
  | "natural_disaster"
  | "theft_burglary"
  | "vandalism"
  | "glass_damage"

  // Vehicle
  | "car_rental"
  | "collision_damage"
  | "comprehensive_damage"
  | "vehicle_theft"
  | "roadside_assistance"
  | "vehicle_glass"

  // Liability & Legal
  | "personal_liability"
  | "legal_assistance"
  | "legal_protection"

  // Policy conditions
  | "deductible"
  | "coverage_area"
  | "coverage_duration"
  | "eligibility_conditions"

  // Fallback
  | "other"

export const CATEGORY_LABELS: Record<CategoryKey, string> = {
  medical_treatment:      "Medical treatment",
  dental_emergency:       "Dental emergency",
  mental_health:          "Mental health",
  rehabilitation:         "Rehabilitation",
  personal_accident:      "Personal accident",
  accidental_death:       "Accidental death",
  disability:             "Disability",
  trip_cancellation:      "Trip cancellation",
  trip_interruption:      "Trip interruption",
  trip_shortening:        "Trip shortening",
  travel_delay:           "Travel delay",
  baggage_loss:           "Baggage loss",
  baggage_delay:          "Baggage delay",
  rescue_service:         "Rescue service",
  personal_belongings:    "Personal belongings",
  valuables:              "Valuables",
  cash_and_documents:     "Cash and documents",
  purchase_protection:    "Purchase protection",
  return_guarantee:       "Return guarantee",
  fire_damage:            "Fire damage",
  water_damage:           "Water damage",
  natural_disaster:       "Natural disaster",
  theft_burglary:         "Theft and burglary",
  vandalism:              "Vandalism",
  glass_damage:           "Glass damage",
  car_rental:             "Car rental coverage",
  collision_damage:       "Collision damage",
  comprehensive_damage:   "Comprehensive damage",
  vehicle_theft:          "Vehicle theft",
  roadside_assistance:    "Roadside assistance",
  vehicle_glass:          "Vehicle glass",
  personal_liability:     "Personal liability",
  legal_assistance:       "Legal assistance",
  legal_protection:       "Legal protection",
  deductible:             "Deductible",
  coverage_area:          "Coverage area",
  coverage_duration:      "Coverage duration",
  eligibility_conditions: "Eligibility conditions",
  other:                  "Other",
}
