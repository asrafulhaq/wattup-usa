import { PageHero } from "@/components/drivers/page-hero";
import PolicyLeagals from "@/components/privacy/legal";
import { PrivacyOptions } from "@/components/privacy/privacy-options";
import { policyImageUrls } from "@/lib/images/policy";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Privacy Policy | WattUp USA",
  description:
    "Read WattUp USA’s Privacy Policy to understand how we collect, use, and protect your personal information.",
  openGraph: {
    title: "Privacy Policy | WattUp USA",
    description:
      "Read WattUp USA’s Privacy Policy to understand how we collect, use, and protect your personal information.",
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
      "Read WattUp USA’s Privacy Policy to understand how we collect, use, and protect your personal information.",
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

export default function PolicyPage() {
  return (
    <main className="flex min-h-screen w-full flex-col mx-auto bg-background selection:bg-primary/20">
      <Suspense fallback={null}>
        {/* 01. Hero Section */}
        <PageHero
          image={policyImageUrls.policyPageHero}
          mobileImage={policyImageUrls.policyPageHeroMobile}
          alt="Policy Page Hero Background"
          heading="Terms of Use"
          sectionClass="md:h-[810px]!"
          contentContainerClass="md:items-start w-full md:text-left"
          textContainerClass="md:items-start md:text-left"
          headingClass="md:text-left max-md:text-nowrap"
          overlay
        />

        {/* 2. Policy Options */}
        {/* <PrivacyOptions /> */}

        {/* 3. Policy Leagals */}
        <section
          id="legal"
          className="w-full common-section-padding bg-white overflow-hidden"
        >
          <div className="container">
            <>
              <h1>
                <strong>
                  <span
                    style={{
                      color: "#1a1a1a",
                      fontSize: "16pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    Terms of Use
                  </span>
                </strong>
              </h1>
              <p>
                <strong>
                  <span
                    style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                  >
                    Effective Date:&nbsp;
                  </span>
                </strong>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  May 18, 2026
                </span>
              </p>
              <p>
                <strong>
                  <span
                    style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                  >
                    Company:&nbsp;
                  </span>
                </strong>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  WattUp USA LLC
                </span>
              </p>
              <p>
                <strong>
                  <span
                    style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                  >
                    Address:&nbsp;
                  </span>
                </strong>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  2355 Westwood Blvd. #1017, Los Angeles, CA 90064
                </span>
              </p>
              <p>
                <strong>
                  <span
                    style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                  >
                    Contact:&nbsp;
                  </span>
                </strong>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  support@wattupusa.com
                </span>
              </p>
              <p style={{ borderBottom: "solid #cccccc 0.5pt" }}>
                <br />
              </p>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  Please read these Terms of Use carefully before using the
                  WattUp USA website located at wattupusa.com (the "Site").
                  These Terms govern your access to and use of the Site. By
                  accessing or using the Site in any way, you agree to be bound
                  by these Terms. If you do not agree, please do not use the
                  Site.
                </span>
              </p>
              <p>
                <br />
              </p>
              <p style={{ borderBottom: "solid #cccccc 0.5pt" }}>
                <br />
              </p>
              <h2>
                <strong>
                  <span
                    style={{
                      color: "#1a1a1a",
                      fontSize: "13pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    1. About the Site
                  </span>
                </strong>
              </h2>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  The Site is an informational and inquiry platform operated by
                  WattUp USA LLC ("WattUp," "we," "our," or "us"). The Site
                  provides information about WattUp's EV charging network,
                  charging station locations, and opportunities for property
                  owners and businesses to partner with WattUp as Hosts.
                </span>
              </p>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  The Site serves two primary audiences:
                </span>
              </p>
              <ul>
                <li
                  style={{
                    listStyleType: "disc",
                    fontSize: "11pt",
                    fontFamily: "Arial,sans-serif",
                  }}
                >
                  <p role="presentation">
                    <span
                      style={{
                        fontSize: "11pt",
                        fontFamily: "Arial,sans-serif",
                      }}
                    >
                      Drivers: Individuals who use or are interested in using
                      WattUp EV charging stations.
                    </span>
                  </p>
                </li>
                <li
                  style={{
                    listStyleType: "disc",
                    fontSize: "11pt",
                    fontFamily: "Arial,sans-serif",
                  }}
                >
                  <p role="presentation">
                    <span
                      style={{
                        fontSize: "11pt",
                        fontFamily: "Arial,sans-serif",
                      }}
                    >
                      Hosts / Property Partners: Businesses and property owners
                      who are interested in hosting WattUp charging
                      infrastructure on their properties.
                    </span>
                  </p>
                </li>
              </ul>
              <p>
                <br />
              </p>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  The Site is an informational resource only. Actual charging
                  services are provided at physical WattUp charging stations,
                  subject to separate terms and conditions applicable at the
                  point of service.
                </span>
              </p>
              <p>
                <br />
              </p>
              <p style={{ borderBottom: "solid #cccccc 0.5pt" }}>
                <br />
              </p>
              <h2>
                <strong>
                  <span
                    style={{
                      color: "#1a1a1a",
                      fontSize: "13pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    2. Acceptance of Terms
                  </span>
                </strong>
              </h2>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  By accessing or using the Site, you represent that:
                </span>
              </p>
              <ul>
                <li
                  style={{
                    listStyleType: "disc",
                    fontSize: "11pt",
                    fontFamily: "Arial,sans-serif",
                  }}
                >
                  <p role="presentation">
                    <span
                      style={{
                        fontSize: "11pt",
                        fontFamily: "Arial,sans-serif",
                      }}
                    >
                      You are at least 18 years of age;
                    </span>
                  </p>
                </li>
                <li
                  style={{
                    listStyleType: "disc",
                    fontSize: "11pt",
                    fontFamily: "Arial,sans-serif",
                  }}
                >
                  <p role="presentation">
                    <span
                      style={{
                        fontSize: "11pt",
                        fontFamily: "Arial,sans-serif",
                      }}
                    >
                      You have the legal capacity to enter into a binding
                      agreement; and
                    </span>
                  </p>
                </li>
                <li
                  style={{
                    listStyleType: "disc",
                    fontSize: "11pt",
                    fontFamily: "Arial,sans-serif",
                  }}
                >
                  <p role="presentation">
                    <span
                      style={{
                        fontSize: "11pt",
                        fontFamily: "Arial,sans-serif",
                      }}
                    >
                      You agree to comply with these Terms of Use and all
                      applicable laws and regulations.
                    </span>
                  </p>
                </li>
              </ul>
              <p>
                <br />
              </p>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  If you are using the Site on behalf of a company or other
                  legal entity, you represent that you have the authority to
                  bind that entity to these Terms.
                </span>
              </p>
              <p>
                <br />
              </p>
              <p style={{ borderBottom: "solid #cccccc 0.5pt" }}>
                <br />
              </p>
              <h2>
                <strong>
                  <span
                    style={{
                      color: "#1a1a1a",
                      fontSize: "13pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    3. Permitted Use
                  </span>
                </strong>
              </h2>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  You may use the Site for lawful purposes only, including to:
                </span>
              </p>
              <ul>
                <li
                  style={{
                    listStyleType: "disc",
                    fontSize: "11pt",
                    fontFamily: "Arial,sans-serif",
                  }}
                >
                  <p role="presentation">
                    <span
                      style={{
                        fontSize: "11pt",
                        fontFamily: "Arial,sans-serif",
                      }}
                    >
                      Locate WattUp charging stations using our network map;
                    </span>
                  </p>
                </li>
                <li
                  style={{
                    listStyleType: "disc",
                    fontSize: "11pt",
                    fontFamily: "Arial,sans-serif",
                  }}
                >
                  <p role="presentation">
                    <span
                      style={{
                        fontSize: "11pt",
                        fontFamily: "Arial,sans-serif",
                      }}
                    >
                      Learn about WattUp's services, technology, and host
                      partnership program;
                    </span>
                  </p>
                </li>
                <li
                  style={{
                    listStyleType: "disc",
                    fontSize: "11pt",
                    fontFamily: "Arial,sans-serif",
                  }}
                >
                  <p role="presentation">
                    <span
                      style={{
                        fontSize: "11pt",
                        fontFamily: "Arial,sans-serif",
                      }}
                    >
                      Submit a support or partnership inquiry through the Site's
                      contact forms; and
                    </span>
                  </p>
                </li>
                <li
                  style={{
                    listStyleType: "disc",
                    fontSize: "11pt",
                    fontFamily: "Arial,sans-serif",
                  }}
                >
                  <p role="presentation">
                    <span
                      style={{
                        fontSize: "11pt",
                        fontFamily: "Arial,sans-serif",
                      }}
                    >
                      Access publicly available informational content on the
                      Site.
                    </span>
                  </p>
                </li>
              </ul>
              <p>
                <br />
              </p>
              <p style={{ borderBottom: "solid #cccccc 0.5pt" }}>
                <br />
              </p>
              <h2>
                <strong>
                  <span
                    style={{
                      color: "#1a1a1a",
                      fontSize: "13pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    4. Prohibited Use
                  </span>
                </strong>
              </h2>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  You agree not to:
                </span>
              </p>
              <ul>
                <li
                  style={{
                    listStyleType: "disc",
                    fontSize: "11pt",
                    fontFamily: "Arial,sans-serif",
                  }}
                >
                  <p role="presentation">
                    <span
                      style={{
                        fontSize: "11pt",
                        fontFamily: "Arial,sans-serif",
                      }}
                    >
                      Use the Site in any way that violates applicable federal,
                      state, or local law or regulation;
                    </span>
                  </p>
                </li>
                <li
                  style={{
                    listStyleType: "disc",
                    fontSize: "11pt",
                    fontFamily: "Arial,sans-serif",
                  }}
                >
                  <p role="presentation">
                    <span
                      style={{
                        fontSize: "11pt",
                        fontFamily: "Arial,sans-serif",
                      }}
                    >
                      Attempt to gain unauthorized access to any portion of the
                      Site or any systems connected to it;
                    </span>
                  </p>
                </li>
                <li
                  style={{
                    listStyleType: "disc",
                    fontSize: "11pt",
                    fontFamily: "Arial,sans-serif",
                  }}
                >
                  <p role="presentation">
                    <span
                      style={{
                        fontSize: "11pt",
                        fontFamily: "Arial,sans-serif",
                      }}
                    >
                      Introduce viruses, malware, or other harmful code to the
                      Site;
                    </span>
                  </p>
                </li>
                <li
                  style={{
                    listStyleType: "disc",
                    fontSize: "11pt",
                    fontFamily: "Arial,sans-serif",
                  }}
                >
                  <p role="presentation">
                    <span
                      style={{
                        fontSize: "11pt",
                        fontFamily: "Arial,sans-serif",
                      }}
                    >
                      Scrape, harvest, or collect data from the Site using
                      automated tools without our express written permission;
                    </span>
                  </p>
                </li>
                <li
                  style={{
                    listStyleType: "disc",
                    fontSize: "11pt",
                    fontFamily: "Arial,sans-serif",
                  }}
                >
                  <p role="presentation">
                    <span
                      style={{
                        fontSize: "11pt",
                        fontFamily: "Arial,sans-serif",
                      }}
                    >
                      Use the Site to transmit unsolicited commercial
                      communications (spam);
                    </span>
                  </p>
                </li>
                <li
                  style={{
                    listStyleType: "disc",
                    fontSize: "11pt",
                    fontFamily: "Arial,sans-serif",
                  }}
                >
                  <p role="presentation">
                    <span
                      style={{
                        fontSize: "11pt",
                        fontFamily: "Arial,sans-serif",
                      }}
                    >
                      Impersonate WattUp or any other person or entity;
                    </span>
                  </p>
                </li>
                <li
                  style={{
                    listStyleType: "disc",
                    fontSize: "11pt",
                    fontFamily: "Arial,sans-serif",
                  }}
                >
                  <p role="presentation">
                    <span
                      style={{
                        fontSize: "11pt",
                        fontFamily: "Arial,sans-serif",
                      }}
                    >
                      Interfere with the proper operation of the Site or any
                      networks connected to it; or
                    </span>
                  </p>
                </li>
                <li
                  style={{
                    listStyleType: "disc",
                    fontSize: "11pt",
                    fontFamily: "Arial,sans-serif",
                  }}
                >
                  <p role="presentation">
                    <span
                      style={{
                        fontSize: "11pt",
                        fontFamily: "Arial,sans-serif",
                      }}
                    >
                      Reproduce, distribute, modify, or create derivative works
                      of any content on the Site without our prior written
                      consent.
                    </span>
                  </p>
                </li>
              </ul>
              <p>
                <br />
              </p>
              <p style={{ borderBottom: "solid #cccccc 0.5pt" }}>
                <br />
              </p>
              <h2>
                <strong>
                  <span
                    style={{
                      color: "#1a1a1a",
                      fontSize: "13pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    5. Intellectual Property
                  </span>
                </strong>
              </h2>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  All content on the Site — including but not limited to text,
                  graphics, logos, images, photographs, video, audio, icons,
                  data compilations, and software — is the property of WattUp
                  USA LLC or its licensors and is protected by U.S. and
                  international copyright, trademark, and other intellectual
                  property laws.
                </span>
              </p>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  The WattUp name, logo, and related marks are trademarks of
                  WattUp USA LLC. You may not use any WattUp trademark, service
                  mark, or trade name without our prior written permission.
                </span>
              </p>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  Nothing in these Terms grants you any license or right to use
                  any intellectual property owned by WattUp or any third party
                  except as expressly stated herein.
                </span>
              </p>
              <p>
                <br />
              </p>
              <p style={{ borderBottom: "solid #cccccc 0.5pt" }}>
                <br />
              </p>
              <h2>
                <strong>
                  <span
                    style={{
                      color: "#1a1a1a",
                      fontSize: "13pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    6. Information Submitted Through Forms
                  </span>
                </strong>
              </h2>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  When you submit information through the Site's contact forms
                  (Driver Support or Host Partnership), you grant WattUp a
                  non-exclusive, royalty-free license to use, store, and process
                  that information for the purpose of responding to your inquiry
                  and for the operation of our business as described in our
                  Privacy Policy.
                </span>
              </p>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  You represent that any information you submit is accurate,
                  complete, and not in violation of any third-party rights.
                </span>
              </p>
              <p>
                <br />
              </p>
              <p style={{ borderBottom: "solid #cccccc 0.5pt" }}>
                <br />
              </p>
              <h2>
                <strong>
                  <span
                    style={{
                      color: "#1a1a1a",
                      fontSize: "13pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    7. Charging Station Services — Separate Terms Apply
                  </span>
                </strong>
              </h2>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  The Site provides information about WattUp's physical EV
                  charging network and the ability to locate charging stations.
                  Actual charging services — including the use of charging
                  equipment, payment for charging sessions, pricing, and related
                  matters — are subject to separate terms and conditions
                  presented at the point of service at each charging station.
                </span>
              </p>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  Nothing on the Site constitutes an offer or agreement to
                  provide charging services at any specific location, price, or
                  time. Payment transactions are conducted at the physical
                  charging terminal and are not processed through the Site.
                </span>
              </p>
              <p>
                <br />
              </p>
              <p style={{ borderBottom: "solid #cccccc 0.5pt" }}>
                <br />
              </p>
              <h2>
                <strong>
                  <span
                    style={{
                      color: "#1a1a1a",
                      fontSize: "13pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    8. Disclaimer of Warranties
                  </span>
                </strong>
              </h2>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  THE SITE AND ALL CONTENT AND INFORMATION PROVIDED ON IT ARE
                  OFFERED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT
                  WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
                  LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
                  PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
                </span>
              </p>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  We do not warrant that:
                </span>
              </p>
              <ul>
                <li
                  style={{
                    listStyleType: "disc",
                    fontSize: "11pt",
                    fontFamily: "Arial,sans-serif",
                  }}
                >
                  <p role="presentation">
                    <span
                      style={{
                        fontSize: "11pt",
                        fontFamily: "Arial,sans-serif",
                      }}
                    >
                      The Site will be uninterrupted, error-free, or free of
                      viruses or other harmful components;
                    </span>
                  </p>
                </li>
                <li
                  style={{
                    listStyleType: "disc",
                    fontSize: "11pt",
                    fontFamily: "Arial,sans-serif",
                  }}
                >
                  <p role="presentation">
                    <span
                      style={{
                        fontSize: "11pt",
                        fontFamily: "Arial,sans-serif",
                      }}
                    >
                      The information on the Site is complete, accurate, or
                      current; or
                    </span>
                  </p>
                </li>
                <li
                  style={{
                    listStyleType: "disc",
                    fontSize: "11pt",
                    fontFamily: "Arial,sans-serif",
                  }}
                >
                  <p role="presentation">
                    <span
                      style={{
                        fontSize: "11pt",
                        fontFamily: "Arial,sans-serif",
                      }}
                    >
                      Any particular charging station will be available,
                      operational, or accessible at any given time.
                    </span>
                  </p>
                </li>
              </ul>
              <p>
                <br />
              </p>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  Charging station availability, performance, access, and
                  pricing may vary by location and are subject to change without
                  notice.
                </span>
              </p>
              <p>
                <br />
              </p>
              <p style={{ borderBottom: "solid #cccccc 0.5pt" }}>
                <br />
              </p>
              <h2>
                <strong>
                  <span
                    style={{
                      color: "#1a1a1a",
                      fontSize: "13pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    9. Limitation of Liability
                  </span>
                </strong>
              </h2>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, WATTUP USA
                  LLC AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, PARTNERS,
                  AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT,
                  INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR
                  ANY LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR OTHER
                  INTANGIBLE LOSSES ARISING OUT OF OR RELATED TO YOUR USE OF OR
                  INABILITY TO USE THE SITE, EVEN IF ADVISED OF THE POSSIBILITY
                  OF SUCH DAMAGES.
                </span>
              </p>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  IN NO EVENT SHALL WATTUP'S TOTAL LIABILITY TO YOU FOR ALL
                  CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR YOUR USE OF
                  THE SITE EXCEED ONE HUNDRED U.S. DOLLARS ($100.00).
                </span>
              </p>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  Some jurisdictions do not allow the exclusion of certain
                  warranties or the limitation of liability for certain types of
                  damages. In such jurisdictions, our liability is limited to
                  the greatest extent permitted by law.
                </span>
              </p>
              <p>
                <br />
              </p>
              <p style={{ borderBottom: "solid #cccccc 0.5pt" }}>
                <br />
              </p>
              <h2>
                <strong>
                  <span
                    style={{
                      color: "#1a1a1a",
                      fontSize: "13pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    10. Indemnification
                  </span>
                </strong>
              </h2>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  You agree to indemnify, defend, and hold harmless WattUp USA
                  LLC and its officers, directors, employees, agents, and
                  licensors from and against any claims, liabilities, damages,
                  losses, costs, and expenses (including reasonable attorneys'
                  fees) arising out of or related to: (a) your use of the Site
                  in violation of these Terms; (b) any information you submit
                  through the Site; or (c) your violation of any applicable law
                  or third-party right.
                </span>
              </p>
              <p>
                <br />
              </p>
              <p style={{ borderBottom: "solid #cccccc 0.5pt" }}>
                <br />
              </p>
              <h2>
                <strong>
                  <span
                    style={{
                      color: "#1a1a1a",
                      fontSize: "13pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    11. External Links
                  </span>
                </strong>
              </h2>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  The Site may contain links to third-party websites, including
                  social media platforms, partner organizations, and other
                  external resources. These links are provided for convenience
                  only. WattUp does not endorse, control, or assume
                  responsibility for the content, privacy practices, or accuracy
                  of any third-party websites. Accessing third-party websites is
                  at your own risk.
                </span>
              </p>
              <p>
                <br />
              </p>
              <p style={{ borderBottom: "solid #cccccc 0.5pt" }}>
                <br />
              </p>
              <h2>
                <strong>
                  <span
                    style={{
                      color: "#1a1a1a",
                      fontSize: "13pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    12. Governing Law and Dispute Resolution
                  </span>
                </strong>
              </h2>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  These Terms of Use shall be governed by and construed in
                  accordance with the laws of the State of California, without
                  regard to its conflict of law principles.
                </span>
              </p>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  Any dispute, claim, or controversy arising out of or relating
                  to these Terms or your use of the Site shall be subject to the
                  exclusive jurisdiction of the state and federal courts located
                  in Los Angeles County, California. You consent to personal
                  jurisdiction in those courts.
                </span>
              </p>
              <p>
                <br />
              </p>
              <p style={{ borderBottom: "solid #cccccc 0.5pt" }}>
                <br />
              </p>
              <h2>
                <strong>
                  <span
                    style={{
                      color: "#1a1a1a",
                      fontSize: "13pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    13. Changes to These Terms
                  </span>
                </strong>
              </h2>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  We reserve the right to modify these Terms of Use at any time.
                  When we make material changes, we will update the Effective
                  Date at the top of this document and post the revised Terms on
                  the Site. Your continued use of the Site after any changes
                  constitutes your acceptance of the updated Terms. We encourage
                  you to review these Terms periodically.
                </span>
              </p>
              <p>
                <br />
              </p>
              <p style={{ borderBottom: "solid #cccccc 0.5pt" }}>
                <br />
              </p>
              <h2>
                <strong>
                  <span
                    style={{
                      color: "#1a1a1a",
                      fontSize: "13pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    14. Severability
                  </span>
                </strong>
              </h2>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  If any provision of these Terms is found to be invalid,
                  illegal, or unenforceable under applicable law, that provision
                  shall be deemed modified to the minimum extent necessary to
                  make it enforceable, or severed if modification is not
                  possible. The remaining provisions of these Terms shall
                  continue in full force and effect.
                </span>
              </p>
              <p>
                <br />
              </p>
              <p style={{ borderBottom: "solid #cccccc 0.5pt" }}>
                <br />
              </p>
              <h2>
                <strong>
                  <span
                    style={{
                      color: "#1a1a1a",
                      fontSize: "13pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    15. Entire Agreement
                  </span>
                </strong>
              </h2>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  These Terms of Use, together with our Privacy Policy,
                  constitute the entire agreement between you and WattUp USA LLC
                  with respect to your use of the Site and supersede all prior
                  or contemporaneous agreements, communications, and
                  understandings relating to that subject matter.
                </span>
              </p>
              <p>
                <br />
              </p>
              <p style={{ borderBottom: "solid #cccccc 0.5pt" }}>
                <br />
              </p>
              <h2>
                <strong>
                  <span
                    style={{
                      color: "#1a1a1a",
                      fontSize: "13pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    16. Contact Us
                  </span>
                </strong>
              </h2>
              <p>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  If you have any questions about these Terms of Use, please
                  contact us:
                </span>
              </p>
              <p>
                <br />
              </p>
              <p>
                <strong>
                  <span
                    style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                  >
                    Company:&nbsp;
                  </span>
                </strong>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  WattUp USA LLC
                </span>
              </p>
              <p>
                <strong>
                  <span
                    style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                  >
                    Address:&nbsp;
                  </span>
                </strong>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  2355 Westwood Blvd. #1017, Los Angeles, CA 90064
                </span>
              </p>
              <p>
                <strong>
                  <span
                    style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                  >
                    Email:&nbsp;
                  </span>
                </strong>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  support@wattupusa.com
                </span>
              </p>
              <p>
                <strong>
                  <span
                    style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                  >
                    Website:&nbsp;
                  </span>
                </strong>
                <span
                  style={{ fontSize: "11pt", fontFamily: "Arial,sans-serif" }}
                >
                  wattupusa.com
                </span>
              </p>
            </>
          </div>
        </section>
      </Suspense>
    </main>
  );
}
