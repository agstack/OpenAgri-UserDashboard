export interface PesticideModel {
    "@id": string,
    "@type": string
    dateCreated: string,
    dateModified: string,
    hasCommercialName: string,
    description: string,
    hasCost: string,
    isPricePer: string,
    hasActiveSubstance: string,
    isTargetedTowards: string,
    hasPreharvestInterval: number,
    status: number,
    invalidatedAtTime: string | null,
}