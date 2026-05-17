type JsonLdSchema = Record<string, unknown>;

export function JsonLd({ schema }: { schema: JsonLdSchema }) {
    return (
        <script
            type='application/ld+json'
            dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
    );
}

export function buildOrganizationSchema(opts: {
    name: string;
    url: string;
    description: string;
    phone?: string;
    email?: string;
    address?: string;
    logoUrl?: string;
    twitter?: string;
    linkedin?: string;
    facebook?: string;
    instagram?: string;
}): JsonLdSchema {
    const sameAs = [
        opts.twitter,
        opts.linkedin,
        opts.facebook,
        opts.instagram,
    ].filter(Boolean);

    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        '@id': `${opts.url}/#organization`,
        name: opts.name,
        url: opts.url,
        description: opts.description,
        ...(opts.phone && { telephone: opts.phone }),
        ...(opts.email && { email: opts.email }),
        ...(opts.address && {
            address: {
                '@type': 'PostalAddress',
                streetAddress: opts.address,
            },
        }),
        ...(opts.logoUrl && {
            logo: {
                '@type': 'ImageObject',
                url: opts.logoUrl,
            },
        }),
        ...(sameAs.length > 0 && { sameAs }),
    };
}

export function buildWebSiteSchema(opts: {
    name: string;
    url: string;
    description: string;
}): JsonLdSchema {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${opts.url}/#website`,
        name: opts.name,
        url: opts.url,
        description: opts.description,
        publisher: { '@id': `${opts.url}/#organization` },
        potentialAction: {
            '@type': 'SearchAction',
            target: {
                '@type': 'EntryPoint',
                urlTemplate: `${opts.url}/press-release?q={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
        },
        inLanguage: 'en-US',
    };
}

export function buildServiceSchema(opts: {
    orgUrl: string;
    orgName: string;
}): JsonLdSchema {
    return {
        '@context': 'https://schema.org',
        '@type': 'Service',
        '@id': `${opts.orgUrl}/#ev-charging-service`,
        name: 'EV Charging Installation & Network',
        provider: { '@id': `${opts.orgUrl}/#organization` },
        description:
            'Commercial and residential EV charging station installation, network management, and 24/7 driver access services across the United States.',
        serviceType: 'Electric Vehicle Charging',
        areaServed: { '@type': 'Country', name: 'United States' },
        hasOfferCatalog: {
            '@type': 'OfferCatalog',
            name: 'EV Charging Services',
            itemListElement: [
                {
                    '@type': 'Offer',
                    itemOffered: {
                        '@type': 'Service',
                        name: 'Property Host EV Charging',
                        description:
                            'Install and manage EV charging stations on your property.',
                    },
                },
                {
                    '@type': 'Offer',
                    itemOffered: {
                        '@type': 'Service',
                        name: 'Fleet EV Charging',
                        description:
                            'Dedicated EV charging solutions for commercial fleets.',
                    },
                },
                {
                    '@type': 'Offer',
                    itemOffered: {
                        '@type': 'Service',
                        name: 'Driver Access Network',
                        description:
                            'Find and use WattUp charging stations across the country.',
                    },
                },
            ],
        },
    };
}
