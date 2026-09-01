/**
 * The amenity catalogue.
 *
 * Modelled on the facilities the reference network lists, minus its brand specific
 * entries: "Casey's Pizza" is a tenant of theirs, not a facility type, so it becomes
 * Food. A few additions cover what a driver waiting twenty minutes actually looks for.
 *
 * This is the full set the seed uploads, so every option exists in the database before
 * anyone opens the dashboard. Which amenities a given site has is then assigned there,
 * per location, rather than being edited in code.
 */
export const AMENITIES = [
  { id: "restrooms", label: "Restrooms" },
  { id: "food", label: "Food" },
  { id: "restaurant", label: "Restaurant" },
  { id: "beverages", label: "Beverages" },
  { id: "market", label: "Market" },
  { id: "shopping", label: "Shopping" },
  { id: "lounge", label: "Lounge" },
  { id: "wifi", label: "Wi-Fi" },
  { id: "hotel", label: "Hotel" },
  { id: "car_wash", label: "Car Wash" },
  { id: "vending", label: "Vending Machine" },
  { id: "pet_friendly", label: "Pet Friendly" },
  { id: "covered", label: "Covered Parking" },
  { id: "lighting", label: "Lit at Night" },
  { id: "accessible", label: "Step-free Access" },
] as const;

export type AmenityId = (typeof AMENITIES)[number]["id"];

export const AMENITY_IDS: AmenityId[] = AMENITIES.map((amenity) => amenity.id);

export function amenityLabel(id: AmenityId): string {
  return AMENITIES.find((amenity) => amenity.id === id)?.label ?? id;
}
