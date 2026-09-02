import { PageHero } from "@/components/drivers/page-hero";
import { LegalPageContent } from "@/components/privacy/legal-page-content";
import { TermsOfUseData } from "@/data";
import { policyImageUrls } from "@/lib/images/policy";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use | WattUp USA",
  description:
    "Read WattUp USA's Terms of Use governing your access to and use of the wattupusa.com website.",
  openGraph: {
    title: "Terms of Use | WattUp USA",
    description:
      "Read WattUp USA's Terms of Use governing your access to and use of the wattupusa.com website.",
    images: [
      {
        url: policyImageUrls.ogImage,
        width: 1200,
        height: 630,
        alt: "WattUp USA EV Charging",
      },
    ],
  },
  twitter: {
    title: "Terms of Use | WattUp USA",
    description:
      "Read WattUp USA's Terms of Use governing your access to and use of the wattupusa.com website.",
    images: [
      {
        url: policyImageUrls.ogImage,
        width: 1200,
        height: 630,
        alt: "WattUp USA EV Charging",
      },
    ],
  },
};

export default function TermsOfUsePage() {
  return (
    <main className="flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20">
      <PageHero
        image={policyImageUrls.policyPageHero}
        mobileImage={policyImageUrls.policyPageHeroMobile}
        alt="Terms of Use Hero"
        heading="Terms of Use"
        sectionClass="md:h-[810px]!"
        contentContainerClass="md:items-start w-full md:text-left"
        textContainerClass="md:items-start md:text-left"
        headingClass="md:text-left max-md:text-nowrap"
        overlay
      />
      <LegalPageContent data={TermsOfUseData} />
    </main>
  );
}
