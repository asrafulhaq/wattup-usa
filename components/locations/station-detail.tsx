import { MapCanvasClient } from "@/components/locations/map/map-canvas-client";
import { AMENITIES } from "@/lib/locations/amenities";
import { formatDistance, haversineMiles } from "@/lib/locations/distance";
import { statusLabel } from "@/lib/locations/public";
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

  const directions = `https://www.google.com/maps/dir/?api=1&destination=${station.latitude},${station.longitude}`;

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
    <main className="w-full bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero. Dark, so the page opens on the same ground the minimal map uses. */}
      <section className="w-full bg-[#3A3F45] pb-14 pt-28 md:pb-20 md:pt-36">
        <div className="mx-auto w-full max-w-[1440px] px-4 md:px-10">
          <Link
            href="/locations#locations"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-white/60 transition-colors hover:text-white"
          >
            &larr; All locations
          </Link>

          <h1 className="mt-5 max-w-4xl text-[32px] font-bold leading-[110%] tracking-[-0.02em] text-white md:text-[52px]">
            EV Charging in {station.city}, {station.region}
            <span className="text-white/45"> | {station.street}</span>
          </h1>

          <p className="mt-4 text-[17px] font-semibold text-white/75">
            WattUp {station.city} &middot; {station.county} County
          </p>

          <div className="mt-7 flex flex-wrap items-center gap-4">
            <p className="text-[15px] leading-[150%] text-white/70">
              {station.street}
              <br />
              {station.city}, {station.region} {station.postalCode}
            </p>
            <a
              href={directions}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-primary px-6 py-2.5 text-[15px] font-semibold text-white transition-colors hover:bg-primary-hover"
            >
              Get directions
            </a>
          </div>
        </div>
      </section>

      {/* The band the reference leads with: the numbers a driver checks before setting
          off, on one line, separated rather than boxed. */}
      <section className="w-full bg-[#EEF2F7]">
        <div className="mx-auto grid w-full max-w-[1440px] grid-cols-2 gap-y-8 px-4 py-8 md:grid-cols-4 md:gap-y-0 md:px-10 md:py-10">
          {[
            {
              label: "Max charge speed",
              value: `${station.maxPowerKw}kW`,
              note: "DC fast charging",
            },
            {
              label: "Chargers",
              value: String(station.chargerCount),
              note: station.chargerCount === 1 ? "Bay on site" : "Bays on site",
            },
            {
              label: "Availability",
              value: statusLabel(station),
              note: isOpen ? "Open to drivers" : `Opening ${station.goLiveYear}`,
            },
            { label: "County", value: station.county, note: `${station.region}, USA` },
          ].map((stat, index) => (
            <div
              key={stat.label}
              className={
                index > 0 ? "md:border-l md:border-black/10 md:pl-8" : "md:pr-8"
              }
            >
              <p className="text-[13px] font-semibold text-dark/50">{stat.label}</p>
              <p className="mt-1.5 text-[26px] font-bold leading-[110%] tracking-[-0.02em] text-dark md:text-[32px]">
                {stat.value}
              </p>
              <p className="mt-1 text-[13px] text-dark/45">{stat.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-[1440px] px-4 py-12 md:px-10 md:py-16">
        <div className="grid gap-10 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-start lg:gap-14">
          <div className="flex flex-col divide-y divide-black/10">
            <div className="pb-6">
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
                   that failed to load, and these genuinely have not been surveyed. */
                <p className="mt-3 text-[15px] leading-[150%] text-dark/55">
                  Being confirmed for this site.
                </p>
              )}
            </div>

            <DetailRow label="Charging speed" value={`${station.maxPowerKw}kW`} />
            <DetailRow label="Chargers" value={`${station.chargerCount} on site`} />
            <DetailRow label="Availability" value={statusLabel(station)} />
            {/* Kept visible rather than hidden. The slot exists, the data does not yet,
                and saying so is more use than a page that quietly omits it. */}
            <DetailRow label="Connector types" value="Being confirmed" muted />
            <DetailRow label="Pricing" value="Being confirmed" muted />

            <div className="pt-6">
              <a
                href={directions}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center rounded-full border border-primary px-5 py-3 text-[15px] font-semibold text-primary transition-colors hover:bg-primary/5"
              >
                Get directions
              </a>
            </div>
          </div>

          {/* Matched to the finder's map, so moving between the two does not feel like
              moving between two different products. */}
          <div className="overflow-hidden rounded-lg bg-[#E8EDF4]">
            <MapCanvasClient
              stations={[station]}
              mapboxToken={getMapboxToken()}
              className="h-[520px] w-full md:h-[780px]"
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
                    <span className="mt-1 text-[14px] text-dark/60">{entry.street}</span>
                    <span className="mt-3 text-[14px] font-medium text-dark/45">
                      {formatDistance(miles, "mi")} away &middot; {statusLabel(entry)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </section>
    </main>
  );
}

function DetailRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <div className="py-5">
      <p className="text-[16px] font-bold text-dark">{label}</p>
      <p className={`mt-1 text-[16px] ${muted ? "text-dark/40" : "text-dark/70"}`}>
        {value}
      </p>
    </div>
  );
}
