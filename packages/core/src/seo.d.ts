/**
 * @file seo.ts
 * @description Programmatic SEO schemas, OpenGraph helpers, and JSON-LD structured data generators.
 */
export interface ToolSeoConfig {
    slug: string;
    title: string;
    metaTitle: string;
    metaDescription: string;
    canonicalUrl: string;
    keywords: string[];
    features: string[];
    howToSteps: {
        name: string;
        text: string;
    }[];
    faqs: {
        question: string;
        answer: string;
    }[];
}
export declare const TOOL_REGISTRY: Record<string, ToolSeoConfig>;
/**
 * Generates JSON-LD Structured Data for Google Search Engine Optimization
 */
export declare function generateToolJsonLd(config: ToolSeoConfig): {
    webAppSchema: {
        '@context': string;
        '@type': string;
        name: string;
        applicationCategory: string;
        operatingSystem: string;
        url: string;
        description: string;
        offers: {
            '@type': string;
            price: string;
            priceCurrency: string;
        };
    };
    howToSchema: {
        '@context': string;
        '@type': string;
        name: string;
        step: {
            '@type': string;
            position: number;
            name: string;
            text: string;
        }[];
    };
    faqSchema: {
        '@context': string;
        '@type': string;
        mainEntity: {
            '@type': string;
            name: string;
            acceptedAnswer: {
                '@type': string;
                text: string;
            };
        }[];
    };
};
//# sourceMappingURL=seo.d.ts.map