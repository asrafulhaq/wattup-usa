"use client";

import { FadeUp } from "@/components/ui/fade-up";
import { FadedImageCrossSection } from "@/components/ui/faded-image-cross-section";
import { WattupButton } from "@/components/ui/wattup-button";
import { homeImageUrls } from "@/lib/images/home";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useRef } from "react";

import type { NetworkCity } from "@/lib/locations/network";

function ExpandingUsDriversInner({
  isLocationsPage,
  cities,
}: {
  isLocationsPage: boolean;
  cities: NetworkCity[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  const showAll = isLocationsPage && searchParams.get("showAll") === "true";

  const handleShowAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("showAll", "true");
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  useGSAP(
    () => {
      if (showAll) {
        const newCities = containerRef.current?.querySelectorAll(
          ".city-item:nth-child(n+9)",
        );
        if (newCities && newCities.length > 0) {
          gsap.from(newCities, {
            opacity: 0,
            y: 30,
            stagger: 0.04,
            duration: 0.6,
            ease: "power2.out",
            clearProps: "all",
          });
        }
      }
    },
    { dependencies: [showAll], scope: containerRef },
  );

  const visibleCities =
    isLocationsPage && showAll ? cities : cities.slice(0, 8);

  return (
    // On the locations page the finder above owns the #locations anchor, so this
    // section takes its own id rather than duplicating one.
    <div
      id={isLocationsPage ? "network" : "locations"}
      className="pt-[40px] md:pt-[82px]"
    >
      <FadedImageCrossSection
        imageSrc={homeImageUrls.locationMarqueBg}
        imageSrcMobile={homeImageUrls.locationMarqueBgMobile}
        imageAlt="Charging Stations By Water"
      >
        <div className="flex flex-col space-y-[32px] md:space-y-20 w-full max-w-[1440px] px-4 md:px-10 mx-auto justify-start">
          <div className="flex flex-col gap-10">
            {" "}
            <FadeUp>
              <h2 className="headline-dark max-md:w-[305px] text-left w-full">
                Explore Our Growing Network
              </h2>
            </FadeUp>
            <FadeUp delay={0.1}>
              <p className="text-description text-dark/70 max-md:max-w-full max-w-3xl">
                WattUpUSA is strategically expanding its ultra-fast EV charging
                network throughout California’s high-traffic retail and
                commercial corridors through a disciplined deployment strategy
                focused on long-term infrastructure growth.
              </p>
            </FadeUp>
          </div>

          <FadeUp delay={0.1} className="w-full">
            <div
              ref={containerRef}
              className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10 md:gap-y-20 w-full"
            >
              {visibleCities.map((city, idx) => (
                <Link
                  key={`${city.name}-${city.region}`}
                  href={city.href}
                  // A city with one site goes to that site; a city with several goes to
                  // the finder filtered to it. Either way the reader is one tap from the
                  // thing the section is advertising, which it was not before.
                  aria-label={
                    city.siteCount === 1
                      ? `${city.name}, ${city.county}: ${city.detail}, ${city.status}`
                      : `${city.name}: ${city.siteCount} locations`
                  }
                  className={`city-item group flex-col gap-2 md:gap-4 ${!showAll && idx >= 6 ? "hidden md:flex" : "flex"}`}
                >
                  <h3 className="flex items-center gap-1.5 text-[20px] md:text-[28px] font-semibold md:font-bold leading-[130%] md:leading-[110%] tracking-[-0.02em] text-dark transition-colors group-hover:text-primary">
                    {city.name}
                    <ArrowUpRight className="size-4 shrink-0 opacity-0 transition-all duration-200 md:size-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
                  </h3>
                  <div className="flex flex-col gap-y-2 text-[16px] md:text-[20px] text-dark leading-[120%]">
                    {city.county && (
                      <span className="text-dark/60">{city.county}</span>
                    )}
                    <span>{city.capacity}</span>
                    <span>{city.detail}</span>
                    <span>{city.status}</span>
                  </div>
                </Link>
              ))}
            </div>
          </FadeUp>

          <FadeUp delay={0.2} className="relative z-20 w-full mb-30">
            {isLocationsPage ? (
              cities.length > 8 &&
              !showAll && (
                <WattupButton
                  onClick={handleShowAll}
                  className="w-full md:w-auto mb-8"
                >
                  See More Locations
                </WattupButton>
              )
            ) : (
              <WattupButton
                href="/locations#locations"
                className="w-full md:w-auto mb-8"
              >
                View All Locations
              </WattupButton>
            )}
          </FadeUp>
        </div>
      </FadedImageCrossSection>
    </div>
  );
}

export function ExpandingUsDrivers({
  cities,
  isLocationsPage = false,
}: {
  /** Read from the database on the server. See lib/locations/network.ts. */
  cities: NetworkCity[];
  isLocationsPage?: boolean;
}) {
  return (
    <Suspense fallback={null}>
      <ExpandingUsDriversInner
        isLocationsPage={isLocationsPage}
        cities={cities}
      />
    </Suspense>
  );
}
