import { StationDetail } from "@/components/locations/station-detail";
import { locationsImageUrls } from "@/lib/images/locations";
import { metaDescriptionFor, metaTitleFor } from "@/lib/locations/public";
import { getAmenityCatalogue, getPublicStations } from "@/lib/locations/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

const SITE_URL = (
  process.env.NEXT_PUBLIC_APP_URL || "https://wattupusa.com"
).replace(/\/$/, "");

interface StationPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * One page per station, built at compile time.
 *
 * "EV charging near Redlands" is a query people type, and a map alone is invisible to
 * it. Twenty-seven indexed pages carrying an address and LocalBusiness markup are not.
 *
 * A site added in the dashboard after a build is not in this list. dynamicParams is on
 * by default, so its page renders on demand rather than 404ing until the next deploy.
 */
export async function generateStaticParams() {
  const stations = await getPublicStations();
  return stations.map((station) => ({ slug: station.slug }));
}

export async function generateMetadata({
  params,
}: StationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const stations = await getPublicStations();
  const station = stations.find((entry) => entry.slug === slug);
  if (!station) return { title: "Charging Location | WattUp USA" };

  // Overrides from the dashboard when set, otherwise generated from the address.
  const title = metaTitleFor(station);
  const description = metaDescriptionFor(station);
  const url = `${SITE_URL}/locations/${station.slug}`;

  // The network hero is the fallback rather than nothing at all: a link with no image
  // renders as a bare grey box everywhere it is posted. It is the same image /locations
  // already shares, so an unphotographed site still looks like part of the network.
  const image = station.imageUrl ?? locationsImageUrls.locationPageHeroBg;

  return {
    title,
    description,
    alternates: { canonical: `/locations/${station.slug}` },
    // A site hidden from search still works for anyone holding the link; this only
    // stops it being listed, and the sitemap drops it to match.
    robots: station.noIndex
      ? { index: false, follow: true }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url,
      siteName: "WattUp USA",
      type: "website",
      locale: "en_US",
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: `${station.name}, ${station.city}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    other: {
      // Read by Apple Maps and a few aggregators, and cheap to emit correctly.
      "geo.position": `${station.latitude};${station.longitude}`,
      "geo.placename": `${station.city}, ${station.region}`,
      "geo.region": `${station.country}-${station.region}`,
      ICBM: `${station.latitude}, ${station.longitude}`,
    },
  };
}

export default async function StationPage({ params }: StationPageProps) {
  const { slug } = await params;
  const [stations, amenities] = await Promise.all([
    getPublicStations(),
    getAmenityCatalogue(),
  ]);
  const station = stations.find((entry) => entry.slug === slug);
  if (!station) notFound();

  return (
    <StationDetail station={station} stations={stations} amenities={amenities} />
  );
}
