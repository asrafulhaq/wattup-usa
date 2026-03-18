export interface SlidesCardData {
    id: string;
    image: string;
    title: string;
    description: string;
    cta: { label: string; href: string };
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

export const HomePageBuiltForSlidesCardData: SlidesCardData[] = [
    {
        id: 'drivers',
        image: '/assets/images/car1.png',
        title: 'For Drivers',
        description:
            'Find nearby charging stations, plug in, and get back on the road faster.',
        cta: { label: 'Find Charging Locations', href: '/locations#map' },
    },
    {
        id: 'hosts',
        image: '/assets/images/car-2.png',
        title: 'For Hosts',
        description:
            'Install EV charging and attract high-value customers, tenants, and visitors.',
        cta: { label: 'Become a Host', href: '/contact#contact-us' },
    },
    {
        id: 'drivers-1',
        image: '/assets/images/car1.png',
        title: 'For Drivers',
        description:
            'Find nearby charging stations, plug in, and get back on the road faster.',
        cta: { label: 'Find Charging Locations', href: '/locations#map' },
    },
    {
        id: 'hosts-1',
        image: '/assets/images/car-2.png',
        title: 'For Hosts',
        description:
            'Install EV charging and attract high-value customers, tenants, and visitors.',
        cta: { label: 'Become a Host', href: '/contact#contact-us' },
    },
];

export const HomePageHowItWorksStepData = [
    {
        title: 'Find a Station',
        description:
            'Locate a WattUp charging station near you using our network map.',
        image: '/assets/images/how-it-works-1.png',
    },
    {
        title: 'Plug In',
        description:
            'Check in with our app, plug in your vehicle, and start charging.',
        image: '/assets/images/how-it-works-2.png',
    },
    {
        title: 'Charge & Go',
        description:
            'Receive real-time updates and pay seamlessly when your charge is complete.',
        image: '/assets/images/how-it-works-3.png',
    },
];

export const HomePagetechnologySlidesData: TechnologySlideData[] = [
    {
        number: '01.',
        title: 'Smart charging\ninfrastructure',
        description: 'Lorem ipsum dolor sit amet\nconsectetur',
        image: '/assets/images/technology-backed-1.png',
        mobileImage: '/assets/images/technology-backed-1-mobile.png',
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
        image: '/assets/images/technology-backed-2.png',
        mobileImage: '/assets/images/technology-backed-2-mobile.png',
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
        image: '/assets/images/technology-backed-3.png',
        mobileImage: '/assets/images/technology-backed-3-mobile.png',
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
        image: '/assets/images/why-image-1.png',
        title: 'Fast Charging',
        description:
            'High-performance charging stations designed for speed and reliability.',
        cta: { label: 'Find Charging Locations', href: '/locations#map' },
    },
    {
        id: 'premium-locations',
        image: '/assets/images/why-image-2.png',
        title: 'Premium Locations',
        description:
            'Charge where you already spend your time — shopping centers, hotels, and workplaces.',
        cta: { label: 'Find Charging Locations', href: '/locations#map' },
    },
    {
        id: 'smart-infrastructure',
        image: '/assets/images/hero-driver.jpg',
        title: 'Smart Infrastructure',
        description:
            'Built with advanced technology and monitored for maximum uptime.',
        cta: { label: 'Find Charging Locations', href: '/locations#map' },
    },
];

export const HostPageWhyChooseSlideCardData: SlidesCardData[] = [
    {
        id: 'increase-property-value',
        image: '/assets/images/for-host-slide-card-image-1.png',
        title: 'Increase Property Value',
        description: " Enhance your property's long-term appeal.",
        cta: { label: 'Request Partnership', href: '/contact#contact-us' },
    },
    {
        id: 'attract-visitors',
        image: '/assets/images/for-host-slide-card-image-2.png',
        title: 'Attract Visitors',
        description: ' EV drivers actively look for charging locations.',
        cta: { label: 'Request Partnership', href: '/contact#contact-us' },
    },
    {
        id: 'support-sustainability',
        image: '/assets/images/for-host-slide-card-image-1.png',
        title: 'Support Sustainability',
        description: ' Show commitment to clean mobility.',
        cta: { label: 'Request Partnership', href: '/contact#contact-us' },
    },
];

export const HostPageHowItWorksStepsData = [
    {
        title: 'Site Assessment',
        description: 'We evaluate your location.',
        image: '/assets/images/hosts-how-it-works-1.png',
    },
    {
        title: 'Installation',
        description: 'Professional charger installation.',
        image: '/assets/images/hosts-how-it-works-2.png',
    },
    {
        title: 'Integration',
        description: 'Stations connected to the  WattUp network.',
        image: '/assets/images/hosts-how-it-works-3.png',
    },
    {
        title: 'Ongoing Support',
        description: 'Continuous monitoring and support.',
        image: '/assets/images/hosts-how-it-works-4.png',
    },
];

export const HostPageBenifitsCardsData: SlidesCardData[] = [
    {
        id: 'charging-revenue',
        image: '/assets/images/host-page-benifit-image-1.png',
        title: 'Charging Revenue',
        description: 'Drivers pay to charge their vehicles at your location.',
        cta: { label: 'Request Partnership', href: '/contact#contact-us' },
    },
    {
        id: 'increased-foot-traffic',
        image: '/assets/images/host-page-benifit-image-2.png',
        title: 'Increased Foot Traffic',
        description: 'EV drivers choose locations where they can charge.',
        cta: { label: 'Request Partnership', href: '/contact#contact-us' },
    },
    {
        id: 'longer-customer-visits',
        image: '/assets/images/car1.png',
        title: 'Longer Customer Visits',
        description:
            'Find nearby charging stations, plug in, and get back on the road faster.',
        cta: { label: 'Request Partnership', href: '/contact#contact-us' },
    },
    {
        id: 'property-value-growth',
        image: '/assets/images/car-2.png',
        title: 'Property Value Growth',
        description: 'EV infrastructure increases long-term property value.',
        cta: { label: 'Request Partnership', href: '/contact#contact-us' },
    },
];

export const CarginglocationsForDrivers = [
    {
        title: 'Retail Centers',
        image: '/assets/images/card-image-1.png',
    },
    {
        title: 'Hotels',
        image: '/assets/images/card-image-2.png',
    },
    {
        title: 'Office Buildings',
        image: '/assets/images/card-image-5.png',
    },
    {
        title: 'Residential Communities',
        image: '/assets/images/card-image-4.png',
    },
];

export const IdealLocationsForHosts = [
    {
        title: 'Hotels',
        image: '/assets/images/card-image-2.png',
    },
    {
        title: 'Retail Centers',
        image: '/assets/images/card-image-1.png',
    },
    {
        title: 'Office Buildings',
        image: '/assets/images/card-image-5.png',
    },
    {
        title: 'Residential Communities',
        image: '/assets/images/card-image-4.png',
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

export const AboutPageCorePrinciplesData = [
    {
        title: 'Mission',
        description:
            'Our mission is to make EV charging accessible and reliable everywhere.',
    },
    {
        title: 'Vision',
        description:
            'We believe the future of mobility depends on scalable charging infrastructure.',
    },
    {
        title: 'Future',
        description:
            'EV adoption is growing rapidly, and charging networks will play a critical role.',
    },
    {
        title: 'Sustainability',
        description:
            'Supporting the transition to clean transportation and sustainable infrastructure.',
    },
];


export const PolicyOptionsData = [
    {
        title: 'Intellectual Property',
        description:
            'All content on this website, including but not limited to text, graphics, logos, images, and design elements, is the property of WattUp USA',
        image: '/assets/images/policy-1.png',
    },
    {
        title: 'Limitation of Liability',
        description:
            'We strive to ensure that all information on this website is accurate and up to date. However, we make no guarantees regarding completeness',
        image: '/assets/images/policy-2.png',
    },
    {
        title: 'External Links',
        description:
            'This website may contain links to third-party websites. We are not responsible for the content, policies',
        image: '/assets/images/policy-3.png',
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













