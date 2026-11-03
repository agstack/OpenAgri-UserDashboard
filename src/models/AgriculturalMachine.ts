export interface AgriculturalMachine {
    "@id": string;
    "@type": string;
    name: string;
    description: string;
    hasAgriParcel: {
        "@id": string;
        "@type": string;
    };
    purchase_date: string;
    manufacturer: string;
    model: string;
    seria_number: string;
    status: number;
    invalidatedAtTime: string;
    dateCreated: string;
    dateModified: string;
}