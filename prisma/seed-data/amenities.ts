/**
 * The amenity catalogue the seed uploads.
 *
 * Modelled on the facilities the reference network lists, minus its brand specific
 * entries: "Casey's Pizza" is a tenant of theirs, not a facility type, so it becomes
 * Food. A few additions cover what a driver waiting twenty minutes actually looks for.
 *
 * This is seed input, not the catalogue itself. Once seeded the database owns it, and
 * the client renames, reorders, disables and adds entries from the dashboard. The seed
 * is idempotent on `slug`, and deliberately does not reset a label or a sort order that
 * has been edited there.
 *
 * `icon` is a key into AMENITY_ICONS in lib/locations/amenities.ts.
 */
export interface SeedAmenity {
  slug: string;
  label: string;
  icon: string;
  sortOrder: number;
}

export const SEED_AMENITIES: SeedAmenity[] = [
  { slug: "restrooms", label: "Restrooms", icon: "toilet", sortOrder: 10 },
  { slug: "food", label: "Food", icon: "sandwich", sortOrder: 20 },
  { slug: "restaurant", label: "Restaurant", icon: "utensils", sortOrder: 30 },
  { slug: "beverages", label: "Beverages", icon: "cup-soda", sortOrder: 40 },
  { slug: "market", label: "Market", icon: "store", sortOrder: 50 },
  { slug: "shopping", label: "Shopping", icon: "shopping-bag", sortOrder: 60 },
  { slug: "lounge", label: "Lounge", icon: "armchair", sortOrder: 70 },
  { slug: "wifi", label: "Wi-Fi", icon: "wifi", sortOrder: 80 },
  { slug: "hotel", label: "Hotel", icon: "bed-double", sortOrder: 90 },
  { slug: "car_wash", label: "Car Wash", icon: "car-front", sortOrder: 100 },
  { slug: "vending", label: "Vending Machine", icon: "package", sortOrder: 110 },
  { slug: "pet_friendly", label: "Pet Friendly", icon: "paw-print", sortOrder: 120 },
  { slug: "covered", label: "Covered Parking", icon: "umbrella", sortOrder: 130 },
  { slug: "lighting", label: "Lit at Night", icon: "lightbulb", sortOrder: 140 },
  { slug: "accessible", label: "Step-free Access", icon: "accessibility", sortOrder: 150 },
];
