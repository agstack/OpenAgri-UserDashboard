export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export const RISK_LEVELS: RiskLevel[] = ['low', 'moderate', 'high', 'critical'];

export interface BioParams {
    t_base?: number | null;
    t_lethal_min?: number | null;
    t_lethal_max?: number | null;
    t_optimal_min?: number | null;
    t_optimal_max?: number | null;
    min_streak?: number | null;
    pheno_frac_lo?: number | null;
    pheno_frac_hi?: number | null;
    pheno_frac_ref_gdd5?: number | null;
    pheno_lo?: number | null;
    pheno_hi?: number | null;
    min_wetness_hours_critical?: number | null;
    min_wetness_hours_high?: number | null;
}

export interface FuzzyRule {
    hum_lo?: number;
    hum_hi?: number;
    temp_lo?: number;
    temp_hi?: number;
    rain_min?: number;
    risk_level: RiskLevel;
    type?: string | null;
}

export interface ThreatModelDefinition {
    bio_params: BioParams;
    fuzzy_rules: FuzzyRule[];
}

export interface ThreatModel {
    id: string;
    scientific_name: string;
    common_name: string;
    label: string | null;
    note: string | null;
    definition: ThreatModelDefinition;
    crop_id: string;
}

export interface ThreatModelCreate {
    scientific_name: string;
    common_name: string;
    label?: string | null;
    note?: string | null;
    definition: ThreatModelDefinition;
    crop_id: string;
}

export interface ThreatModelUpdate {
    scientific_name?: string | null;
    common_name?: string | null;
    label?: string | null;
    note?: string | null;
    definition?: ThreatModelDefinition | null;
}
