export type RiskClass = 'Low' | 'Moderate' | 'High' | 'Out of season';

export interface FuzzyRiskForecastRow {
    date: string;
    scientific_name: string;
    common_name: string;
    risk_score: number;
    risk_class: RiskClass | string;
    detail: string;
}

export type FuzzyRiskForecastResponse = FuzzyRiskForecastRow[];
