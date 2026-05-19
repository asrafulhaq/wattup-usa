import { driversImageUrls } from "@/lib/images/drivers";
import { homeImageUrls } from "@/lib/images/home";
import { hostsImageUrls } from "@/lib/images/hosts";
import { policyImageUrls } from "@/lib/images/policy";
import { pressReleaseImageUrls } from "@/lib/images/press-release";
import { sharedImageUrls } from "@/lib/images/shared";
import { aboutImageUrls } from "./lib/images/about";
import { capitalPartnersImageUrls } from "./lib/images/capital-partners";
import { fleetSolutionImageUrls } from "./lib/images/fleet-solution";

export interface SlidesCardData {
  id: string;
  image: string;
  mobileImage?: string;
  title: React.ReactNode;
  description: React.ReactNode;
  cta: { label: string; href: string };
  imageClass?: string;
}

export interface LocationData {
  image: string;
  mobileImage?: string;
  title: string;
  description?: React.ReactNode;
}

export interface TechnologySlideData {
  number: string;
  title: string;
  description: string;
  image: string;
  mobileImage?: string;
  textPosition: "left" | "right";
  className?: string; // Allow custom styling per slide
  textStyle?: React.CSSProperties; // Allow exact absolute positioning
  gradientClass?: string;
  gradientStyle?: React.CSSProperties; // Detailed background styling
  mobileGradientStyle?: React.CSSProperties;
  imageClassName?: string; // Custom image object-position per slide
}
export interface HowItWorksStepData {
  title: React.ReactNode;
  description?: React.ReactNode;
  image: string;
  mobileImage?: string;
  imageClass?: string;
}
export interface FAQ {
  question: string;
  answer: string;
}
export interface PressReleaseArchiveData {
  id: string;
  image: string;
  secondImage?: string;
  mobileImage?: string;
  date: string;
  title: string;
  slug: string;
  description: string;
  imageClass?: string;
  readTime?: string;
}

export interface Cities {
  name: string;
  capacity: string;
  stationName: string;
  status: string;
}
export interface TextGridData {
  id: string | number;
  title: React.ReactNode;
  description?: React.ReactNode;
}
export const HomePageBuiltForSlidesCardData: SlidesCardData[] = [
  {
    id: "drivers",
    image: sharedImageUrls.car1,
    title: "For Drivers",
    description:
      "Find nearby charging stations, plug in, and get back on the road faster.",
    cta: {
      label: "Find Charging Locations",
      href: "/locations#locations",
    },
    imageClass: "max-md:object-[54%_top]",
  },
  {
    id: "hosts",
    image: sharedImageUrls.car2,
    title: "For Hosts",
    description:
      "Install EV charging and attract high-value customers, tenants, and visitors.",
    cta: { label: "Become a Host", href: "/contact#contact-us" },
    imageClass: "max-md:object-[14%_top]",
  },
];

export const HomePageMobilityData: TextGridData[] = [
  {
    id: 1,
    title: (
      <>
        Fast <br className="hidden md:block" /> Charging
      </>
    ),
  },
  {
    id: 2,
    title: (
      <>
        Premium <br className="hidden md:block" /> Locations
      </>
    ),
  },
  {
    id: 3,
    title: (
      <>
        Smart <br className="hidden md:block" /> Infrastructure
      </>
    ),
  },
  {
    id: 4,
    title: (
      <>
        Reliable <br className="hidden md:block" /> Network
      </>
    ),
  },
];
export const HomePageHowItWorksStepData: HowItWorksStepData[] = [
  {
    title: "Find a Station",
    description:
      "Locate a WattUp charging station near you using our network map.",
    image: sharedImageUrls.howItWorks1,
  },
  {
    title: "Plug In",
    description:
      "Connect your EV and start charging instantly. Wait until the car charges.",
    image: sharedImageUrls.howItWorks2,
  },
  {
    title: "Charge & Go",
    description:
      "Fast, reliable charging so you can get back on the road quickly.",
    image: sharedImageUrls.howItWorks3,
  },
];

export const HomePagetechnologySlidesData: TechnologySlideData[] = [
  {
    number: "01.",
    title: "Smart charging\ninfrastructure",
    description: "Lorem ipsum dolor sit amet\nconsectetur",
    image: homeImageUrls.technologyBacked1,
    mobileImage: homeImageUrls.technologyBacked1Mobile,
    textPosition: "left",
    textStyle: {
      left: "252px",
      top: "155px",
      maxWidth: "449px",
    },
    gradientStyle: {
      left: 0,
      top: 0,
      width: "844px",
      height: "100%",
      background:
        "linear-gradient(270deg, rgba(0, 0, 0, 0.00) 0%, rgba(0, 0, 0, 0.85) 100%)",
      mixBlendMode: "multiply",
    },
    mobileGradientStyle: {
      left: 0,
      top: 0,
      width: "100%",
      height: "427px",
      background:
        "linear-gradient(270deg, rgba(0, 0, 0, 0.00) 77.67%, rgba(0, 0, 0, 0.85) 89.56%, #000 100%)",
      mixBlendMode: "multiply",
    },
  },
  {
    number: "02.",
    title: "High-performance\nhardware",
    description: "Lorem ipsum dolor sit amet\nconsectetur",
    image: homeImageUrls.technologyBacked2,
    mobileImage: homeImageUrls.technologyBacked2Mobile,
    textPosition: "right",
    imageClassName: "object-contain object-left",
    textStyle: {
      left: "920px",
      top: "250px",
      maxWidth: "497px",
    },
  },
  {
    number: "03.",
    title: "Seamless payment\nintegration",
    description: "Lorem ipsum dolor sit amet\nconsectetur",
    image: homeImageUrls.technologyBacked3,
    mobileImage: homeImageUrls.technologyBacked3Mobile,
    textPosition: "left",
    textStyle: {
      left: "80px",
      top: "304px",
      maxWidth: "449px",
    },
    gradientStyle: {
      left: 0,
      top: 0,
      width: "699px",
      height: "100%",
      background:
        "linear-gradient(270deg, rgba(0, 0, 0, 0.00) 0%, rgba(0, 0, 0, 0.9486) 100%)",
      mixBlendMode: "multiply",
    },
    mobileGradientStyle: {
      left: 0,
      top: 0,
      width: "300px",
      height: "337px",
      background:
        "linear-gradient(270deg, rgba(0, 0, 0, 0.00) 0%, #000 94.86%)",
      mixBlendMode: "multiply",
    },
  },
];

export const HomePageWhyChooseSlideCardData: SlidesCardData[] = [
  {
    id: "fast-charging",
    image: homeImageUrls.whyImage1,
    title: "Fast Charging",
    description:
      "High-performance charging stations designed for speed and reliability.",
    cta: {
      label: "Find Charging Locations",
      href: "/locations#locations",
    },
    imageClass: "max-md:object-[70%_top]",
  },
  {
    id: "premium-locations",
    image: homeImageUrls.whyImage2,
    title: "Premium Locations",
    description:
      "Charge where you already spend your time — shopping centers, hotels, and workplaces.",
    cta: {
      label: "Find Charging Locations",
      href: "/locations#locations",
    },
    imageClass: "max-md:object-[70%_top]",
  },
  {
    id: "symless-experience",
    image: homeImageUrls.whyImage3,
    title: "Seamless Experience",
    description: "Simple access, easy payments, and reliable performance.",
    cta: {
      label: "Find Charging Locations",
      href: "/locations#locations",
    },
    imageClass: "max-md:object-[90%_top]",
  },
  {
    id: "smart-infrastructure",
    image: homeImageUrls.whyImage4,
    title: "Smart Infrastructure",
    description:
      "Built with advanced technology and monitored for maximum uptime.",
    cta: {
      label: "Find Charging Locations",
      href: "/locations#locations",
    },
    imageClass: "max-md:object-[35%_top]",
  },
];

export const DriverPageHowItWorksStepData: HowItWorksStepData[] = [
  {
    title: "Find a Station",
    description:
      "Locate a WattUp charging station near you using our network map.",
    image: sharedImageUrls.howItWorks1,
  },
  {
    title: "Plug In",
    description:
      "Connect your EV and start charging instantly. Wait until the car charges",
    image: sharedImageUrls.howItWorks2,
  },
  {
    title: "Charge & Go",
    description:
      "Fast, reliable charging so you can get back on the road quickly.",
    image: sharedImageUrls.howItWorks5,
  },
];
export const DriverPageWhyChooseSlideCardData: SlidesCardData[] = [
  {
    id: "fast-charging",
    image: driversImageUrls.driverWhyChoose1,
    mobileImage: driversImageUrls.driverWhyChooseMobile1,
    title: "Fast Charging",
    description: "Reliable high-performance stations.",
    cta: {
      label: "Find Charging Locations",
      href: "/locations#locations",
    },
    imageClass: "max-md:object-[40%_top]",
  },
  {
    id: "premium-locations",
    image: driversImageUrls.driverWhyChoose2,
    title: "Convenient Locations",
    description: (
      <>
        Charge where you <br className="md:hidden" /> already go.
      </>
    ),
    cta: {
      label: "Find Charging Locations",
      href: "/locations#locations",
    },
    imageClass: "max-md:object-[25%_top]",
  },
  {
    id: "symless-experience",
    image: driversImageUrls.driverWhyChoose3,
    title: "Reliable Network",
    description: "Stations monitored for consistent performance.",
    cta: {
      label: "Find Charging Locations",
      href: "/locations#locations",
    },
    imageClass: "max-md:object-[14%_top]",
  },
  {
    id: "smart-infrastructure",
    image: driversImageUrls.driverWhyChoose4,
    mobileImage: driversImageUrls.driverWhyChooseMobile4,
    title: "Simple Experience",
    description: "Easy access and seamless payments.",
    cta: {
      label: "Find Charging Locations",
      href: "/locations#locations",
    },
    imageClass: "max-md:object-[60%_top]",
  },
];
export const AboutPageCorePrinciplesData: HowItWorksStepData[] = [
  {
    title: "Mission",
    description:
      "Our mission is to make EV charging accessible and reliable everywhere.",
    image: aboutImageUrls.mission,
  },
  {
    title: "Vision",
    description:
      "We believe the future of mobility depends on scalable charging infrastructure.",
    image: aboutImageUrls.vision,
  },
  {
    title: "Future",
    description:
      "EV adoption is growing rapidly, and charging networks will play a critical role.",
    image: aboutImageUrls.future,
  },
  {
    title: "Sustainability",
    description:
      "Supporting the transition to clean transportation and sustainable infrastructure.",
    image: aboutImageUrls.sustainability,
  },
];
export const marqueeCities: Cities[] = [
  {
    name: "Los Angeles",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "Mixed Use",
    status: "Active Market Expansion",
  },
  {
    name: "San Diego",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "High Traffic Retail",
    status: "Active Market Expansion",
  },
  {
    name: "Austin",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "Station name",
    status: "Active Market Expansion",
  },
  {
    name: "Miami",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "Station name",
    status: "Active Market Expansion",
  },
  {
    name: "Phoenix",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "Station name",
    status: "Active Market Expansion",
  },
];
export const cities: Cities[] = [
  {
    name: "Lake Forest",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "Shopping Plaza",
    status: "Active Market Expansion",
  },
  {
    name: "Redlands",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "Retail Destination",
    status: "Active Market Expansion",
  },
  {
    name: "Riverside",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "Commercial Hub",
    status: "Active Market Expansion",
  },
  {
    name: "Huntington Beach",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "High-Traffic Retail",
    status: "Active Market Expansion",
  },
  {
    name: "Cerritos",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "Lifestyle & Retail Destination",
    status: "Active Market Expansion",
  },
  {
    name: "Ontario",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "Shopping Plaza",
    status: "Active Market Expansion",
  },
  {
    name: "Fontana",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "Commercial Location",
    status: "Active Market Expansion",
  },
  {
    name: "Loma Linda",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "Retail Destination",
    status: "Active Market Expansion",
  },
  {
    name: "Gardena",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "High-Traffic Retail",
    status: "Active Market Expansion",
  },
  {
    name: "Ojai",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "Shopping & Dining Destination",
    status: "Active Market Expansion",
  },
  {
    name: "Hesperia",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "Commercial Hub",
    status: "Active Market Expansion",
  },
  {
    name: "Buena Park",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "Shopping Plaza",
    status: "Active Market Expansion",
  },
  {
    name: "Los Alamitos",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "Retail Complex",
    status: "Active Market Expansion",
  },
  {
    name: "San Diego",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "High-Traffic Retail",
    status: "Active Market Expansion",
  },
  {
    name: "Los Angeles",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "Urban Retail & Lifestyle Destination",
    status: "Active Market Expansion",
  },
  {
    name: "Irvine",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "Shopping Plaza",
    status: "Active Market Expansion",
  },
  {
    name: "Oceanside",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "Commercial Hub",
    status: "Active Market Expansion",
  },
  {
    name: "San Bernardino",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "Retail Destination",
    status: "Active Market Expansion",
  },
  {
    name: "Santa Ana",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "High-Traffic Retail",
    status: "Active Market Expansion",
  },
  {
    name: "Anaheim",
    capacity: "300kW+ Ultra Fast Charging",
    stationName: "Lifestyle & Retail Destination",
    status: "Active Market Expansion",
  },
];
export const HostPageWhyChooseSlideCardData: SlidesCardData[] = [
  {
    id: "increase-property-value",
    image: hostsImageUrls.whyChoose1,
    title: (
      <>
        Increase Property <br className="md:hidden" /> Value
      </>
    ),
    description: " Enhance your property's long-term appeal.",
    cta: { label: "Request Partnership", href: "/contact#contact-us" },
  },
  {
    id: "attract-visitors",
    image: hostsImageUrls.whyChoose2,
    title: (
      <>
        Attract <br className="md:hidden" />
        Visitors
      </>
    ),
    description: " EV drivers actively look for charging locations.",
    cta: { label: "Request Partnership", href: "/contact#contact-us" },
    imageClass: "max-md:object-[70%_top]",
  },
  {
    id: "support-sustainability",
    image: hostsImageUrls.whyChoose3,
    title: (
      <>
        Support <br className="md:hidden" />
        Sustainability
      </>
    ),
    description: " Show commitment to clean mobility.",
    cta: { label: "Request Partnership", href: "/contact#contact-us" },
    imageClass: "max-md:object-[70%_top]",
  },
  {
    id: "generate-revenue",
    image: hostsImageUrls.whyChoose4,
    mobileImage: hostsImageUrls.whyChooseMobile4,
    title: (
      <>
        Generate <br className="md:hidden" />
        Revenue
      </>
    ),
    description: " Turn parking spaces into a new income stream.",
    cta: { label: "Request Partnership", href: "/contact#contact-us" },
  },
];

export const HostPageHowItWorksStepsData: HowItWorksStepData[] = [
  {
    title: "Site Assessment",
    description: "We evaluate your location.",
    image: hostsImageUrls.hostsHowItWorks1,
  },
  {
    title: "Installation",
    description: "Professional charger installation.",
    image: hostsImageUrls.hostsHowItWorks2,
    mobileImage: hostsImageUrls.hostsHowItWorksMobile2,
    imageClass: "max-md:object-[70%_top]",
  },
  {
    title: "Integration",
    description: "Stations connected to the  WattUp network.",
    image: hostsImageUrls.hostsHowItWorks3,
    mobileImage: hostsImageUrls.hostsHowItWorksMobile3,
  },
  {
    title: "Ongoing Support",
    description: "Continuous monitoring and support.",
    image: hostsImageUrls.hostsHowItWorks4,
    mobileImage: hostsImageUrls.hostsHowItWorksMobile4,
  },
];

export const HostPageBenifitsCardsData: SlidesCardData[] = [
  {
    id: "charging-revenue",
    image: hostsImageUrls.hostPageBenifitImage1,
    mobileImage: hostsImageUrls.hostPageBenifitImageMobile1,
    title: (
      <>
        Charging <br className="md:hidden" /> Revenue
      </>
    ),
    description: (
      <>
        Drivers pay to charge their <br className="md:hidden" /> vehicles at
        your location.
      </>
    ),
    cta: { label: "Request Partnership", href: "/contact#contact-us" },
  },
  {
    id: "longer-customer-visit",
    image: hostsImageUrls.hostPageBenifitImage2,
    title: (
      <>
        Longer
        <br className="md:hidden" /> Customer Visits
      </>
    ),
    description: (
      <>
        <span className="max-md:hidden">Charging takes time,</span> increasing
        time spent at your <br className="md:hidden" /> property.
      </>
    ),
    cta: { label: "Request Partnership", href: "/contact#contact-us" },
  },
  {
    id: "increased-foot-traffic",
    image: hostsImageUrls.hostPageBenifitImage3,
    title: (
      <>
        Increased Foot <br className="md:hidden" />
        Traffic
      </>
    ),
    description: (
      <>
        EV drivers choose locations <br className="md:hidden" /> where they can
        charge.
      </>
    ),
    cta: { label: "Request Partnership", href: "/contact#contact-us" },
    imageClass: "max-md:object-[60%_top]",
  },
  {
    id: "property-value-growth",
    image: hostsImageUrls.hostPageBenifitImage4,
    title: (
      <>
        Property Value <br className="md:hidden" /> Growth
      </>
    ),
    description: (
      <>
        EV infrastructure increases <br className="md:hidden" />
        long-term property value.
      </>
    ),
    cta: { label: "Request Partnership", href: "/contact#contact-us" },
  },
];

export const CarginglocationsForDrivers = [
  {
    title: "Retail Centers",
    image: sharedImageUrls.cardImage1,
    mobileImage: sharedImageUrls.cardImage1Mobile,
  },
  {
    title: "Hotels",
    image: sharedImageUrls.cardImage2,
  },
  {
    title: "Office Buildings",
    image: sharedImageUrls.cardImage4,
  },
  {
    title: "Residential Communities",
    image: sharedImageUrls.cardImage5,
  },
];

export const IdealLocationsForHosts = [
  {
    title: "Hotels",
    image: sharedImageUrls.cardImage2,
  },
  {
    title: "Retail Centers",
    image: sharedImageUrls.cardImage1,
    mobileImage: sharedImageUrls.cardImage1Mobile,
  },
  {
    title: "Office Buildings",
    image: sharedImageUrls.cardImage5,
  },
  {
    title: "Apartment Communities",
    image: sharedImageUrls.cardImage4,
  },
];

export const HostPageTechnologyFeaturesData = [
  {
    number: "01.",
    title: "Smart charging\ninfrastructure",
  },
  {
    number: "02.",
    title: "Secure payments",
  },
  {
    number: "03.",
    title: "High-performance\nhardware",
  },
];

export const PolicyOptionsData = [
  {
    title: "Intellectual Property",
    description:
      "All content on this website, including but not limited to text, graphics, logos, images, and design elements, is the property of WattUp USA",
    image: policyImageUrls.policy1,
  },
  {
    title: "Limitation of Liability",
    description:
      "We strive to ensure that all information on this website is accurate and up to date. However, we make no guarantees regarding completeness",
    image: policyImageUrls.policy2,
  },
  {
    title: "External Links",
    description:
      "This website may contain links to third-party websites. We are not responsible for the content, policies",
    image: policyImageUrls.policy3,
  },
];

export const PolicyLeagalsData = [
  {
    title: "",
    description:
      "Please read these Terms of Use carefully before using the WattUp USA website located at wattupusa.com (the 'Site'). These Terms govern your access to and use of the Site. By accessing or using the Site in any way, you agree to be bound by these Terms. If you do not agree, please do not use the Site.",
  },
  {
    title: "1. About the Site",
    description:
      "We use cookies and similar tracking technologies to enhance your browsing experience. You can control or disable cookies through your browser settings.",
  },
  {
    title: "Data Sharing",
    description:
      "We do not sell your personal data. We may share information with trusted third-party service providers only as necessary to operate the website or comply with legal obligations.",
  },
];

export const DriverFAQData: FAQ[] = [
  {
    question: "How do I start charging?",
    answer:
      "Starting a session is easy. Just park at an available WattUp station, plug the connector into your vehicle, and follow the on-screen prompts or open your WattUp app to initiate charging. Once authorized, the station will safely lock into place and begin charging automatically.",
  },
  {
    question: "Do I need an app?",
    answer:
      "All WattUp stations support direct contactless payments via major credit cards, RFID, and mobile wallets (Apple Pay/Google Pay).",
  },
  {
    question: "How long does charging take?",
    answer:
      "It depends on your vehicle's acceptance rate and current battery level, but WattUp ultra-fast DC charging stations deliver up to 310 kW of high-speed power. For most compatible EVs, this means you can charge from 10% to 80% capacity in as little as 15 to 30 minutes while you shop or dine.",
  },
  {
    question: "What vehicles are compatible?",
    answer:
      "WattUp stations feature universal compatibility. Our infrastructure supports all major EV connector types, including J1772 (Level 2), CCS, and NACS (Tesla standard), ensuring that virtually any electric vehicle on the road today can power up at our locations.",
  },
];

export const pressReleaseArchiveData: PressReleaseArchiveData[] = [
  {
    id: "1",
    image: pressReleaseImageUrls.pressRelease1,
    secondImage: pressReleaseImageUrls.pressRelease2,
    mobileImage: pressReleaseImageUrls.pressRelease1Mobile,
    date: "March 23, 2026",
    title: "Expansion of EV Charging Infrastructure in Urban Areas",
    slug: "expansion-of-ev-charging-infrastructure-in-urban-areas",
    description:
      "We have introduced a new range of fast-charging stations designed to significantly reduce charging time. Our company has partnered with a number of local businesses to install EV charging solutions at commercial properties.",
    imageClass: "",
    readTime: "5 min read",
  },
  {
    id: "2",
    image: pressReleaseImageUrls.pressRelease2,
    secondImage: pressReleaseImageUrls.pressRelease2,
    mobileImage: pressReleaseImageUrls.pressRelease2Mobile,
    date: "March 25, 2026",
    title: "Partnership with Local",
    slug: "partnership-with-local",
    description:
      "We have introduced a new range of fast-charging stations designed to significantly reduce charging time. Our company has partnered with a number of local businesses to install EV charging solutions at commercial properties.",
    imageClass: "",
    readTime: "5 min read",
  },

  {
    id: "4",
    image: pressReleaseImageUrls.pressRelease4,
    secondImage: pressReleaseImageUrls.pressRelease2,
    mobileImage: pressReleaseImageUrls.pressRelease4Mobile,
    date: "March 05, 2026",
    title: "Introduction of Fast-Charging Solutions",
    slug: "introduction-of-fast-charging-solutions",
    description:
      "We have introduced a new range of fast-charging stations designed to significantly reduce charging time. Our company has partnered with a number of local businesses to install EV charging solutions at commercial properties.",
    imageClass: "",
    readTime: "5 min read",
  },
  {
    id: "3",
    image: pressReleaseImageUrls.pressRelease6,
    secondImage: pressReleaseImageUrls.pressRelease2,
    mobileImage: pressReleaseImageUrls.pressRelease3Mobile,
    date: "February 9, 2026",
    title: "Commitment to Sustainability",
    slug: "commitment-to-sustainability",
    description:
      "We have introduced a new range of fast-charging stations designed to significantly reduce charging time. Our company has partnered with a number of local businesses to install EV charging solutions at commercial properties.",
    imageClass: "",
    readTime: "10 min read",
  },
  {
    id: "5",
    image: pressReleaseImageUrls.pressRelease5,
    secondImage: pressReleaseImageUrls.pressRelease2,
    mobileImage: pressReleaseImageUrls.pressRelease5Mobile,
    date: "April 23, 2026",
    title: "Launch of Smart Charging Management System",
    slug: "launch-of-smart-charging-management-system",
    description:
      "We have introduced a new range of fast-charging stations designed to significantly reduce charging time. Our company has partnered with a number of local businesses to install EV charging solutions at commercial properties.",
    imageClass: "",
    readTime: "5 min read",
  },
];

export interface ContactInfoItemData {
  title: string;
  description: string;
  linkText: string;
  linkHref: string;
  isExternal?: boolean;
  isBlueLink?: boolean;
  descriptionClass?: string;
}

export const ContactInfoData: ContactInfoItemData[] = [
  {
    title: "Driver Support",
    description: "Questions about charging, locations, or usage.",
    linkText: "support@wattupusa.com",
    linkHref: "mailto:support@wattupusa.com",
    descriptionClass: "max-w-[346px]",
  },
  {
    title: "Partnerships",
    description: "Interested in installing EV charging at your property.",
    linkText: "partners@wattupusa.com",
    linkHref: "mailto:partners@wattupusa.com",
    descriptionClass: "max-w-[323px]",
  },
  {
    title: "Legal Inquiries",
    description: "For legal and policy-related questions.",
    linkText: "View Legal Pages",
    linkHref: "/policy#legal",
    descriptionClass: "max-w-[293px]",
    isBlueLink: true,
  },
];

export interface GroupedFAQ {
  category: string;
  items: FAQ[];
}

export const GroupedFAQData: GroupedFAQ[] = [
  {
    category: "Driver Questions",
    items: [
      {
        question: "How do I start charging?",
        answer:
          "Park at an available WattUp station, plug your vehicle in, and follow the on-screen prompts or use the WattUp app to start charging. Once your session is authorized, charging begins automatically.",
      },
      {
        question: "Do I need an app?",
        answer:
          "No. You can charge directly using contactless payment methods, including major credit cards, Apple Pay, Google Pay, and RFID options. The WattUp app simply provides additional features like station locations, charging history, and live status updates.",
      },
      {
        question: "How long does charging take?",
        answer:
          "Charging speed depends on your vehicle, battery size, and current charge level. WattUp ultra-fast DC charging stations deliver up to 300+ kW, allowing many compatible EVs to charge from approximately 10% to 80% in as little as 15–30 minutes.",
      },
      {
        question: "How much does it cost to charge?",
        answer:
          "Pricing varies by location and local utility conditions. WattUp offers transparent pay-as-you-go pricing with no hidden monthly fees. Exact pricing will be displayed before you begin charging.",
      },
      {
        question: "Can I charge my EV in the rain or bad weather?",
        answer:
          "Absolutely. Our commercial hardware is industrial-grade and engineered for extreme durability in all weather environments. Both the stations and the connectors are heavily insulated and sealed against rain, snow, and dust, making it perfectly safe to charge in any weather.",
      },
      {
        question: "How do I find a WattUp station near me?",
        answer:
          "You can explore current and upcoming WattUp locations using the interactive map on our website. As our network grows, live availability and additional driver features will also be accessible through the WattUp app.",
      },
    ],
  },
  {
    category: "Charging & Compatibility",
    items: [
      {
        question: "What vehicles are compatible?",
        answer:
          "WattUp stations are designed for broad compatibility and support major charging standards, including CCS, NACS/Tesla, and J1772 where available. Compatibility may vary by location and charger type.",
      },
      {
        question: "How does battery-integrated charging help the grid?",
        answer:
          "Our battery-integrated charging systems help reduce stress on the electrical grid by storing energy and delivering power when needed. This can improve charging performance, lower demand costs, and support more reliable operation during peak periods.",
      },
    ],
  },
  {
    category: "Sustainability",
    items: [
      {
        question: "Is WattUp powered by clean energy?",
        answer:
          "Sustainability is central to our mission. WattUp is focused on expanding EV infrastructure and supporting a cleaner transportation future through efficient charging technology and smart energy solutions.",
      },
    ],
  },
  {
    category: "Property Owners & Partners",
    items: [
      {
        question: "What solutions do you offer commercial property owners?",
        answer:
          "WattUp USA provides fully managed EV charging solutions with no upfront cost to qualified property owners. We handle site analysis, engineering, permitting, utility coordination, installation, and ongoing operations while creating a long-term revenue opportunity for your property.",
      },
      {
        question: "How can my business apply to host a WattUp station?",
        answer:
          "Own or manage a high-traffic retail center, restaurant, grocery location, or commercial property? Contact our team through the Partner With Us section to see if your property qualifies for a fully managed WattUp installation.",
      },
      {
        question: "How can I contact you?",
        answer:
          "Need help? Contact us anytime for driver support, general questions, or partnership opportunities at support@wattupusa.com or through our contact form below. Our support team is available for urgent assistance.",
      },
    ],
  },
];

export const CapitalPartnersWhyData: HowItWorksStepData[] = [
  {
    title: (
      <>
        Battery-Backed DC Fast <br /> Charging
      </>
    ),
    description: "Designed for high utilization and performance consistency.",
    image: capitalPartnersImageUrls.why1,
  },
  {
    title: (
      <>
        Host-Site <br /> Model
      </>
    ),
    description:
      "Strategic partnerships with property owners enable rapid deployment in high-demand locations.",
    image: capitalPartnersImageUrls.why2,
  },
  {
    title: (
      <>
        Infrastructure-Led <br /> Approach
      </>
    ),
    description:
      "Positioned to benefit from long-term EV adoption and network effects.",
    image: capitalPartnersImageUrls.why3,
  },
  {
    title: (
      <>
        Execution <br /> Focus
      </>
    ),
    description:
      "Disciplined rollout with a focus on operational efficiency and long-term asset performance.",
    image: capitalPartnersImageUrls.why4,
  },
];

export interface TractionSnapshotData {
  value: string;
  label: string;
}

export const CapitalPartnersTractionData: TractionSnapshotData[] = [
  { value: "150+", label: "Sites Contracted" },
  { value: "500+", label: "Markets Targeted" },
  { value: "20+", label: "Partners Engaged" },
];

export const FleetSectionWhyData: HowItWorksStepData[] = [
  {
    title: "Scalable Infrastructure",
    description: "Grow your charging capacity as your fleet expands.",
    image: fleetSolutionImageUrls.why1,
  },
  {
    title: "Reliable Charging",
    description: "High-performance stations designed for daily operations.",
    image: fleetSolutionImageUrls.why2,
  },
  {
    title: "Operational Efficiency",
    description: "Minimize downtime with smart charging management.",
    image: fleetSolutionImageUrls.why3,
  },
  {
    title: "Cost Optimization",
    description: "Reduce operational costs with efficient energy",
    image: fleetSolutionImageUrls.why4,
  },
];

export const FleetSolutionPageWhyChooseSlideCardData: SlidesCardData[] = [
  {
    id: "scalable-infrastructure",
    image: fleetSolutionImageUrls.why5,
    mobileImage: fleetSolutionImageUrls.why5Mobile,
    title: "Scalable Infrastructure",
    description: "Grow your charging capacity as your fleet expands.",
    cta: {
      label: "Find Charging Locations",
      href: "/locations#locations",
    },
    imageClass: "",
  },
  {
    id: "reliable-charging",
    image: fleetSolutionImageUrls.why6,
    title: "Reliable Charging",
    description: "High-performance stations designed for daily operations.",
    cta: {
      label: "Find Charging Locations",
      href: "/locations#locations",
    },
    imageClass: "",
  },
  {
    id: "operational-efficiency",
    image: fleetSolutionImageUrls.why7,
    title: "Operational Efficiency",
    description: "Minimize downtime with smart charging management.",
    cta: {
      label: "Find Charging Locations",
      href: "/locations#locations",
    },
    imageClass: "max-md:object-[15%_top]",
  },
  {
    id: "cost-optimization",
    image: fleetSolutionImageUrls.why8,
    mobileImage: fleetSolutionImageUrls.why8Mobile,
    title: "Cost Optimization",
    description: "Reduce operational costs with efficient energy",
    cta: {
      label: "Find Charging Locations",
      href: "/locations#locations",
    },
    imageClass: "",
  },
];

export const FleetDeploymentProcessData: LocationData[] = [
  {
    title: "Site Assessment",
    description: "We evaluate your fleet needs and location.",
    image: fleetSolutionImageUrls.process1,
    mobileImage: fleetSolutionImageUrls.process1Mobile,
  },
  {
    title: "Installation",
    description: "Professional deployment of charging infrastructure.",
    image: fleetSolutionImageUrls.process2,
    mobileImage: fleetSolutionImageUrls.process2Mobile,
  },
  {
    title: "Integration",
    description: "Connect your fleet to the WattUp network.",
    image: fleetSolutionImageUrls.process3,
    mobileImage: fleetSolutionImageUrls.process3Mobile,
  },
  {
    title: "Ongoing Support",
    description: "Monitoring, maintenance, and optimization.",
    image: fleetSolutionImageUrls.process4,
    mobileImage: fleetSolutionImageUrls.process4Mobile,
  },
];

export const FleetPageSolutionsData: TextGridData[] = [
  {
    id: 1,
    title: "Delivery & Logistics",
    description: "Last-mile delivery fleets",
  },
  {
    id: 2,
    title: "Corporate Fleets",
    description: "Company vehicles and employee fleets",
  },
  {
    id: 3,
    title: "Ride Sharing",
    description: "Ride Sharing",
  },
  {
    id: 4,
    title: "Utilities & Services",
    description: "Service and maintenance fleets",
  },
];

export const FleetSolutionStepData: HowItWorksStepData[] = [
  {
    title: "Delivery & Logistics",
    description: "Last-mile delivery fleets",
    image: fleetSolutionImageUrls.solution1,
  },
  {
    title: "Corporate Fleets",
    description: "Company vehicles and employee fleets",
    image: fleetSolutionImageUrls.solution2,
  },
  {
    title: "Ride Sharing",
    description: "Ride Sharing",
    image: fleetSolutionImageUrls.solution3,
  },
  {
    title: "Utilities & Services",
    description: "Service and maintenance fleets",
    image: fleetSolutionImageUrls.solution4,
  },
];

export const FleetSolutionReliabilityData: HowItWorksStepData[] = [
  {
    title: (
      <>
        High uptime <br /> performance
      </>
    ),
    image: fleetSolutionImageUrls.reliability1,
  },
  {
    title: (
      <>
        Consistent charging <br /> availability
      </>
    ),
    image: fleetSolutionImageUrls.reliability2,
  },
  {
    title: (
      <>
        Enterprise-level <br /> infrastructure
      </>
    ),
    image: fleetSolutionImageUrls.reliability3,
  },
];

// ─── Legal Documents ──────────────────────────────────────────────────────────

export interface LegalBlock {
  subtitle?: string;
  paragraphs?: string[];
  list?: string[];
  compact?: boolean;
  keyValuePairs?: { label: string; value: string }[];
}

export interface LegalSection {
  title: string;
  blocks: LegalBlock[];
}

export interface LegalDocumentData {
  title: string;
  effectiveDate: string;
  company: string;
  address: string;
  contactEmail: string;
  intro: string;
  sections: LegalSection[];
}

export const PrivacyPolicyData: LegalDocumentData = {
  title: "Privacy Policy",
  effectiveDate: "May 18, 2026",
  company: "WattUp USA LLC",
  address: "2355 Westwood Blvd. #1017, Los Angeles, CA 90064",
  contactEmail: "support@wattupusa.com",
  intro:
    'WattUp USA LLC ("WattUp," "we," "our," or "us") operates the website at wattupusa.com (the "Site"). This Privacy Policy explains what personal information we collect, how we use it, who we share it with, and your rights regarding that information. By using the Site, you agree to the practices described in this policy.',
  sections: [
    {
      title: "1. Information We Collect",
      blocks: [
        {
          paragraphs: [
            "We collect personal information only when you voluntarily provide it through the contact forms on our Site. We do not require you to create an account or log in to use the Site.",
          ],
        },
        {
          subtitle: "1.1 Driver Support Form",
          paragraphs: ["When you submit a Driver Support inquiry, we collect:"],
          list: ["Name", "Email address", "Your message"],
        },
        {
          subtitle: "1.2 Host Partnership Form",
          paragraphs: ["When you submit a Host Partnership inquiry, we collect:"],
          list: [
            "Company name",
            "Location",
            "Number of parking spaces",
            "Contact information you provide",
          ],
        },
        {
          subtitle: "1.3 Automatically Collected Information",
          paragraphs: [
            "When you visit the Site, certain information is collected automatically through cookies and analytics tools, including:",
          ],
          list: [
            "Browser type and version",
            "Device type and operating system",
            "Pages viewed and time spent on the Site",
            "Referring URLs",
            "Approximate geographic location (city/region level, derived from IP address)",
            "IP address",
          ],
        },
        {
          subtitle: "1.4 No Financial Data",
          paragraphs: [
            "We do not collect payment card numbers, bank information, or any financial data through the Site. All payment transactions occur at physical WattUp charging stations and are handled by the payment processors at those terminals.",
          ],
        },
        {
          subtitle: "1.5 Children's Privacy",
          paragraphs: [
            "The Site is not directed to individuals under the age of 13. We do not knowingly collect personal information from children. If we become aware that we have inadvertently received personal information from a child under 13, we will delete it promptly. If you believe we may have such information, please contact us at support@wattupusa.com.",
          ],
        },
      ],
    },
    {
      title: "2. How We Use Your Information",
      blocks: [
        {
          paragraphs: ["We use the information we collect for the following purposes:"],
          list: [
            "To respond to your support requests or partnership inquiries",
            "To communicate with you about our services and network",
            "To analyze Site usage and improve our website and user experience",
            "To measure the effectiveness of our advertising and marketing efforts",
            "To comply with applicable laws and regulations",
            "To protect the security and integrity of our Site",
          ],
        },
        {
          paragraphs: [
            "The legal basis for processing your personal information is your consent (given via the checkbox on our contact forms) and our legitimate interest in operating and improving our services.",
          ],
        },
      ],
    },
    {
      title: "3. Cookies and Tracking Technologies",
      blocks: [
        {
          paragraphs: [
            "We use cookies and similar tracking technologies to collect information about how you interact with our Site. Cookies are small text files placed on your device. We use the following types:",
          ],
          list: [
            "Essential cookies: Required for the Site to function properly.",
            "Analytics cookies: Used to understand how visitors use the Site (see Section 4 for details).",
            "Advertising/marketing cookies: Used to measure ad performance and deliver relevant advertising (see Section 4 for details).",
          ],
        },
        {
          paragraphs: [
            "You can control or disable cookies through your browser settings. Please note that disabling certain cookies may affect the functionality of the Site. You may also opt out of interest-based advertising by visiting the Digital Advertising Alliance opt-out page at optout.aboutads.info or the Network Advertising Initiative at optout.networkadvertising.org.",
          ],
        },
      ],
    },
    {
      title: "4. Third-Party Services and Data Processors",
      blocks: [
        {
          paragraphs: [
            "We use the following third-party tools that may collect or process data about your use of the Site. Each has its own privacy policy governing how it handles your information.",
          ],
        },
        {
          subtitle: "4.1 Google Analytics and Google Tag Manager",
          paragraphs: [
            "We use Google Analytics and Google Tag Manager (provided by Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043) to collect and analyze information about Site usage. Google Analytics uses cookies to track user interactions and generates statistical reports about Site traffic. Google Tag Manager is used to manage and deploy tracking scripts on the Site.",
            "Google may use the data collected to contextualize and personalize its own advertising network. You can opt out of Google Analytics tracking by installing the Google Analytics Opt-Out Browser Add-On, available at tools.google.com/dlpage/gaoptout. Google's privacy policy is available at policies.google.com/privacy.",
          ],
        },
        {
          subtitle: "4.2 Meta Pixel",
          paragraphs: [
            "We use the Meta Pixel (provided by Meta Platforms, Inc., 1 Hacker Way, Menlo Park, CA 94025) to measure the effectiveness of our advertising on Meta's platforms (including Facebook and Instagram). The Meta Pixel collects data about your interactions with our Site and may associate that data with your Meta account to enable ad targeting and measurement.",
            "You can manage your ad preferences through your Meta account settings or by visiting Meta's Ad Preferences page. Meta's data policy is available at facebook.com/privacy/policy.",
          ],
        },
        {
          subtitle: "4.3 Email Service Provider (Future)",
          paragraphs: [
            "We may in the future use a third-party email service provider to manage communications with individuals who have contacted us through the Site. If and when such a provider is engaged, we will update this Privacy Policy to identify the provider and describe how it processes your information. Email service providers are bound by confidentiality obligations and are only authorized to use your information to deliver communications on our behalf.",
          ],
        },
      ],
    },
    {
      title: "5. How We Share Your Information",
      blocks: [
        {
          paragraphs: ["We do not sell your personal information. We may share your information in the following limited circumstances:"],
          list: [
            "Service providers: We may share information with trusted third-party vendors who assist us in operating our Site, managing communications, or analyzing Site performance. These providers are authorized to use your data only as necessary to provide services to us.",
            "Legal compliance: We may disclose information when required by law, court order, or other legal process, or when we believe disclosure is necessary to protect the rights, property, or safety of WattUp USA, our users, or the public.",
            "Business transfers: In the event of a merger, acquisition, or sale of all or a portion of our assets, personal information may be transferred as part of that transaction. We will notify you via a notice on the Site of any material change in ownership or use of your personal information.",
          ],
        },
      ],
    },
    {
      title: "6. Data Retention",
      blocks: [
        {
          paragraphs: [
            "We retain your personal information for as long as necessary to fulfill the purposes described in this Privacy Policy, to respond to your inquiries, and to comply with our legal obligations. When personal information is no longer needed, we will securely delete or anonymize it.",
            "If you would like us to delete your information sooner, please contact us at support@wattupusa.com.",
          ],
        },
      ],
    },
    {
      title: "7. Your Rights and Choices",
      blocks: [
        {
          paragraphs: ["You have the following rights regarding your personal information:"],
          list: [
            "Access: You may request a copy of the personal information we hold about you.",
            "Correction: You may request that we correct inaccurate or incomplete information.",
            "Deletion: You may request that we delete your personal information, subject to any legal obligations to retain it.",
            "Opt-out of communications: If we send you email communications, you may opt out at any time by following the unsubscribe instructions in those emails or by contacting us directly.",
          ],
        },
        {
          paragraphs: [
            "To exercise any of these rights, please contact us at support@wattupusa.com. We will respond to your request within a reasonable timeframe.",
            "California residents may have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information is collected and the right to opt out of the sale of personal information. We do not sell personal information. For CCPA inquiries, contact us at support@wattupusa.com.",
          ],
        },
      ],
    },
    {
      title: "8. Third-Party Links",
      blocks: [
        {
          paragraphs: [
            "The Site may contain links to third-party websites, including social media platforms and partner pages. We are not responsible for the privacy practices or content of those websites. We encourage you to review the privacy policies of any third-party sites you visit.",
          ],
        },
      ],
    },
    {
      title: "9. Data Security",
      blocks: [
        {
          paragraphs: [
            "We implement reasonable technical and organizational measures to protect your personal information against unauthorized access, loss, or misuse. However, no method of transmission over the internet or electronic storage is completely secure. We cannot guarantee absolute security of your data.",
          ],
        },
      ],
    },
    {
      title: "10. Changes to This Privacy Policy",
      blocks: [
        {
          paragraphs: [
            "We may update this Privacy Policy from time to time. When we make material changes, we will post the updated policy on this page with a revised Effective Date. We encourage you to review this policy periodically. Your continued use of the Site after any changes constitutes your acceptance of the updated policy.",
          ],
        },
      ],
    },
    {
      title: "11. Contact Us",
      blocks: [
        {
          paragraphs: [
            "If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:",
          ],
        },
        {
          keyValuePairs: [
            { label: "Company", value: "WattUp USA LLC" },
            { label: "Address", value: "2355 Westwood Blvd. #1017, Los Angeles, CA 90064" },
            { label: "Email", value: "support@wattupusa.com" },
            { label: "Website", value: "wattupusa.com" },
          ],
        },
      ],
    },
  ],
};

export const TermsOfUseData: LegalDocumentData = {
  title: "Terms of Use",
  effectiveDate: "May 18, 2026",
  company: "WattUp USA LLC",
  address: "2355 Westwood Blvd. #1017, Los Angeles, CA 90064",
  contactEmail: "support@wattupusa.com",
  intro:
    'Please read these Terms of Use carefully before using the WattUp USA website located at wattupusa.com (the "Site"). These Terms govern your access to and use of the Site. By accessing or using the Site in any way, you agree to be bound by these Terms. If you do not agree, please do not use the Site.',
  sections: [
    {
      title: "1. About the Site",
      blocks: [
        {
          paragraphs: [
            'The Site is an informational and inquiry platform operated by WattUp USA LLC ("WattUp," "we," "our," or "us"). The Site provides information about WattUp\'s EV charging network, charging station locations, and opportunities for property owners and businesses to partner with WattUp as Hosts.',
            "The Site serves two primary audiences:",
          ],
          list: [
            "Drivers: Individuals who use or are interested in using WattUp EV charging stations.",
            "Hosts / Property Partners: Businesses and property owners who are interested in hosting WattUp charging infrastructure on their properties.",
          ],
        },
        {
          paragraphs: [
            "The Site is an informational resource only. Actual charging services are provided at physical WattUp charging stations, subject to separate terms and conditions applicable at the point of service.",
          ],
        },
      ],
    },
    {
      title: "2. Acceptance of Terms",
      blocks: [
        {
          paragraphs: ["By accessing or using the Site, you represent that:"],
          list: [
            "You are at least 18 years of age;",
            "You have the legal capacity to enter into a binding agreement; and",
            "You agree to comply with these Terms of Use and all applicable laws and regulations.",
          ],
        },
        {
          paragraphs: [
            "If you are using the Site on behalf of a company or other legal entity, you represent that you have the authority to bind that entity to these Terms.",
          ],
        },
      ],
    },
    {
      title: "3. Permitted Use",
      blocks: [
        {
          paragraphs: ["You may use the Site for lawful purposes only, including to:"],
          list: [
            "Locate WattUp charging stations using our network map;",
            "Learn about WattUp's services, technology, and host partnership program;",
            "Submit a support or partnership inquiry through the Site's contact forms; and",
            "Access publicly available informational content on the Site.",
          ],
        },
      ],
    },
    {
      title: "4. Prohibited Use",
      blocks: [
        {
          paragraphs: ["You agree not to:"],
          list: [
            "Use the Site in any way that violates applicable federal, state, or local law or regulation;",
            "Attempt to gain unauthorized access to any portion of the Site or any systems connected to it;",
            "Introduce viruses, malware, or other harmful code to the Site;",
            "Scrape, harvest, or collect data from the Site using automated tools without our express written permission;",
            "Use the Site to transmit unsolicited commercial communications (spam);",
            "Impersonate WattUp or any other person or entity;",
            "Interfere with the proper operation of the Site or any networks connected to it; or",
            "Reproduce, distribute, modify, or create derivative works of any content on the Site without our prior written consent.",
          ],
        },
      ],
    },
    {
      title: "5. Intellectual Property",
      blocks: [
        {
          paragraphs: [
            "All content on the Site — including but not limited to text, graphics, logos, images, photographs, video, audio, icons, data compilations, and software — is the property of WattUp USA LLC or its licensors and is protected by U.S. and international copyright, trademark, and other intellectual property laws.",
            "The WattUp name, logo, and related marks are trademarks of WattUp USA LLC. You may not use any WattUp trademark, service mark, or trade name without our prior written permission.",
            "Nothing in these Terms grants you any license or right to use any intellectual property owned by WattUp or any third party except as expressly stated herein.",
          ],
        },
      ],
    },
    {
      title: "6. Information Submitted Through Forms",
      blocks: [
        {
          paragraphs: [
            "When you submit information through the Site's contact forms (Driver Support or Host Partnership), you grant WattUp a non-exclusive, royalty-free license to use, store, and process that information for the purpose of responding to your inquiry and for the operation of our business as described in our Privacy Policy.",
            "You represent that any information you submit is accurate, complete, and not in violation of any third-party rights.",
          ],
        },
      ],
    },
    {
      title: "7. Charging Station Services — Separate Terms Apply",
      blocks: [
        {
          paragraphs: [
            "The Site provides information about WattUp's physical EV charging network and the ability to locate charging stations. Actual charging services — including the use of charging equipment, payment for charging sessions, pricing, and related matters — are subject to separate terms and conditions presented at the point of service at each charging station.",
            "Nothing on the Site constitutes an offer or agreement to provide charging services at any specific location, price, or time. Payment transactions are conducted at the physical charging terminal and are not processed through the Site.",
          ],
        },
      ],
    },
    {
      title: "8. Disclaimer of Warranties",
      blocks: [
        {
          paragraphs: [
            'THE SITE AND ALL CONTENT AND INFORMATION PROVIDED ON IT ARE OFFERED ON AN "AS IS" AND "AS AVAILABLE" BASIS, WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.',
            "We do not warrant that:",
          ],
          list: [
            "The Site will be uninterrupted, error-free, or free of viruses or other harmful components;",
            "The information on the Site is complete, accurate, or current; or",
            "Any particular charging station will be available, operational, or accessible at any given time.",
          ],
        },
        {
          paragraphs: [
            "Charging station availability, performance, access, and pricing may vary by location and are subject to change without notice.",
          ],
        },
      ],
    },
    {
      title: "9. Limitation of Liability",
      blocks: [
        {
          paragraphs: [
            "TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, WATTUP USA LLC AND ITS OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, PARTNERS, AND LICENSORS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, REVENUE, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES ARISING OUT OF OR RELATED TO YOUR USE OF OR INABILITY TO USE THE SITE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.",
            "IN NO EVENT SHALL WATTUP'S TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING OUT OF OR RELATED TO THESE TERMS OR YOUR USE OF THE SITE EXCEED ONE HUNDRED U.S. DOLLARS ($100.00).",
            "Some jurisdictions do not allow the exclusion of certain warranties or the limitation of liability for certain types of damages. In such jurisdictions, our liability is limited to the greatest extent permitted by law.",
          ],
        },
      ],
    },
    {
      title: "10. Indemnification",
      blocks: [
        {
          paragraphs: [
            "You agree to indemnify, defend, and hold harmless WattUp USA LLC and its officers, directors, employees, agents, and licensors from and against any claims, liabilities, damages, losses, costs, and expenses (including reasonable attorneys' fees) arising out of or related to: (a) your use of the Site in violation of these Terms; (b) any information you submit through the Site; or (c) your violation of any applicable law or third-party right.",
          ],
        },
      ],
    },
    {
      title: "11. External Links",
      blocks: [
        {
          paragraphs: [
            "The Site may contain links to third-party websites, including social media platforms, partner organizations, and other external resources. These links are provided for convenience only. WattUp does not endorse, control, or assume responsibility for the content, privacy practices, or accuracy of any third-party websites. Accessing third-party websites is at your own risk.",
          ],
        },
      ],
    },
    {
      title: "12. Governing Law and Dispute Resolution",
      blocks: [
        {
          paragraphs: [
            "These Terms of Use shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law principles.",
            "Any dispute, claim, or controversy arising out of or relating to these Terms or your use of the Site shall be subject to the exclusive jurisdiction of the state and federal courts located in Los Angeles County, California. You consent to personal jurisdiction in those courts.",
          ],
        },
      ],
    },
    {
      title: "13. Changes to These Terms",
      blocks: [
        {
          paragraphs: [
            "We reserve the right to modify these Terms of Use at any time. When we make material changes, we will update the Effective Date at the top of this document and post the revised Terms on the Site. Your continued use of the Site after any changes constitutes your acceptance of the updated Terms. We encourage you to review these Terms periodically.",
          ],
        },
      ],
    },
    {
      title: "14. Severability",
      blocks: [
        {
          paragraphs: [
            "If any provision of these Terms is found to be invalid, illegal, or unenforceable under applicable law, that provision shall be deemed modified to the minimum extent necessary to make it enforceable, or severed if modification is not possible. The remaining provisions of these Terms shall continue in full force and effect.",
          ],
        },
      ],
    },
    {
      title: "15. Entire Agreement",
      blocks: [
        {
          paragraphs: [
            "These Terms of Use, together with our Privacy Policy, constitute the entire agreement between you and WattUp USA LLC with respect to your use of the Site and supersede all prior or contemporaneous agreements, communications, and understandings relating to that subject matter.",
          ],
        },
      ],
    },
    {
      title: "16. Contact Us",
      blocks: [
        {
          paragraphs: [
            "If you have any questions about these Terms of Use, please contact us:",
          ],
        },
        {
          keyValuePairs: [
            { label: "Company", value: "WattUp USA LLC" },
            { label: "Address", value: "2355 Westwood Blvd. #1017, Los Angeles, CA 90064" },
            { label: "Email", value: "support@wattupusa.com" },
            { label: "Website", value: "wattupusa.com" },
          ],
        },
      ],
    },
  ],
};
