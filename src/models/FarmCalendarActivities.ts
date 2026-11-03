export interface BaseActivityModel {
    "@id": string;
    "@type": string;
    activityType: {
        "@id": string;
        "@type": string;
    };
    title: string;
    details: string;
}

export interface AddRawMaterialOperationModel extends BaseActivityModel {
    hasStartDatetime: string;
    hasEndDatetime: string;
    operatedOn: {
        "@id": string;
        "@type": string;
    };
    isPartOfActivity: {
        "@id": string;
        "@type": string;
    } | null;
    responsibleAgent: string | null;
    usesAgriculturalMachinery: {
        "@id": string;
        "@type": string;
    }[];
    hasCompostMaterial: {
        "@id": string;
        "@type": string;
        typeName: string;
        quantityValue: {
            "@id": string;
            "@type": string;
            unit: string;
            numericValue: number;
        };
    }[];
}

export interface CompostOperationModel extends BaseActivityModel {
    hasStartDatetime: string;
    hasEndDatetime: string;
    responsibleAgent: string | null;
    usesAgriculturalMachinery: {
        "@id": string;
        "@type": string;
    }[];
    hasAgriParcel: {
        "@id": string;
        "@type": string;
    };
    isPartOfActivity: {
        "@id": string;
        "@type": string;
    } | null;
    isOperatedOn: {
        "@id": string;
        "@type": string;
    };
    hasNestedOperation: {
        "@id": string;
        "@type": string;
    }[];
    hasMeasurement: {
        "@id": string;
        "@type": string;
    }[];
}

export interface CompostTurningOperationModel extends BaseActivityModel {
    hasStartDatetime: string;
    hasEndDatetime: string;
    operatedOn: {
        "@id": string;
        "@type": string;
    };
    isPartOfActivity: {
        "@id": string;
        "@type": string;
    } | null;
    responsibleAgent: string | null;
    usesAgriculturalMachinery: {
        "@id": string;
        "@type": string;
    }[];
}

export interface CropGrowthStageObservationModel extends BaseActivityModel {
    phenomenonTime: string;
    hasEndDatetime: string;
    madeBySensor: {
        "@id": string;
        "@type": string;
        name: string;
    };
    hasAgriParcel: {
        "@id": string;
        "@type": string;
    };
    isPartOfActivity: {
        "@id": string;
        "@type": string;
    } | null;
    hasAgriCrop: {
        "@id": string;
        "@type": string;
    };
    hasResult: {
        "@id": string;
        "@type": string;
        unit: string;
        hasValue: string;
    };
    observedProperty: string;
}

export interface CropProtectionOperationModel extends BaseActivityModel {
    hasStartDatetime: string;
    hasEndDatetime: string;
    responsibleAgent: string | null;
    usesAgriculturalMachinery: {
        "@id": string;
        "@type": string;
    }[];
    isPartOfActivity: {
        "@id": string;
        "@type": string;
    } | null;
    hasAppliedAmount: {
        "@id": string;
        "@type": string;
        unit: string;
        numericValue: number;
    };
    usesPesticide: {
        "@id": string;
        "@type": string;
    };
    operatedOn: {
        "@id": string;
        "@type": string;
    };
}

export interface CropStressIndicatorObservationModel extends BaseActivityModel {
    phenomenonTime: string;
    hasEndDatetime: string;
    madeBySensor: {
        "@id": string;
        "@type": string;
        name: string;
    };
    hasAgriParcel: {
        "@id": string;
        "@type": string;
    };
    isPartOfActivity: {
        "@id": string;
        "@type": string;
    } | null;
    hasAgriCrop: {
        "@id": string;
        "@type": string;
    };
    hasResult: {
        "@id": string;
        "@type": string;
        unit: string;
        hasValue: string;
    };
    observedProperty: string;
}

export interface DiseaseDetectionModel extends BaseActivityModel {
    phenomenonTime: string;
    hasEndDatetime: string;
    madeBySensor: {
        "@id": string;
        "@type": string;
        name: string;
    };
    hasAgriParcel: {
        "@id": string;
        "@type": string;
    };
    isPartOfActivity: {
        "@id": string;
        "@type": string;
    } | null;
    hasArea: string;
    hasResult: {
        "@id": string;
        "@type": string;
        unit: string;
        hasValue: string;
    };
    observedProperty: string;
}

export interface FertilizationOperationModel extends BaseActivityModel {
    hasStartDatetime: string;
    hasEndDatetime: string;
    responsibleAgent: string | null;
    usesAgriculturalMachinery: {
        "@id": string;
        "@type": string;
    }[];
    isPartOfActivity: {
        "@id": string;
        "@type": string;
    } | null;
    hasAppliedAmount: {
        "@id": string;
        "@type": string;
        unit: string;
        numericValue: number;
    };
    hasApplicationMethod: string;
    usesFertilizer: {
        "@id": string;
        "@type": string;
    };
    operatedOn: {
        "@id": string;
        "@type": string;
    };
}

export interface GenericActivityModel extends BaseActivityModel {
    hasStartDatetime: string;
    hasEndDatetime: string;
    hasAgriParcel: {
        "@id": string;
        "@type": string;
    };
    isPartOfActivity: {
        "@id": string;
        "@type": string;
    } | null;
    responsibleAgent: string | null;
    usesAgriculturalMachinery: {
        "@id": string;
        "@type": string;
    }[];
}

export interface GenericAlertModel extends BaseActivityModel {
    severity: string;
    hasAgriParcel: {
        "@id": string;
        "@type": string;
    };
    validFrom: string;
    validTo: string;
    dateIssued: string;
    quantityValue: {};
    relatedObservation: {
        "@id": string;
        "@type": string;
    } | null;
}

export interface GenericAlertOptions {
    actions: {
        POST: {
            severity: {
                choices: {
                    value: string,
                    display_name: string
                }[]
            }
        }
    }
}

export interface GenericObservationModel extends BaseActivityModel {
    phenomenonTime: string;
    hasEndDatetime: string;
    hasAgriParcel: {
        "@id": string;
        "@type": string;
    };
    isPartOfActivity: {
        "@id": string;
        "@type": string;
    } | null;
    madeBySensor: {
        "@id": string;
        "@type": string;
        name: string;
    };
    hasResult: {
        "@id": string;
        "@type": string;
        unit: string;
        hasValue: string;
    };
    observedProperty: string;
}

export interface IrrigationOperationModel extends BaseActivityModel {
    hasStartDatetime: string;
    hasEndDatetime: string;
    responsibleAgent: string | null;
    usesAgriculturalMachinery: {
        "@id": string;
        "@type": string;
    }[];
    isPartOfActivity: {
        "@id": string;
        "@type": string;
    } | null;
    hasAppliedAmount: {
        "@id": string;
        "@type": string;
        unit: string;
        numericValue: number;
    };
    usesIrrigationSystem: string;
    operatedOn: {
        "@id": string;
        "@type": string;
    };
}

export interface IrrigationOperationOptions {
    actions: {
        POST: {
            usesIrrigationSystem: {
                choices: {
                    value: string,
                    display_name: string
                }[]
            }
        }
    }
}

export interface SprayingRecommendationModel extends BaseActivityModel {
    phenomenonTime: string;
    hasEndDatetime: string;
    madeBySensor: {
        "@id": string;
        "@type": string;
        name: string;
    };
    hasAgriParcel: {
        "@id": string;
        "@type": string;
    };
    isPartOfActivity: {
        "@id": string;
        "@type": string;
    } | null;
    hasArea: string;
    hasResult: {
        "@id": string;
        "@type": string;
        unit: string;
        hasValue: string;
    };
    observedProperty: string;
    usesPesticide: {
        "@id": string;
        "@type": string;
    };
}

export interface VigorEstimationModel extends BaseActivityModel {
    phenomenonTime: string;
    hasEndDatetime: string;
    madeBySensor: {
        "@id": string;
        "@type": string;
        name: string;
    };
    hasAgriParcel: {
        "@id": string;
        "@type": string;
    };
    isPartOfActivity: {
        "@id": string;
        "@type": string;
    } | null;
    hasArea: string;
    hasResult: {
        "@id": string;
        "@type": string;
        unit: string;
        hasValue: string;
    };
    observedProperty: string;
}

export interface YieldPredictionModel extends BaseActivityModel {
    phenomenonTime: string;
    hasEndDatetime: string;
    madeBySensor: {
        "@id": string;
        "@type": string;
        name: string;
    };
    hasAgriParcel: {
        "@id": string;
        "@type": string;
    };
    isPartOfActivity: {
        "@id": string;
        "@type": string;
    } | null;
    hasArea: string;
    hasResult: {
        "@id": string;
        "@type": string;
        unit: string;
        hasValue: string;
    };
    observedProperty: string;
}

interface AnimalActivityBase extends BaseActivityModel {
    hasStartDatetime: string;
    hasEndDatetime: string;
    hasAgriParcel: {
        "@id": string;
        "@type": string;
    };
    hasAnimal: {
        "@id": string;
        "@type": string;
    };
    responsibleAgent: string | null;
    usesAgriculturalMachinery: {
        "@id": string;
        "@type": string;
    }[];
    isPartOfActivity: {
        "@id": string;
        "@type": string;
    } | null;
}

export interface AnimalActivityModel extends AnimalActivityBase {}

interface MeasurementValue {
    "@id": string;
    "@type": string;
    unit: string;
    hasValue: string;
}

export interface AnimalLactatingActivityModel extends AnimalActivityBase {
    hasDaysInMilk: string;
    hasLactationNumber: string;
    hasControl: string;
    hasTotalMilkYield: MeasurementValue;
    hasMilkYield: MeasurementValue;
    hasRCS: MeasurementValue;
    hasUrea: MeasurementValue;
    hasFat: MeasurementValue;
    hasProtein: MeasurementValue;
    hasDryMatter: MeasurementValue;
}