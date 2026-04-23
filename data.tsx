import { driversImageUrls } from '@/lib/images/drivers';
import { homeImageUrls } from '@/lib/images/home';
import { hostsImageUrls } from '@/lib/images/hosts';
import { policyImageUrls } from '@/lib/images/policy';
import { pressReleaseImageUrls } from '@/lib/images/press-release';
import { sharedImageUrls } from '@/lib/images/shared';
import { aboutImageUrls } from './lib/images/about';

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
    title: string;
}

export interface TechnologySlideData {
    number: string;
    title: string;
    description: string;
    image: string;
    mobileImage?: string;
    textPosition: 'left' | 'right';
    className?: string; // Allow custom styling per slide
    textStyle?: React.CSSProperties; // Allow exact absolute positioning
    gradientClass?: string;
    gradientStyle?: React.CSSProperties; // Detailed background styling
    imageClassName?: string; // Custom image object-position per slide
}
export interface HowItWorksStepData {
    title: React.ReactNode;
    description: React.ReactNode;
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
}

export interface Cities {
    name: string;
    capacity: string;
    stationName: string;
    contact: string;
}
export const HomePageBuiltForSlidesCardData: SlidesCardData[] = [
    {
        id: 'drivers',
        image: sharedImageUrls.car1,
        title: 'For Drivers',
        description:
            'Find nearby charging stations, plug in, and get back on the road faster.',
        cta: {
            label: 'Find Charging Locations',
            href: '/locations#locations',
        },
        imageClass: 'max-md:object-[14%_top]',
    },
    {
        id: 'hosts',
        image: sharedImageUrls.car2,
        title: 'For Hosts',
        description:
            'Install EV charging and attract high-value customers, tenants, and visitors.',
        cta: { label: 'Become a Host', href: '/contact#contact-us' },
        imageClass: 'max-md:object-[14%_top]',
    },
    {
        id: 'drivers-1',
        image: sharedImageUrls.car1,
        title: 'For Drivers',
        description:
            'Find nearby charging stations, plug in, and get back on the road faster.',
        cta: {
            label: 'Find Charging Locations',
            href: '/locations#locations',
        },
        imageClass: 'max-md:object-[14%_top]',
    },
    {
        id: 'hosts-1',
        image: sharedImageUrls.car2,
        title: 'For Hosts',
        description:
            'Install EV charging and attract high-value customers, tenants, and visitors.',
        cta: { label: 'Become a Host', href: '/contact#contact-us' },
        imageClass: 'max-md:object-[14%_top]',
    },
];

export const HomePageHowItWorksStepData: HowItWorksStepData[] = [
    {
        title: 'Find a Station',
        description:
            'Locate a WattUp charging station near you using our network map.',
        image: sharedImageUrls.howItWorks1,
    },
    {
        title: 'Plug In',
        description:
            'Connect your EV and start charging instantly. Wait until the car charges',
        image: sharedImageUrls.howItWorks2,
    },
    {
        title: 'Charge & Go',
        description:
            'Fast, reliable charging so you can get back on the road quickly.',
        image: sharedImageUrls.howItWorks4,
    },
];

export const HomePagetechnologySlidesData: TechnologySlideData[] = [
    {
        number: '01.',
        title: 'Smart charging\ninfrastructure',
        description: 'Lorem ipsum dolor sit amet\nconsectetur',
        image: homeImageUrls.technologyBacked1,
        mobileImage: homeImageUrls.technologyBacked1Mobile,
        textPosition: 'left',
        textStyle: {
            left: '252px',
            top: '155px',
            maxWidth: '449px',
        },
        gradientStyle: {
            left: '252px',
            top: '300px', // Right below the title, like the red box
            width: '800px',
            height: '456px',
            background:
                'radial-gradient(50% 50% at 30% 50%, rgba(55, 48, 32, 0.85) 0%, rgba(55, 48, 32, 0) 100%)',
            filter: 'blur(150px)',
        },
    },
    {
        number: '02.',
        title: 'High-performance\nhardware',
        description: 'Lorem ipsum dolor sit amet\nconsectetur',
        image: homeImageUrls.technologyBacked2,
        mobileImage: homeImageUrls.technologyBacked2Mobile,
        textPosition: 'right',
        imageClassName: 'object-contain object-left',
        textStyle: {
            left: '920px',
            top: '250px',
            maxWidth: '497px',
        },
        gradientStyle: {
            left: '700px',
            top: '100px',
            width: '800px',
            height: '600px',
            background:
                'radial-gradient(50% 50% at 50% 50%, rgba(55, 48, 32, 0.85) 0%, rgba(55, 48, 32, 0) 100%)',
            filter: 'blur(150px)',
        },
    },
    {
        number: '03.',
        title: 'Seamless payment\nintegration',
        description: 'Lorem ipsum dolor sit amet\nconsectetur',
        image: homeImageUrls.technologyBacked3,
        mobileImage: homeImageUrls.technologyBacked3Mobile,
        textPosition: 'left',
        textStyle: {
            left: '80px',
            top: '304px',
            maxWidth: '449px',
        },
        gradientStyle: {
            left: '252px',
            top: '200px',
            width: '800px',
            height: '556px',
            background:
                'radial-gradient(50% 50% at 30% 50%, rgba(55, 48, 32, 0.85) 0%, rgba(55, 48, 32, 0) 100%)', // slightly varied color logic
            filter: 'blur(150px)',
        },
    },
];

export const HomePageWhyChooseSlideCardData: SlidesCardData[] = [
    {
        id: 'fast-charging',
        image: homeImageUrls.whyImage1,
        title: 'Fast Charging',
        description:
            'High-performance charging stations designed for speed and reliability.',
        cta: {
            label: 'Find Charging Locations',
            href: '/locations#locations',
        },
        imageClass: 'max-md:object-[70%_top]',
    },
    {
        id: 'premium-locations',
        image: homeImageUrls.whyImage2,
        title: 'Premium Locations',
        description:
            'Charge where you already spend your time — shopping centers, hotels, and workplaces.',
        cta: {
            label: 'Find Charging Locations',
            href: '/locations#locations',
        },
        imageClass: 'max-md:object-[70%_top]',
    },
    {
        id: 'symless-experience',
        image: homeImageUrls.whyImage3,
        title: 'Seamless Experience',
        description: 'Simple access, easy payments, and reliable performance.',
        cta: {
            label: 'Find Charging Locations',
            href: '/locations#locations',
        },
        imageClass: 'max-md:object-[90%_top]',
    },
    {
        id: 'smart-infrastructure',
        image: homeImageUrls.whyImage4,
        title: 'Smart Infrastructure',
        description:
            'Built with advanced technology and monitored for maximum uptime.',
        cta: {
            label: 'Find Charging Locations',
            href: '/locations#locations',
        },
        imageClass: 'max-md:object-[35%_top]',
    },
];

export const DriverPageHowItWorksStepData: HowItWorksStepData[] = [
    {
        title: 'Find a Station',
        description:
            'Locate a WattUp charging station near you using our network map.',
        image: sharedImageUrls.howItWorks1,
    },
    {
        title: 'Plug In',
        description:
            'Connect your EV and start charging instantly. Wait until the car charges',
        image: sharedImageUrls.howItWorks2,
    },
    {
        title: 'Charge & Go',
        description:
            'Fast, reliable charging so you can get back on the road quickly.',
        image: sharedImageUrls.howItWorks5,
    },
];
export const DriverPageWhyChooseSlideCardData: SlidesCardData[] = [
    {
        id: 'fast-charging',
        image: driversImageUrls.driverWhyChoose1,
        mobileImage: driversImageUrls.driverWhyChooseMobile1,
        title: 'Fast Charging',
        description: 'Reliable high-performance stations.',
        cta: {
            label: 'Find Charging Locations',
            href: '/locations#locations',
        },
        imageClass: 'max-md:object-[40%_top]',
    },
    {
        id: 'premium-locations',
        image: driversImageUrls.driverWhyChoose2,
        title: 'Convenient Locations',
        description: (
            <>
                Charge where you <br className='md:hidden' /> already go.
            </>
        ),
        cta: {
            label: 'Find Charging Locations',
            href: '/locations#locations',
        },
        imageClass: 'max-md:object-[25%_top]',
    },
    {
        id: 'symless-experience',
        image: driversImageUrls.driverWhyChoose3,
        title: 'Reliable Network',
        description: 'Stations monitored for consistent performance.',
        cta: {
            label: 'Find Charging Locations',
            href: '/locations#locations',
        },
        imageClass: 'max-md:object-[14%_top]',
    },
    {
        id: 'smart-infrastructure',
        image: driversImageUrls.driverWhyChoose4,
        mobileImage: driversImageUrls.driverWhyChooseMobile4,
        title: 'Simple Experience',
        description: 'Easy access and seamless payments.',
        cta: {
            label: 'Find Charging Locations',
            href: '/locations#locations',
        },
        imageClass: 'max-md:object-[60%_top]',
    },
];
export const AboutPageCorePrinciplesData: HowItWorksStepData[] = [
    {
        title: 'Mission',
        description:
            'Our mission is to make EV charging accessible and reliable everywhere.',
        image: aboutImageUrls.mission,
    },
    {
        title: 'Vision',
        description:
            'We believe the future of mobility depends on scalable charging infrastructure.',
        image: aboutImageUrls.vision,
    },
    {
        title: 'Future',
        description:
            'EV adoption is growing rapidly, and charging networks will play a critical role.',
        image: aboutImageUrls.future,
    },
    {
        title: 'Sustainability',
        description:
            'Supporting the transition to clean transportation and sustainable infrastructure.',
        image: aboutImageUrls.sustainability,
    },
];
export const cities: Cities[] = [
    {
        name: 'Los Angeles',
        capacity: '150kW',
        stationName: 'Station name',
        contact: '(000)-000-0000',
    },
    {
        name: 'San Diego',
        capacity: '150kW',
        stationName: 'Station name',
        contact: '(000)-000-0000',
    },
    {
        name: 'San Jose',
        capacity: '150kW',
        stationName: 'Station name',
        contact: '(000)-000-0000',
    },
    {
        name: 'San Francisco',
        capacity: '150kW',
        stationName: 'Station name',
        contact: '(000)-000-0000',
    },
    {
        name: 'Fresno',
        capacity: '150kW',
        stationName: 'Station name',
        contact: '(000)-000-0000',
    },
    {
        name: 'Sacramento',
        capacity: '150kW',
        stationName: 'Station name',
        contact: '(000)-000-0000',
    },
    {
        name: 'Long Beach',
        capacity: '150kW',
        stationName: 'Station name',
        contact: '(000)-000-0000',
    },
    {
        name: 'Oakland',
        capacity: '150kW',
        stationName: 'Station name',
        contact: '(000)-000-0000',
    },

    {
        name: 'Fresno',
        capacity: '150kW',
        stationName: 'Station name',
        contact: '(000)-000-0000',
    },
    {
        name: 'Sacramento',
        capacity: '150kW',
        stationName: 'Station name',
        contact: '(000)-000-0000',
    },
    {
        name: 'Long Beach',
        capacity: '150kW',
        stationName: 'Station name',
        contact: '(000)-000-0000',
    },
    {
        name: 'Oakland',
        capacity: '150kW',
        stationName: 'Station name',
        contact: '(000)-000-0000',
    },

    {
        name: 'Fresno',
        capacity: '150kW',
        stationName: 'Station name',
        contact: '(000)-000-0000',
    },
    {
        name: 'Sacramento',
        capacity: '150kW',
        stationName: 'Station name',
        contact: '(000)-000-0000',
    },
    {
        name: 'Long Beach',
        capacity: '150kW',
        stationName: 'Station name',
        contact: '(000)-000-0000',
    },
    {
        name: 'Oakland',
        capacity: '150kW',
        stationName: 'Station name',
        contact: '(000)-000-0000',
    },
];
export const HostPageWhyChooseSlideCardData: SlidesCardData[] = [
    {
        id: 'increase-property-value',
        image: hostsImageUrls.whyChoose1,
        title: (
            <>
                Increase Property <br className='md:hidden' /> Value
            </>
        ),
        description: " Enhance your property's long-term appeal.",
        cta: { label: 'Request Partnership', href: '/contact#contact-us' },
    },
    {
        id: 'attract-visitors',
        image: hostsImageUrls.whyChoose2,
        title: (
            <>
                Attract <br className='md:hidden' />
                Visitors
            </>
        ),
        description: ' EV drivers actively look for charging locations.',
        cta: { label: 'Request Partnership', href: '/contact#contact-us' },
        imageClass: 'max-md:object-[70%_top]',
    },
    {
        id: 'support-sustainability',
        image: hostsImageUrls.whyChoose3,
        title: (
            <>
                Support <br className='md:hidden' />
                Sustainability
            </>
        ),
        description: ' Show commitment to clean mobility.',
        cta: { label: 'Request Partnership', href: '/contact#contact-us' },
        imageClass: 'max-md:object-[70%_top]',
    },
    {
        id: 'generate-revenue',
        image: hostsImageUrls.whyChoose4,
        mobileImage: hostsImageUrls.whyChooseMobile4,
        title: (
            <>
                Generate <br className='md:hidden' />
                Revenue
            </>
        ),
        description: ' Turn parking spaces into a new income stream.',
        cta: { label: 'Request Partnership', href: '/contact#contact-us' },
    },
];

export const HostPageHowItWorksStepsData: HowItWorksStepData[] = [
    {
        title: 'Site Assessment',
        description: 'We evaluate your location.',
        image: hostsImageUrls.hostsHowItWorks1,
    },
    {
        title: 'Installation',
        description: 'Professional charger installation.',
        image: hostsImageUrls.hostsHowItWorks2,
        mobileImage: hostsImageUrls.hostsHowItWorksMobile2,
        imageClass: 'max-md:object-[70%_top]',
    },
    {
        title: 'Integration',
        description: 'Stations connected to the  WattUp network.',
        image: hostsImageUrls.hostsHowItWorks3,
        mobileImage: hostsImageUrls.hostsHowItWorksMobile3,
    },
    {
        title: 'Ongoing Support',
        description: 'Continuous monitoring and support.',
        image: hostsImageUrls.hostsHowItWorks4,
        mobileImage: hostsImageUrls.hostsHowItWorksMobile4,
    },
];

export const HostPageBenifitsCardsData: SlidesCardData[] = [
    {
        id: 'charging-revenue',
        image: hostsImageUrls.hostPageBenifitImage1,
        mobileImage: hostsImageUrls.hostPageBenifitImageMobile1,
        title: (
            <>
                Charging <br className='md:hidden' /> Revenue
            </>
        ),
        description: (
            <>
                Drivers pay to charge their <br className='md:hidden' />{' '}
                vehicles at your location.
            </>
        ),
        cta: { label: 'Request Partnership', href: '/contact#contact-us' },
    },
    {
        id: 'longer-customer-visit',
        image: hostsImageUrls.hostPageBenifitImage2,
        title: (
            <>
                Longer
                <br className='md:hidden' /> Customer Visits
            </>
        ),
        description: (
            <>
                <span className='max-md:hidden'>Charging takes time,</span>{' '}
                increasing time spent at your <br className='md:hidden' />{' '}
                property.
            </>
        ),
        cta: { label: 'Request Partnership', href: '/contact#contact-us' },
    },
    {
        id: 'increased-foot-traffic',
        image: hostsImageUrls.hostPageBenifitImage3,
        title: (
            <>
                Increased Foot <br className='md:hidden' />
                Traffic
            </>
        ),
        description: (
            <>
                EV drivers choose locations <br className='md:hidden' /> where
                they can charge.
            </>
        ),
        cta: { label: 'Request Partnership', href: '/contact#contact-us' },
        imageClass: 'max-md:object-[60%_top]',
    },
    {
        id: 'property-value-growth',
        image: hostsImageUrls.hostPageBenifitImage4,
        title: (
            <>
                Property Value <br className='md:hidden' /> Growth
            </>
        ),
        description: (
            <>
                EV infrastructure increases <br className='md:hidden' />
                long-term property value.
            </>
        ),
        cta: { label: 'Request Partnership', href: '/contact#contact-us' },
    },
];

export const CarginglocationsForDrivers = [
    {
        title: 'Retail Centers',
        image: sharedImageUrls.cardImage1,
    },
    {
        title: 'Hotels',
        image: sharedImageUrls.cardImage2,
    },
    {
        title: 'Office Buildings',
        image: sharedImageUrls.cardImage5,
    },
    {
        title: 'Residential Communities',
        image: sharedImageUrls.cardImage4,
    },
];

export const IdealLocationsForHosts = [
    {
        title: 'Hotels',
        image: sharedImageUrls.cardImage2,
    },
    {
        title: 'Retail Centers',
        image: sharedImageUrls.cardImage1,
    },
    {
        title: 'Office Buildings',
        image: sharedImageUrls.cardImage5,
    },
    {
        title: 'Residential Communities',
        image: sharedImageUrls.cardImage4,
    },
];

export const HostPageTechnologyFeaturesData = [
    {
        number: '01.',
        title: 'Smart charging\ninfrastructure',
    },
    {
        number: '02.',
        title: 'Secure payments',
    },
    {
        number: '03.',
        title: 'High-performance\nhardware',
    },
];

export const PolicyOptionsData = [
    {
        title: 'Intellectual Property',
        description:
            'All content on this website, including but not limited to text, graphics, logos, images, and design elements, is the property of WattUp USA',
        image: policyImageUrls.policy1,
    },
    {
        title: 'Limitation of Liability',
        description:
            'We strive to ensure that all information on this website is accurate and up to date. However, we make no guarantees regarding completeness',
        image: policyImageUrls.policy2,
    },
    {
        title: 'External Links',
        description:
            'This website may contain links to third-party websites. We are not responsible for the content, policies',
        image: policyImageUrls.policy3,
    },
];

export const PolicyLeagalsData = [
    {
        title: 'Use of Data',
        description:
            'We may collect personal information such as your name, email address, and usage data when you interact with our website (e.g., via forms, subscriptions, or analytics tools).',
    },
    {
        title: 'Cookies',
        description:
            'We use cookies and similar tracking technologies to enhance your browsing experience. You can control or disable cookies through your browser settings.',
    },
    {
        title: 'Data Sharing',
        description:
            'We do not sell your personal data. We may share information with trusted third-party service providers only as necessary to operate the website or comply with legal obligations.',
    },
];

export const DriverFAQData: FAQ[] = [
    {
        question: 'How do I start charging?',
        answer: 'Simply plug the connector into your EV, and the charging session will begin automatically or through the WattUp app.',
    },
    {
        question: 'Do I need an app?',
        answer: 'While our app offers the best experience with real-time tracking, you can also start a session using a credit card or RFID tag.',
    },
    {
        question: 'How long does charging take?',
        answer: "Charging time varies depending on your vehicle's battery size and the charger's speed, typically ranging from 30 minutes to a few hours.",
    },
    {
        question: 'What vehicles are compatible?',
        answer: 'Our chargers are compatible with all major EV models equipped with J1772 or CCS connectors. Tesla vehicles may require an adapter.',
    },
];
export const faqPageFaqData: FAQ[] = [
    {
        question: 'How do I start charging?',
        answer: 'Connect your EV and start charging instantly. Wait until the car charges',
    },
    {
        question: 'Do I need an app?',
        answer: 'While our app offers the best experience with real-time tracking, you can also start a session using a credit card or RFID tag.',
    },
    {
        question: 'How long does charging take?',
        answer: "Charging time varies depending on your vehicle's battery size and the charger's speed, typically ranging from 30 minutes to a few hours.",
    },
    {
        question: 'What vehicles are compatible?',
        answer: 'Our chargers are compatible with all major EV models equipped with J1772 or CCS connectors. Tesla vehicles may require an adapter.',
    },
    {
        question: 'How can I contact you?',
        answer: 'You can reach our 24/7 customer support team via the "Help" section in our app, or by calling our toll-free support line.',
    },
    {
        question: 'What are your payment terms?',
        answer: 'We offer pay-as-you-go pricing based on energy consumed (kWh) or time spent charging, depending on local regulations.',
    },
    {
        question: 'What vehicles are compatible?',
        answer: 'Our chargers are compatible with all major EV models equipped with J1772 or CCS connectors. Tesla vehicles may require an adapter.',
    },
];

export const pressReleaseArchiveData: PressReleaseArchiveData[] = [
    {
        id: '1',
        image: pressReleaseImageUrls.pressRelease1,
        secondImage: pressReleaseImageUrls.pressRelease1Second,
        mobileImage: pressReleaseImageUrls.pressRelease1Mobile,
        date: 'March 23, 2026',
        title: 'Expansion of EV Charging Infrastructure in Urban Areas',
        slug: 'expansion-of-ev-charging-infrastructure-in-urban-areas',
        description:
            'We are proud to announce the successful deployment of new electric vehicle charging stations across several urban locations. This expan...',
        imageClass: '',
    },
    {
        id: '2',
        image: pressReleaseImageUrls.pressRelease2,
        secondImage: pressReleaseImageUrls.pressRelease2,
        mobileImage: pressReleaseImageUrls.pressRelease2Mobile,
        date: 'March 25, 2026',
        title: 'Partnership with Local',
        slug: 'partnership-with-local',
        description:
            'Our company has partnered with a number of local businesses to install EV charging solutions at commercial properties. This initiative allows...',
        imageClass: '',
    },
    {
        id: '3',
        image: pressReleaseImageUrls.pressRelease3,
        secondImage: pressReleaseImageUrls.pressRelease3,
        mobileImage: pressReleaseImageUrls.pressRelease3Mobile,
        date: 'February 9, 2026',
        title: 'Commitment to Sustainability',
        slug: 'commitment-to-sustainability',
        description:
            'As part of our sustainability strategy, we are integrating renewable energy sources into our charging infrastructure. This step reduc... ',
        imageClass: '',
    },
    {
        id: '4',
        image: pressReleaseImageUrls.pressRelease4,
        secondImage: pressReleaseImageUrls.pressRelease4,
        mobileImage: pressReleaseImageUrls.pressRelease4Mobile,
        date: 'March 05, 2026',
        title: 'Introduction of Fast-Charging Solutions',
        slug: 'introduction-of-fast-charging-solutions',
        description:
            'We have introduced a new range of fast-charging stations designed to significantly reduce charging time. These solutions are ideal for high ...',
        imageClass: '',
    },
    {
        id: '5',
        image: pressReleaseImageUrls.pressRelease5,
        secondImage: pressReleaseImageUrls.pressRelease5,
        mobileImage: pressReleaseImageUrls.pressRelease5Mobile,
        date: 'April 23, 2026',
        title: 'Launch of Smart Charging Management System',
        slug: 'launch-of-smart-charging-management-system',
        description:
            'We have introduced an advanced smart management system for EV charging stations. This technology allows users and operators to ...',
        imageClass: '',
    },
    {
        id: '6',
        image: pressReleaseImageUrls.pressRelease6,
        secondImage: pressReleaseImageUrls.pressRelease6,
        mobileImage: pressReleaseImageUrls.pressRelease6Mobile,
        date: 'March 01, 2026',
        title: 'Entry into New Regional Markets',
        slug: 'entry-into-new-regional-markets',
        description:
            'Our company is expanding into new regions, bringing reliable and scalable EV charging solutions to a wider audience. This step ...',
        imageClass: '',
    },
];

