import { PageHero } from "@/components/drivers/page-hero";
import { StationFinder } from "@/components/locations/station-finder";
import { FadedImageCrossSection } from "@/components/ui/faded-image-cross-section";
import { homeImageUrls } from "@/lib/images/home";
import { locationsImageUrls } from "@/lib/images/locations";
import { getPublicStations } from "@/lib/locations/server";
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
  // Read on the server so the private columns of the sheet never enter the bundle:
  // only the projection from lib/locations/public crosses into the client island.
  const stations = getPublicStations();

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

      {/* 2. Station finder */}
      <StationFinder stations={stations} />

      {/* 3. The faded image band on its own: the finder above already carries the
          copy and the list, so only the image belongs here. */}
      <FadedImageCrossSection
        imageSrc={homeImageUrls.locationMarqueBg}
        imageSrcMobile={homeImageUrls.locationMarqueBgMobile}
        imageAlt="WattUp charging stations"
        imageWrapperClass="relative w-full h-[380px] sm:h-[560px] md:h-[760px] lg:h-[900px]"
      />
    </main>
  );
}
