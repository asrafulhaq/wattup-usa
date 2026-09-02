import { PageHero } from "@/components/drivers/page-hero";
import { LegalPageContent } from "@/components/privacy/legal-page-content";
import { PrivacyPolicyData } from "@/data";
import { policyImageUrls } from "@/lib/images/policy";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | WattUp USA",
  description:
    "Read WattUp USA's Privacy Policy to understand how we collect, use, and protect your personal information.",
  openGraph: {
    title: "Privacy Policy | WattUp USA",
    description:
      "Read WattUp USA's Privacy Policy to understand how we collect, use, and protect your personal information.",
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
    title: "Privacy Policy | WattUp USA",
    description:
      "Read WattUp USA's Privacy Policy to understand how we collect, use, and protect your personal information.",
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

export default function PrivacyPolicyPage() {
  return (
    <main className="flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20">
      <PageHero
        image={policyImageUrls.policyPageHero}
        mobileImage={policyImageUrls.policyPageHeroMobile}
        alt="Privacy Policy Hero"
        heading="Privacy Policy"
        sectionClass="md:h-[810px]!"
        contentContainerClass="md:items-start w-full md:text-left"
        textContainerClass="md:items-start md:text-left"
        headingClass="md:text-left max-md:text-nowrap"
        overlay
      />
      <LegalPageContent data={PrivacyPolicyData} />
    </main>
  );
}
