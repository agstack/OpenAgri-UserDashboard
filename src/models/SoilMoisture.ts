export interface DatasetRow {
    dataset_id: string;
    date: string;
    soil_moisture_10: number;
    soil_moisture_20: number;
    soil_moisture_30: number;
    soil_moisture_40: number;
    soil_moisture_50: number;
    soil_moisture_60: number;
    rain: number;
    temperature: number;
    humidity: number;

    [key: string]: any; // Needed for chart
};

export interface DatasetResponse {
    data_points: DatasetRow[];
    high_dose_irrigation_days: string[];
    field_capacity: number;
    stress_level: number;
    wilting_point: number;
}

export interface SoilMoistureResponseJSONLD {
    '@context': string[];
    '@graph': SoilMoistureGraphEntry[];
};

interface SoilMoistureGraphEntry {
    '@id': string;
    '@type': string;
    'description': string;
    'duringPeriod': {
        '@id': string;
        '@type': string;
        'hasBeginning': {
            '@id': string;
            '@type': string;
            'inXSDDateTime': string;
        };
        'hasEnd': {
            '@id': string;
            '@type': string;
            'inXSDDateTime': string;
        };
    };
    'irrigationAnalysis': {
        '@id': string;
        '@type': string;
        'hasHighDoseIrrigationOperationDates': any; // TODO: proper model
        'numberOfHighDoseIrrigationOperations': number;
        'numberOfIrrigationOperations': number;
    };
    'numberOfPrecipitationEvents': number;
    'saturationAnalysis': {
        '@id': string;
        '@type': string;
        'hasFieldCapacities': any // TODO: proper model
        'hasSaturationDates': any // TODO: proper model
        'numberOfSaturationDays': number;
    };
    'stressAnalysis': {
        '@id': string;
        '@type': string;
        'numberOfStressDays': number;
        'hasStressDates': string[][];
        'hasStressLevels': {
            '@id': string;
            '@type': string;
            'numericValue': number;
            'unit': string;
            'atDepth': {
                '@id': string;
                '@type': string;
                'hasNumericValue': string;
                'hasUnit': string;
            };
        }[][];
    };
}

export interface SoilMoistureResponseJSON {

    "dataset_id": string,
    "time_period": string[],
    "irrigation_events_detected": number,
    "precipitation_events": number,
    "high_dose_irrigation_events": number,
    "high_dose_irrigation_events_dates": string[],
    "field_capacity": number,
    "stress_level": number,
    "number_of_saturation_days": number,
    "saturation_dates": string[],
    "no_of_stress_days": number,
    "stress_dates": string[]

}