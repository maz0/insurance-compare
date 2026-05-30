export type InsuranceProduct =
  | "car"
  | "home"        // building / structure
  | "contents"    // home contents / possessions (innbo / hemförsäkring)
  | "travel"
  | "pet"
  | "child"       // children's insurance — sold as one product (barneforsikring / barnförsäkring)
  | "accident"    // personal accident (ulykke)
  | "life"
  | "health"
  | "other"

export const PRODUCT_LABELS: Record<InsuranceProduct, string> = {
  car:      "Car",
  home:     "Home",
  contents: "Home contents",
  travel:   "Travel",
  pet:      "Pet",
  child:    "Child",
  accident: "Personal accident",
  life:     "Life",
  health:   "Health",
  other:    "Other",
}
