export interface FertilizerModel {
    "@id": string;
    "@type": string;
    hasCommercialName: string;
    description: string;
    hasCost: string;
    isPricePer: string;
    hasActiveSubstance: string;
    isTargetedTowards: string;
    hasNutrientConcentration: string;
    status: number;
    dateCreated: string;
    dateModified: string;
    invalidatedAtTime: string;
}