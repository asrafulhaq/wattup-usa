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
export const HomePageBuiltForSlidesCardData: SlidesCardData[] = [
    {
        id: 'drivers',
        image: '/assets/images/shared/car1.png',
        title: 'For Drivers',
        description:
            'Find nearby charging stations, plug in, and get back on the road faster.',
        cta: { label: 'Find Charging Locations', href: '#' },
        imageClass: 'max-md:object-[14%_top]',
    },
    {
        id: 'hosts',
        image: '/assets/images/shared/car-2.png',
        title: 'For Hosts',
        description:
            'Install EV charging and attract high-value customers, tenants, and visitors.',
        cta: { label: 'Become a Host', href: '/contact#contact-us' },
        imageClass: 'max-md:object-[14%_top]',
    },
    {
        id: 'drivers-1',
        image: '/assets/images/shared/car1.png',
        title: 'For Drivers',
        description:
            'Find nearby charging stations, plug in, and get back on the road faster.',
        cta: { label: 'Find Charging Locations', href: '#' },
        imageClass: 'max-md:object-[14%_top]',
    },
    {
        id: 'hosts-1',
        image: '/assets/images/shared/car-2.png',
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
        image: '/assets/images/shared/how-it-works-1.png',
    },
    {
        title: 'Plug In',
        description:
            'Connect your EV and start charging instantly. Wait until the car charges',
        image: '/assets/images/shared/how-it-works-2.png',
    },
    {
        title: 'Charge & Go',
        description:
            'Fast, reliable charging so you can get back on the road quickly.',
        image: '/assets/images/shared/how-it-works-4.png',
    },
];

export const HomePagetechnologySlidesData: TechnologySlideData[] = [
    {
        number: '01.',
        title: 'Smart charging\ninfrastructure',
        description: 'Lorem ipsum dolor sit amet\nconsectetur',
        image: '/assets/images/home/technology-backed-1.png',
        mobileImage: '/assets/images/home/technology-backed-1-mobile.png',
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
        image: '/assets/images/home/technology-backed-2.png',
        mobileImage: '/assets/images/home/technology-backed-2-mobile.png',
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
        image: '/assets/images/home/technology-backed-3.png',
        mobileImage: '/assets/images/home/technology-backed-3-mobile.png',
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
        image: '/assets/images/home/why-image-1.png',
        title: 'Fast Charging',
        description:
            'High-performance charging stations designed for speed and reliability.',
        cta: { label: 'Find Charging Locations', href: '#' },
        imageClass: 'max-md:object-[70%_top]',
    },
    {
        id: 'premium-locations',
        image: '/assets/images/home/why-image-2.png',
        title: 'Premium Locations',
        description:
            'Charge where you already spend your time — shopping centers, hotels, and workplaces.',
        cta: { label: 'Find Charging Locations', href: '#' },
        imageClass: 'max-md:object-[70%_top]',
    },
    {
        id: 'symless-experience',
        image: '/assets/images/home/why-image-3.png',
        title: 'Seamless Experience',
        description: 'Simple access, easy payments, and reliable performance.',
        cta: { label: 'Find Charging Locations', href: '#' },
        imageClass: 'max-md:object-[90%_top]',
    },
    {
        id: 'smart-infrastructure',
        image: '/assets/images/home/why-image-4.png',
        title: 'Smart Infrastructure',
        description:
            'Built with advanced technology and monitored for maximum uptime.',
        cta: { label: 'Find Charging Locations', href: '#' },
        imageClass: 'max-md:object-[35%_top]',
    },
];

export const DriverPageHowItWorksStepData: HowItWorksStepData[] = [
    {
        title: 'Find a Station',
        description:
            'Locate a WattUp charging station near you using our network map.',
        image: '/assets/images/shared/how-it-works-1.png',
    },
    {
        title: 'Plug In',
        description:
            'Connect your EV and start charging instantly. Wait until the car charges',
        image: '/assets/images/shared/how-it-works-2.png',
    },
    {
        title: 'Charge & Go',
        description:
            'Fast, reliable charging so you can get back on the road quickly.',
        image: '/assets/images/shared/how-it-works-5.png',
    },
];
export const DriverPageWhyChooseSlideCardData: SlidesCardData[] = [
    {
        id: 'fast-charging',
        image: '/assets/images/drivers/driver-why-choose-1.png',
        mobileImage: '/assets/images/drivers/driver-why-choose-mobile-1.png',
        title: 'Fast Charging',
        description: 'Reliable high-performance stations.',
        cta: { label: 'Find Charging Locations', href: '#' },
        imageClass: 'max-md:object-[40%_top]',
    },
    {
        id: 'premium-locations',
        image: '/assets/images/drivers/driver-why-choose-2.png',
        title: 'Convenient Locations',
        description: (
            <>
                Charge where you <br className='md:hidden' /> already go.
            </>
        ),
        cta: { label: 'Find Charging Locations', href: '#' },
        imageClass: 'max-md:object-[25%_top]',
    },
    {
        id: 'symless-experience',
        image: '/assets/images/drivers/driver-why-choose-3.png',
        title: 'Reliable Network',
        description: 'Stations monitored for consistent performance.',
        cta: { label: 'Find Charging Locations', href: '#' },
        imageClass: 'max-md:object-[14%_top]',
    },
    {
        id: 'smart-infrastructure',
        image: '/assets/images/drivers/driver-why-choose-4.png',
        mobileImage: '/assets/images/drivers/driver-why-choose-mobile-4.png',
        title: 'Simple Experience',
        description: 'Easy access and seamless payments.',
        cta: { label: 'Find Charging Locations', href: '#' },
        imageClass: 'max-md:object-[60%_top]',
    },
];

export const HostPageWhyChooseSlideCardData: SlidesCardData[] = [
    {
        id: 'increase-property-value',
        image: '/assets/images/hosts/why-choose-1.png',
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
        image: '/assets/images/hosts/why-choose-2.png',
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
        image: '/assets/images/hosts/why-choose-3.png',
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
        image: '/assets/images/hosts/why-choose-4.png',
        mobileImage: '/assets/images/hosts/why-choose-mobile-4.png',
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
        image: '/assets/images/hosts/hosts-how-it-works-1.png',
    },
    {
        title: 'Installation',
        description: 'Professional charger installation.',
        image: '/assets/images/hosts/hosts-how-it-works-2.png',
        mobileImage: '/assets/images/hosts/hosts-how-it-works-mobile-2.png',
        imageClass: 'max-md:object-[70%_top]',
    },
    {
        title: 'Integration',
        description: 'Stations connected to the  WattUp network.',
        image: '/assets/images/hosts/hosts-how-it-works-3.png',
        mobileImage: '/assets/images/hosts/hosts-how-it-works-mobile-3.png',
    },
    {
        title: 'Ongoing Support',
        description: 'Continuous monitoring and support.',
        image: '/assets/images/hosts/hosts-how-it-works-4.png',
        mobileImage: '/assets/images/hosts/hosts-how-it-works-mobile-4.png',
    },
];

export const HostPageBenifitsCardsData: SlidesCardData[] = [
    {
        id: 'charging-revenue',
        image: '/assets/images/hosts/host-page-benifit-image-1.png',
        mobileImage:
            '/assets/images/hosts/host-page-benifit-image-mobile-1.png',
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
        image: '/assets/images/hosts/host-page-benifit-image-2.png',
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
        image: '/assets/images/hosts/host-page-benifit-image-3.png',
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
        image: '/assets/images/hosts/host-page-benifit-image-4.png',
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
        image: '/assets/images/shared/card-image-1.png',
    },
    {
        title: 'Hotels',
        image: '/assets/images/shared/card-image-2.png',
    },
    {
        title: 'Office Buildings',
        image: '/assets/images/shared/card-image-5.png',
    },
    {
        title: 'Residential Communities',
        image: '/assets/images/shared/card-image-4.png',
    },
];

export const IdealLocationsForHosts = [
    {
        title: 'Hotels',
        image: '/assets/images/shared/card-image-2.png',
    },
    {
        title: 'Retail Centers',
        image: '/assets/images/shared/card-image-1.png',
    },
    {
        title: 'Office Buildings',
        image: '/assets/images/shared/card-image-5.png',
    },
    {
        title: 'Residential Communities',
        image: '/assets/images/shared/card-image-4.png',
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
        image: '/assets/images/policy/policy-1.png',
    },
    {
        title: 'Limitation of Liability',
        description:
            'We strive to ensure that all information on this website is accurate and up to date. However, we make no guarantees regarding completeness',
        image: '/assets/images/policy/policy-2.png',
    },
    {
        title: 'External Links',
        description:
            'This website may contain links to third-party websites. We are not responsible for the content, policies',
        image: '/assets/images/policy/policy-3.png',
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
        answer: 'Charging time varies depending on your vehicle\'s battery size and the charger\'s speed, typically ranging from 30 minutes to a few hours.',
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
        answer: 'Charging time varies depending on your vehicle\'s battery size and the charger\'s speed, typically ranging from 30 minutes to a few hours.',
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





