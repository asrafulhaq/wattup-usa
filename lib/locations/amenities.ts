import {
  Accessibility,
  Armchair,
  BedDouble,
  CarFront,
  CupSoda,
  Lightbulb,
  Package,
  PawPrint,
  Sandwich,
  ShoppingBag,
  Store,
  Toilet,
  Umbrella,
  Utensils,
  Wifi,
  type LucideIcon,
} from "lucide-react";

export interface Amenity {
  id: string;
  label: string;
  icon: LucideIcon;
}

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
 *
 * The icon travels with the entry so the filter, the station card and the dashboard all
 * draw the same amenity the same way, rather than each keeping its own lookup table.
 */
export const AMENITIES = [
  { id: "restrooms", label: "Restrooms", icon: Toilet },
  { id: "food", label: "Food", icon: Sandwich },
  { id: "restaurant", label: "Restaurant", icon: Utensils },
  { id: "beverages", label: "Beverages", icon: CupSoda },
  { id: "market", label: "Market", icon: Store },
  { id: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: "lounge", label: "Lounge", icon: Armchair },
  { id: "wifi", label: "Wi-Fi", icon: Wifi },
  { id: "hotel", label: "Hotel", icon: BedDouble },
  { id: "car_wash", label: "Car Wash", icon: CarFront },
  { id: "vending", label: "Vending Machine", icon: Package },
  { id: "pet_friendly", label: "Pet Friendly", icon: PawPrint },
  { id: "covered", label: "Covered Parking", icon: Umbrella },
  { id: "lighting", label: "Lit at Night", icon: Lightbulb },
  { id: "accessible", label: "Step-free Access", icon: Accessibility },
] as const satisfies readonly Amenity[];

export type AmenityId = (typeof AMENITIES)[number]["id"];

export const AMENITY_IDS: AmenityId[] = AMENITIES.map((amenity) => amenity.id);

export function amenityLabel(id: AmenityId): string {
  return AMENITIES.find((amenity) => amenity.id === id)?.label ?? id;
}
