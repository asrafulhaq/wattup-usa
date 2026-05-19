import { ExpandingUsDrivers } from "@/components/drivers/expanding-us-drivers";
import { PageHero } from "@/components/drivers/page-hero";
import { hostsImageUrls } from "@/lib/images/hosts";
import { locationsImageUrls } from "@/lib/images/locations";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Charging Locations | Find a WattUp Station",
  description:
    "Explore WattUp EV charging locations across our network and find a fast, reliable charger near you.",
  openGraph: {
    title: "Charging Locations | Find a WattUp Station",
    description:
      "Explore WattUp EV charging locations across our network and find a fast, reliable charger near you.",
    images: [
      {
        url: locationsImageUrls.locationPageHeroBg,
        width: 1200,
        height: 630,
        alt: "WattUp USA EV Charging",
      },
    ],
  },
  twitter: {
    title: "Charging Locations | Find a WattUp Station",
    description:
      "Explore WattUp EV charging locations across our network and find a fast, reliable charger near you.",
    images: [
      {
        url: locationsImageUrls.locationPageHeroBg,
        width: 1200,
        height: 630,
        alt: "WattUp USA EV Charging",
      },
    ],
  },
};

export default function LocationsPage() {
  return (
    <main className="flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20">
      {/* 01. Hero Section */}
      <PageHero
        image={locationsImageUrls.locationPageHeroBg}
        mobileImage={locationsImageUrls.locationPageHeroBgMobile}
        alt="Location Page Hero Background"
        heading=" Find a Charging Station"
        imageClass="max-md:object-[16%] xl:object-bottom"
        headingClass="max-md:text-nowrap"
        subHeadingClass="max-md:max-w-[256px] max-w-[416px]"
        overlay={true}
        subHeading={
          <>
            Explore WattUp locations across our{" "}
            <br className="hidden md:block" />
            network.
          </>
        }
        buttonText="Find a Charger"
        buttonLink="/locations#locations"
      />

      {/* 2. Expanding Us */}
      <ExpandingUsDrivers isLocationsPage={true} />
      {/* 2. Find Location */}
      {/* <FindLocation /> */}
    </main>
  );
}
