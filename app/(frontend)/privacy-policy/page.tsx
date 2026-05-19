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
          heading="Privacy and legal"
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
                    Privacy Policy
                  </span>
                </strong>
              </h1>
              <p>
                <strong>
                  <span style={{ fontSize: "11pt" }}>
                    Effective Date:&nbsp;
                  </span>
                </strong>
                <span style={{ fontSize: "11pt" }}>May 18, 2026</span>
              </p>
              <p>
                <strong>
                  <span style={{ fontSize: "11pt" }}>Company:&nbsp;</span>
                </strong>
                <span style={{ fontSize: "11pt" }}>WattUp USA LLC</span>
              </p>
              <p>
                <strong>
                  <span style={{ fontSize: "11pt" }}>Address:&nbsp;</span>
                </strong>
                <span style={{ fontSize: "11pt" }}>
                  2355 Westwood Blvd. #1017, Los Angeles, CA 90064
                </span>
              </p>
              <p>
                <strong>
                  <span style={{ fontSize: "11pt" }}>Contact:&nbsp;</span>
                </strong>
                <span style={{ fontSize: "11pt" }}>support@wattupusa.com</span>
              </p>
              <p style={{ borderBottom: "solid #cccccc 0.5pt" }}>
                <br />
              </p>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  WattUp USA LLC ("WattUp," "we," "our," or "us") operates the
                  website at wattupusa.com (the "Site"). This Privacy Policy
                  explains what personal information we collect, how we use it,
                  who we share it with, and your rights regarding that
                  information. By using the Site, you agree to the practices
                  described in this policy.
                </span>
              </p>
              <p>
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
                    1. Information We Collect
                  </span>
                </strong>
              </h2>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  We collect personal information only when you voluntarily
                  provide it through the contact forms on our Site. We do not
                  require you to create an account or log in to use the Site.
                </span>
              </p>
              <p>
                <br />
              </p>
              <h3>
                <strong>
                  <span
                    style={{
                      color: "#333333",
                      fontSize: "11pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    1.1 Driver Support Form
                  </span>
                </strong>
              </h3>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  When you submit a Driver Support inquiry, we collect:
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
                      Name
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
                      Email address
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
                      Your message
                    </span>
                  </p>
                </li>
              </ul>
              <p>
                <br />
              </p>
              <h3>
                <strong>
                  <span
                    style={{
                      color: "#333333",
                      fontSize: "11pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    1.2 Host Partnership Form
                  </span>
                </strong>
              </h3>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  When you submit a Host Partnership inquiry, we collect:
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
                      Company name
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
                      Location
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
                      Number of parking spaces
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
                      Contact information you provide
                    </span>
                  </p>
                </li>
              </ul>
              <p>
                <br />
              </p>
              <h3>
                <strong>
                  <span
                    style={{
                      color: "#333333",
                      fontSize: "11pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    1.3 Automatically Collected Information
                  </span>
                </strong>
              </h3>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  When you visit the Site, certain information is collected
                  automatically through cookies and analytics tools, including:
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
                      Browser type and version
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
                      Device type and operating system
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
                      Pages viewed and time spent on the Site
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
                      Referring URLs
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
                      Approximate geographic location (city/region level,
                      derived from IP address)
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
                      IP address
                    </span>
                  </p>
                </li>
              </ul>
              <p>
                <br />
              </p>
              <h3>
                <strong>
                  <span
                    style={{
                      color: "#333333",
                      fontSize: "11pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    1.4 No Financial Data
                  </span>
                </strong>
              </h3>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  We do not collect payment card numbers, bank information, or
                  any financial data through the Site. All payment transactions
                  occur at physical WattUp charging stations and are handled by
                  the payment processors at those terminals.
                </span>
              </p>
              <p>
                <br />
              </p>
              <h3>
                <strong>
                  <span
                    style={{
                      color: "#333333",
                      fontSize: "11pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    1.5 Children's Privacy
                  </span>
                </strong>
              </h3>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  The Site is not directed to individuals under the age of 13.
                  We do not knowingly collect personal information from
                  children. If we become aware that we have inadvertently
                  received personal information from a child under 13, we will
                  delete it promptly. If you believe we may have such
                  information, please contact us at support@wattupusa.com.
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
                    2. How We Use Your Information
                  </span>
                </strong>
              </h2>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  We use the information we collect for the following purposes:
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
                      To respond to your support requests or partnership
                      inquiries
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
                      To communicate with you about our services and network
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
                      To analyze Site usage and improve our website and user
                      experience
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
                      To measure the effectiveness of our advertising and
                      marketing efforts
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
                      To comply with applicable laws and regulations
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
                      To protect the security and integrity of our Site
                    </span>
                  </p>
                </li>
              </ul>
              <p>
                <br />
              </p>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  The legal basis for processing your personal information is
                  your consent (given via the checkbox on our contact forms) and
                  our legitimate interest in operating and improving our
                  services.
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
                    3. Cookies and Tracking Technologies
                  </span>
                </strong>
              </h2>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  We use cookies and similar tracking technologies to collect
                  information about how you interact with our Site. Cookies are
                  small text files placed on your device. We use the following
                  types:
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
                      Essential cookies: Required for the Site to function
                      properly.
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
                      Analytics cookies: Used to understand how visitors use the
                      Site (see Section 4 for details).
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
                      Advertising/marketing cookies: Used to measure ad
                      performance and deliver relevant advertising (see Section
                      4 for details).
                    </span>
                  </p>
                </li>
              </ul>
              <p>
                <br />
              </p>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  You can control or disable cookies through your browser
                  settings. Please note that disabling certain cookies may
                  affect the functionality of the Site. You may also opt out of
                  interest-based advertising by visiting the Digital Advertising
                  Alliance opt-out page at optout.aboutads.info or the Network
                  Advertising Initiative at optout.networkadvertising.org.
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
                    4. Third-Party Services and Data Processors
                  </span>
                </strong>
              </h2>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  We use the following third-party tools that may collect or
                  process data about your use of the Site. Each has its own
                  privacy policy governing how it handles your information.
                </span>
              </p>
              <p>
                <br />
              </p>
              <h3>
                <strong>
                  <span
                    style={{
                      color: "#333333",
                      fontSize: "11pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    4.1 Google Analytics and Google Tag Manager
                  </span>
                </strong>
              </h3>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  We use Google Analytics and Google Tag Manager (provided by
                  Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA
                  94043) to collect and analyze information about Site usage.
                  Google Analytics uses cookies to track user interactions and
                  generates statistical reports about Site traffic. Google Tag
                  Manager is used to manage and deploy tracking scripts on the
                  Site.
                </span>
              </p>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  Google may use the data collected to contextualize and
                  personalize its own advertising network. You can opt out of
                  Google Analytics tracking by installing the Google Analytics
                  Opt-Out Browser Add-On, available at
                  tools.google.com/dlpage/gaoptout. Google's privacy policy is
                  available at policies.google.com/privacy.
                </span>
              </p>
              <p>
                <br />
              </p>
              <h3>
                <strong>
                  <span
                    style={{
                      color: "#333333",
                      fontSize: "11pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    4.2 Meta Pixel
                  </span>
                </strong>
              </h3>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  We use the Meta Pixel (provided by Meta Platforms, Inc., 1
                  Hacker Way, Menlo Park, CA 94025) to measure the effectiveness
                  of our advertising on Meta's platforms (including Facebook and
                  Instagram). The Meta Pixel collects data about your
                  interactions with our Site and may associate that data with
                  your Meta account to enable ad targeting and measurement.
                </span>
              </p>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  You can manage your ad preferences through your Meta account
                  settings or by visiting Meta's Ad Preferences page. Meta's
                  data policy is available at facebook.com/privacy/policy.
                </span>
              </p>
              <p>
                <br />
              </p>
              <h3>
                <strong>
                  <span
                    style={{
                      color: "#333333",
                      fontSize: "11pt",
                      fontFamily: "Arial,sans-serif",
                    }}
                  >
                    4.3 Email Service Provider (Future)
                  </span>
                </strong>
              </h3>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  We may in the future use a third-party email service provider
                  to manage communications with individuals who have contacted
                  us through the Site. If and when such a provider is engaged,
                  we will update this Privacy Policy to identify the provider
                  and describe how it processes your information. Email service
                  providers are bound by confidentiality obligations and are
                  only authorized to use your information to deliver
                  communications on our behalf.
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
                    5. How We Share Your Information
                  </span>
                </strong>
              </h2>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  We do not sell your personal information. We may share your
                  information in the following limited circumstances:
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
                      Service providers: We may share information with trusted
                      third-party vendors who assist us in operating our Site,
                      managing communications, or analyzing Site performance.
                      These providers are authorized to use your data only as
                      necessary to provide services to us.
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
                      Legal compliance: We may disclose information when
                      required by law, court order, or other legal process, or
                      when we believe disclosure is necessary to protect the
                      rights, property, or safety of WattUp USA, our users, or
                      the public.
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
                      Business transfers: In the event of a merger, acquisition,
                      or sale of all or a portion of our assets, personal
                      information may be transferred as part of that
                      transaction. We will notify you via a notice on the Site
                      of any material change in ownership or use of your
                      personal information.
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
                    6. Data Retention
                  </span>
                </strong>
              </h2>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  We retain your personal information for as long as necessary
                  to fulfill the purposes described in this Privacy Policy, to
                  respond to your inquiries, and to comply with our legal
                  obligations. When personal information is no longer needed, we
                  will securely delete or anonymize it.
                </span>
              </p>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  If you would like us to delete your information sooner, please
                  contact us at support@wattupusa.com.
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
                    7. Your Rights and Choices
                  </span>
                </strong>
              </h2>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  You have the following rights regarding your personal
                  information:
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
                      Access: You may request a copy of the personal information
                      we hold about you.
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
                      Correction: You may request that we correct inaccurate or
                      incomplete information.
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
                      Deletion: You may request that we delete your personal
                      information, subject to any legal obligations to retain
                      it.
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
                      Opt-out of communications: If we send you email
                      communications, you may opt out at any time by following
                      the unsubscribe instructions in those emails or by
                      contacting us directly.
                    </span>
                  </p>
                </li>
              </ul>
              <p>
                <br />
              </p>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  To exercise any of these rights, please contact us at
                  support@wattupusa.com. We will respond to your request within
                  a reasonable timeframe.
                </span>
              </p>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  California residents may have additional rights under the
                  California Consumer Privacy Act (CCPA), including the right to
                  know what personal information is collected and the right to
                  opt out of the sale of personal information. We do not sell
                  personal information. For CCPA inquiries, contact us at
                  support@wattupusa.com.
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
                    8. Third-Party Links
                  </span>
                </strong>
              </h2>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  The Site may contain links to third-party websites, including
                  social media platforms and partner pages. We are not
                  responsible for the privacy practices or content of those
                  websites. We encourage you to review the privacy policies of
                  any third-party sites you visit.
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
                    9. Data Security
                  </span>
                </strong>
              </h2>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  We implement reasonable technical and organizational measures
                  to protect your personal information against unauthorized
                  access, loss, or misuse. However, no method of transmission
                  over the internet or electronic storage is completely secure.
                  We cannot guarantee absolute security of your data.
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
                    10. Changes to This Privacy Policy
                  </span>
                </strong>
              </h2>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  We may update this Privacy Policy from time to time. When we
                  make material changes, we will post the updated policy on this
                  page with a revised Effective Date. We encourage you to review
                  this policy periodically. Your continued use of the Site after
                  any changes constitutes your acceptance of the updated policy.
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
                    11. Contact Us
                  </span>
                </strong>
              </h2>
              <p>
                <span style={{ fontSize: "11pt" }}>
                  If you have any questions, concerns, or requests regarding
                  this Privacy Policy or our data practices, please contact us:
                </span>
              </p>
              <p>
                <br />
              </p>
              <p>
                <strong>
                  <span style={{ fontSize: "11pt" }}>Company:&nbsp;</span>
                </strong>
                <span style={{ fontSize: "11pt" }}>WattUp USA LLC</span>
              </p>
              <p>
                <strong>
                  <span style={{ fontSize: "11pt" }}>Address:&nbsp;</span>
                </strong>
                <span style={{ fontSize: "11pt" }}>
                  2355 Westwood Blvd. #1017, Los Angeles, CA 90064
                </span>
              </p>
              <p>
                <strong>
                  <span style={{ fontSize: "11pt" }}>Email:&nbsp;</span>
                </strong>
                <span style={{ fontSize: "11pt" }}>support@wattupusa.com</span>
              </p>
              <p>
                <strong>
                  <span style={{ fontSize: "11pt" }}>Website:&nbsp;</span>
                </strong>
                <span style={{ fontSize: "11pt" }}>wattupusa.com</span>
              </p>
              <p>
                <br />
              </p>
              <p>
                <br />
              </p>
            </>
          </div>
        </section>
      </Suspense>
    </main>
  );
}
