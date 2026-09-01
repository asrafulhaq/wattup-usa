import { StationDetail } from "@/components/locations/station-detail";
import { formatAddress, statusLabel } from "@/lib/locations/public";
import { getPublicStations } from "@/lib/locations/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface StationPageProps {
  params: Promise<{ slug: string }>;
}

/**
 * One page per station, built at compile time.
 *
 * "EV charging near Redlands" is a query people type, and a map alone is invisible to
 * it. Twenty-seven indexed pages carrying an address and LocalBusiness markup are not.
 */
export async function generateStaticParams() {
  return getPublicStations().map((station) => ({ slug: station.slug }));
}

export async function generateMetadata({
  params,
}: StationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const station = getPublicStations().find((entry) => entry.slug === slug);
  if (!station) return { title: "Charging Location | WattUp USA" };

  const title = `EV Charging on ${station.street}, ${station.city} | WattUp USA`;
  const description = `${station.maxPowerKw}kW ultra fast EV charging with ${station.chargerCount} chargers at ${formatAddress(station)}. ${statusLabel(station)}.`;

  return {
    title,
    description,
    alternates: { canonical: `/locations/${station.slug}` },
    openGraph: { title, description, type: "website" },
    twitter: { title, description },
  };
}

export default async function StationPage({ params }: StationPageProps) {
  const { slug } = await params;
  const stations = getPublicStations();
  const station = stations.find((entry) => entry.slug === slug);
  if (!station) notFound();

  return <StationDetail station={station} stations={stations} />;
}
