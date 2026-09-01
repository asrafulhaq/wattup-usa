import { MapCanvasClient } from "@/components/locations/map/map-canvas-client";
import { AMENITIES } from "@/lib/locations/amenities";
import { haversineMiles, formatDistance } from "@/lib/locations/distance";
import { formatAddress, statusLabel } from "@/lib/locations/public";
import { getMapboxToken } from "@/lib/locations/server";
import type { PublicStation } from "@/lib/locations/types";
import Link from "next/link";

interface StationDetailProps {
  station: PublicStation;
  stations: PublicStation[];
}

/** How many other sites to suggest at the foot of the page. */
const NEARBY_COUNT = 3;

export function StationDetail({ station, stations }: StationDetailProps) {
  const amenities = AMENITIES.filter((amenity) =>
    station.amenities.includes(amenity.id),
  );
  const isOpen = station.status === "LIVE";

  const nearby = stations
    .filter((entry) => entry.slug !== station.slug)
    .map((entry) => ({
      entry,
      miles: haversineMiles(
        station.latitude,
        station.longitude,
        entry.latitude,
        entry.longitude,
      ),
    }))
    .sort((a, b) => a.miles - b.miles)
    .slice(0, NEARBY_COUNT);

  /**
   * Structured data for the station.
   *
   * Emitted from the same fields the page renders, so the two cannot drift. Only what is
   * true goes in: there is no price, no opening hours and no rating here, and inventing
   * any of them to fill the schema would be a lie a search engine repeats.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ElectricVehicleChargingStation",
    name: station.name,
    address: {
      "@type": "PostalAddress",
      streetAddress: station.street,
      addressLocality: station.city,
      addressRegion: station.region,
      postalCode: station.postalCode,
      addressCountry: station.country,
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: station.latitude,
      longitude: station.longitude,
    },
    brand: { "@type": "Brand", name: "WattUp USA" },
    url: `https://wattupusa.com/locations/${station.slug}`,
  };

  return (
    <main className="w-full bg-[#F7F9FC] pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto w-full max-w-[1440px] px-4 pt-28 md:px-10 md:pt-36">
        <Link
          href="/locations#locations"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-primary transition-opacity hover:opacity-70"
        >
          &larr; All locations
        </Link>

        <h1 className="headline-dark mt-5 max-w-3xl text-left">
          EV Charging on {station.street}, {station.city}
        </h1>
        <p className="mt-4 text-[18px] text-dark/70">{formatAddress(station)}</p>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <span
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] font-semibold ${
              isOpen ? "bg-primary/10 text-primary" : "bg-amber-100 text-amber-800"
            }`}
          >
            <span
              aria-hidden="true"
              className={`h-2 w-2 rounded-full ${isOpen ? "bg-primary" : "bg-amber-500"}`}
            />
            {statusLabel(station)}
          </span>
          {/* Handing off to the phone's own map app rather than routing in the page:
              turn by turn is a solved problem and the driver already trusts theirs. */}
          <a
            href={`https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-primary px-5 py-2 text-[14px] font-semibold text-white transition-colors hover:bg-primary-hover"
          >
            Get directions
          </a>
        </div>

        <dl className="mt-10 grid grid-cols-2 gap-x-6 gap-y-8 border-y border-black/10 py-8 md:grid-cols-4">
          {[
            { label: "Charging speed", value: `${station.maxPowerKw}kW` },
            { label: "Chargers", value: String(station.chargerCount) },
            { label: "County", value: station.county },
            { label: "Availability", value: statusLabel(station) },
          ].map((stat) => (
            <div key={stat.label}>
              <dt className="text-[13px] font-semibold uppercase tracking-[0.08em] text-dark/45">
                {stat.label}
              </dt>
              <dd className="mt-2 text-[24px] font-bold leading-[110%] tracking-[-0.02em] text-dark md:text-[28px]">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-start">
          <div>
            <h2 className="text-[20px] font-bold tracking-[-0.02em] text-dark">
              Amenities
            </h2>
            {amenities.length > 0 ? (
              <ul className="mt-4 flex flex-col gap-3">
                {amenities.map((amenity) => (
                  <li
                    key={amenity.id}
                    className="flex items-center gap-3 text-[16px] text-dark"
                  >
                    <amenity.icon aria-hidden="true" className="h-5 w-5 text-dark/50" />
                    {amenity.label}
                  </li>
                ))}
              </ul>
            ) : (
              /* Said plainly rather than left blank: an empty heading reads as a page
                 that failed to load, and we genuinely have not surveyed these yet. */
              <p className="mt-4 text-[15px] leading-[150%] text-dark/55">
                Amenity details for this site are being confirmed and will appear here
                once the site survey is complete.
              </p>
            )}
          </div>

          <div className="overflow-hidden rounded-lg bg-[#E8EDF4]">
            <MapCanvasClient
              stations={[station]}
              mapboxToken={getMapboxToken()}
              className="h-[320px] w-full md:h-[440px]"
            />
          </div>
        </div>

        {nearby.length > 0 && (
          <section className="mt-16">
            <h2 className="text-[20px] font-bold tracking-[-0.02em] text-dark">
              Nearby WattUp locations
            </h2>
            <ul className="mt-5 grid gap-4 md:grid-cols-3">
              {nearby.map(({ entry, miles }) => (
                <li key={entry.slug}>
                  <Link
                    href={`/locations/${entry.slug}`}
                    className="flex h-full flex-col rounded-xl border border-black/10 bg-white p-5 transition-colors hover:border-primary/40"
                  >
                    <span className="text-[18px] font-bold tracking-[-0.01em] text-dark">
                      {entry.city}
                    </span>
                    <span className="mt-1 text-[14px] text-dark/60">
                      {entry.street}
                    </span>
                    <span className="mt-3 text-[14px] font-medium text-dark/45">
                      {formatDistance(miles, "mi")} away &middot; {statusLabel(entry)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
