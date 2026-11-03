export interface FarmCropModel {
    '@id': string;
    '@type': string;
    cropSpecies: {
        "@id": string;
        "@type": string;
        "name": string;
        "variety": string;
    };
    status: number;
    invalidatedAtTime: string | null;
    dateCreated: string;
    dateModified: string;
    name: string;
    description: string | null;
    hasAgriParcel: {
        "@id": string;
        "@type": string;
    };
    growth_stage: string | null;
    kc_init: string | null;
    kc_mid: string | null;
    kc_end: string | null;
}
