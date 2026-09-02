import {
  Accessibility,
  Armchair,
  Baby,
  BedDouble,
  Bike,
  Camera,
  CarFront,
  CircleDot,
  Clock,
  Coffee,
  CupSoda,
  Dumbbell,
  Fuel,
  Lightbulb,
  Package,
  PawPrint,
  Plug,
  ShieldCheck,
  ShoppingBag,
  ShowerHead,
  Sandwich,
  Store,
  Toilet,
  TreePine,
  Truck,
  Umbrella,
  Utensils,
  Wifi,
  type LucideIcon,
} from "lucide-react";

/**
 * The icon registry.
 *
 * The amenity catalogue lives in the database so the client can rename, reorder and
 * disable entries without a deploy. An icon cannot: a React component is not a column
 * value. So a row stores a key from this map, and the resolution happens here, in one
 * place, for the filter tray, the station card, the detail page and the dashboard alike.
 *
 * Adding a key here is what gives the dashboard's icon picker a new option. Removing one
 * is safe: rows pointing at it fall back rather than crash.
 */
export const AMENITY_ICONS = {
  accessibility: Accessibility,
  armchair: Armchair,
  baby: Baby,
  "bed-double": BedDouble,
  bike: Bike,
  camera: Camera,
  "car-front": CarFront,
  clock: Clock,
  coffee: Coffee,
  "cup-soda": CupSoda,
  dot: CircleDot,
  dumbbell: Dumbbell,
  fuel: Fuel,
  lightbulb: Lightbulb,
  package: Package,
  "paw-print": PawPrint,
  plug: Plug,
  sandwich: Sandwich,
  "shield-check": ShieldCheck,
  "shopping-bag": ShoppingBag,
  "shower-head": ShowerHead,
  store: Store,
  toilet: Toilet,
  "tree-pine": TreePine,
  truck: Truck,
  umbrella: Umbrella,
  utensils: Utensils,
  wifi: Wifi,
} as const satisfies Record<string, LucideIcon>;

export type AmenityIconKey = keyof typeof AMENITY_ICONS;

/** Sorted, for the dashboard's icon picker. */
export const AMENITY_ICON_KEYS = Object.keys(AMENITY_ICONS).sort() as AmenityIconKey[];

/**
 * An amenity's id.
 *
 * A plain string, not a union of the entries we happen to ship. The catalogue is rows a
 * person can add to, so a literal type here would be a promise the database cannot keep.
 * Validation is against the catalogue that was actually loaded, not against this type.
 */
export type AmenityId = string;

/**
 * One catalogue entry as it crosses to the browser.
 *
 * `icon` is the registry key rather than the component, because this is passed from a
 * server component to a client one and a function does not serialise.
 */
export interface AmenityOption {
  id: AmenityId;
  label: string;
  icon: string;
}

/** Resolves a stored key to a component, falling back rather than throwing. */
export function amenityIcon(key: string): LucideIcon {
  return AMENITY_ICONS[key as AmenityIconKey] ?? CircleDot;
}

export function amenityLabel(
  id: AmenityId,
  catalogue: readonly AmenityOption[],
): string {
  return catalogue.find((amenity) => amenity.id === id)?.label ?? id;
}

/** The catalogue entries a station has, in catalogue order. */
export function stationAmenities(
  ids: readonly AmenityId[],
  catalogue: readonly AmenityOption[],
): AmenityOption[] {
  return catalogue.filter((amenity) => ids.includes(amenity.id));
}
