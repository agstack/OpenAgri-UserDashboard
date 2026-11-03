import {
    BaseActivityModel,
    AddRawMaterialOperationModel,
    AnimalActivityModel,
    AnimalLactatingActivityModel,
    CompostOperationModel,
    CompostTurningOperationModel,
    CropGrowthStageObservationModel,
    CropProtectionOperationModel,
    CropStressIndicatorObservationModel,
    DiseaseDetectionModel,
    FertilizationOperationModel,
    GenericActivityModel,
    GenericAlertModel,
    GenericObservationModel,
    IrrigationOperationModel,
    SprayingRecommendationModel,
    VigorEstimationModel,
    YieldPredictionModel
} from '@models/FarmCalendarActivities';
import dayjs from 'dayjs';

const getEmptyBaseActivity = (id: string): BaseActivityModel => ({
    "@id": "",
    "@type": "",
    activityType: {
        "@id": `urn:farmcalendar:FarmCalendarActivityType:${id}`,
        "@type": "FarmCalendarActivityType"
    },
    title: "",
    details: ""
});


const getEmptyAddRawMaterialOperation = (id: string): AddRawMaterialOperationModel => ({
    ...getEmptyBaseActivity(id),
    "@type": "AddRawMaterialOperation",
    hasStartDatetime: dayjs().toISOString(),
    hasEndDatetime: dayjs().toISOString(),
    operatedOn: {
        "@id": "",
        "@type": "Parcel"
    },
    isPartOfActivity: null,
    responsibleAgent: null,
    usesAgriculturalMachinery: [],
    hasCompostMaterial: []
});

const getEmptyCompostOperation = (id: string): CompostOperationModel => ({
    ...getEmptyBaseActivity(id),
    "@type": "CompostOperation",
    hasStartDatetime: dayjs().toISOString(),
    hasEndDatetime: dayjs().toISOString(),
    responsibleAgent: null,
    usesAgriculturalMachinery: [],
    hasAgriParcel: {
        "@id": "",
        "@type": "Parcel"
    },
    isPartOfActivity: null,
    isOperatedOn: {
        "@id": "",
        "@type": "CompostPile"
    },
    hasNestedOperation: [],
    hasMeasurement: []
});

const getEmptyCompostTurningOperation = (id: string): CompostTurningOperationModel => ({
    ...getEmptyBaseActivity(id),
    "@type": "CompostTurningOperation",
    hasStartDatetime: dayjs().toISOString(),
    hasEndDatetime: dayjs().toISOString(),
    operatedOn: {
        "@id": "",
        "@type": "Parcel"
    },
    isPartOfActivity: null,
    responsibleAgent: null,
    usesAgriculturalMachinery: []
});

const getEmptyCropGrowthStageObservation = (id: string): CropGrowthStageObservationModel => ({
    ...getEmptyBaseActivity(id),
    "@type": "CropGrowthStageObservation",
    phenomenonTime: dayjs().toISOString(),
    hasEndDatetime: dayjs().toISOString(),
    madeBySensor: {
        "@id": "",
        "@type": "",
        name: ""
    },
    hasAgriParcel: {
        "@id": "",
        "@type": "Parcel"
    },
    isPartOfActivity: null,
    hasAgriCrop: {
        "@id": "",
        "@type": "FarmCrop"
    },
    hasResult: {
        "@id": "",
        "@type": "",
        unit: "",
        hasValue: ""
    },
    observedProperty: ""
});

const getEmptyCropProtectionOperation = (id: string): CropProtectionOperationModel => ({
    ...getEmptyBaseActivity(id),
    "@type": "CropProtectionOperation",
    hasStartDatetime: dayjs().toISOString(),
    hasEndDatetime: dayjs().toISOString(),
    responsibleAgent: null,
    usesAgriculturalMachinery: [],
    isPartOfActivity: null,
    hasAppliedAmount: {
        "@id": "",
        "@type": "",
        unit: "",
        numericValue: 0
    },
    usesPesticide: {
        "@id": "",
        "@type": "Pesticide"
    },
    operatedOn: {
        "@id": "",
        "@type": "Parcel"
    }
});

const getEmptyCropStressIndicatorObservation = (id: string): CropStressIndicatorObservationModel => ({
    ...getEmptyBaseActivity(id),
    "@type": "CropStressIndicatorObservation",
    phenomenonTime: dayjs().toISOString(),
    hasEndDatetime: dayjs().toISOString(),
    madeBySensor: {
        "@id": "",
        "@type": "",
        name: ""
    },
    hasAgriParcel: {
        "@id": "",
        "@type": "Parcel"
    },
    isPartOfActivity: null,
    hasAgriCrop: {
        "@id": "",
        "@type": "FarmCrop"
    },
    hasResult: {
        "@id": "",
        "@type": "",
        unit: "",
        hasValue: ""
    },
    observedProperty: ""
});

const getEmptyDiseaseDetection = (id: string): DiseaseDetectionModel => ({
    ...getEmptyBaseActivity(id),
    "@type": "DiseaseDetection",
    phenomenonTime: dayjs().toISOString(),
    hasEndDatetime: dayjs().toISOString(),
    madeBySensor: {
        "@id": "",
        "@type": "",
        name: ""
    },
    hasAgriParcel: {
        "@id": "",
        "@type": "Parcel"
    },
    isPartOfActivity: null,
    hasArea: "",
    hasResult: {
        "@id": "",
        "@type": "",
        unit: "",
        hasValue: ""
    },
    observedProperty: ""
});

const getEmptyFertilizationOperation = (id: string): FertilizationOperationModel => ({
    ...getEmptyBaseActivity(id),
    "@type": "FertilizationOperation",
    hasStartDatetime: dayjs().toISOString(),
    hasEndDatetime: dayjs().toISOString(),
    responsibleAgent: null,
    usesAgriculturalMachinery: [],
    isPartOfActivity: null,
    hasAppliedAmount: {
        "@id": "",
        "@type": "",
        unit: "",
        numericValue: 0
    },
    hasApplicationMethod: "",
    usesFertilizer: {
        "@id": "",
        "@type": "Fertilizer"
    },
    operatedOn: {
        "@id": "",
        "@type": "Parcel"
    }
});

const getEmptyGenericActivity = (id: string): GenericActivityModel => ({
    ...getEmptyBaseActivity(id),
    "@type": "FarmCalendarActivity",
    hasStartDatetime: dayjs().toISOString(),
    hasEndDatetime: dayjs().toISOString(),
    hasAgriParcel: {
        "@id": "",
        "@type": "Parcel"
    },
    isPartOfActivity: null,
    responsibleAgent: null,
    usesAgriculturalMachinery: []
});

const getEmptyGenericAlert = (id: string): GenericAlertModel => ({
    ...getEmptyBaseActivity(id),
    "@type": "Alert",
    severity: "",
    hasAgriParcel: {
        "@id": "",
        "@type": "Parcel"
    },
    validFrom: dayjs().toISOString(),
    validTo: dayjs().toISOString(),
    dateIssued: "",
    quantityValue: {},
    relatedObservation: null
});

const getEmptyGenericObservation = (id: string): GenericObservationModel => ({
    ...getEmptyBaseActivity(id),
    "@type": "Observation",
    phenomenonTime: dayjs().toISOString(),
    hasEndDatetime: dayjs().toISOString(),
    hasAgriParcel: {
        "@id": "",
        "@type": "Parcel"
    },
    isPartOfActivity: null,
    madeBySensor: {
        "@id": "",
        "@type": "",
        name: ""
    },
    hasResult: {
        "@id": "",
        "@type": "",
        unit: "",
        hasValue: ""
    },
    observedProperty: ""
});

const getEmptyIrrigationOperation = (id: string): IrrigationOperationModel => ({
    ...getEmptyBaseActivity(id),
    "@type": "IrrigationOperation",
    hasStartDatetime: dayjs().toISOString(),
    hasEndDatetime: dayjs().toISOString(),
    responsibleAgent: null,
    usesAgriculturalMachinery: [],
    isPartOfActivity: null,
    hasAppliedAmount: {
        "@id": "",
        "@type": "",
        unit: "",
        numericValue: 0
    },
    usesIrrigationSystem: "",
    operatedOn: {
        "@id": "",
        "@type": "Parcel"
    }
});

const getEmptySprayingRecommendation = (id: string): SprayingRecommendationModel => ({
    ...getEmptyBaseActivity(id),
    "@type": "SprayingRecommendation",
    phenomenonTime: dayjs().toISOString(),
    hasEndDatetime: dayjs().toISOString(),
    madeBySensor: {
        "@id": "",
        "@type": "",
        name: ""
    },
    hasAgriParcel: {
        "@id": "",
        "@type": "Parcel"
    },
    isPartOfActivity: null,
    hasArea: "",
    hasResult: {
        "@id": "",
        "@type": "",
        unit: "",
        hasValue: ""
    },
    observedProperty: "",
    usesPesticide: {
        "@id": "",
        "@type": "Pesticide"
    }
});

const getEmptyVigorEstimation = (id: string): VigorEstimationModel => ({
    ...getEmptyBaseActivity(id),
    "@type": "VigorEstimation",
    phenomenonTime: dayjs().toISOString(),
    hasEndDatetime: dayjs().toISOString(),
    madeBySensor: {
        "@id": "",
        "@type": "",
        name: ""
    },
    hasAgriParcel: {
        "@id": "",
        "@type": "Parcel"
    },
    isPartOfActivity: null,
    hasArea: "",
    hasResult: {
        "@id": "",
        "@type": "",
        unit: "",
        hasValue: ""
    },
    observedProperty: ""
});

const getEmptyYieldPrediction = (id: string): YieldPredictionModel => ({
    ...getEmptyBaseActivity(id),
    "@type": "YieldPrediction",
    phenomenonTime: dayjs().toISOString(),
    hasEndDatetime: dayjs().toISOString(),
    madeBySensor: {
        "@id": "",
        "@type": "",
        name: ""
    },
    hasAgriParcel: {
        "@id": "",
        "@type": "Parcel"
    },
    isPartOfActivity: null,
    hasArea: "",
    hasResult: {
        "@id": "",
        "@type": "",
        unit: "",
        hasValue: ""
    },
    observedProperty: ""
});


const emptyMeasurement = () => ({
    "@id": "",
    "@type": "",
    unit: "",
    hasValue: "",
});

const getEmptyAnimalActivity = (id: string): AnimalActivityModel => ({
    ...getEmptyBaseActivity(id),
    "@type": "AnimalActivity",
    hasStartDatetime: dayjs().toISOString(),
    hasEndDatetime: dayjs().toISOString(),
    hasAgriParcel: {
        "@id": "",
        "@type": "Parcel"
    },
    hasAnimal: {
        "@id": "",
        "@type": "Animal"
    },
    responsibleAgent: null,
    usesAgriculturalMachinery: [],
    isPartOfActivity: null,
});

const getEmptyAnimalLactatingActivity = (id: string): AnimalLactatingActivityModel => ({
    ...getEmptyBaseActivity(id),
    "@type": "AnimalLactatingActivity",
    hasStartDatetime: dayjs().toISOString(),
    hasEndDatetime: dayjs().toISOString(),
    hasAgriParcel: {
        "@id": "",
        "@type": "Parcel"
    },
    hasAnimal: {
        "@id": "",
        "@type": "Animal"
    },
    responsibleAgent: null,
    usesAgriculturalMachinery: [],
    isPartOfActivity: null,
    hasDaysInMilk: "",
    hasLactationNumber: "",
    hasControl: "",
    hasTotalMilkYield: emptyMeasurement(),
    hasMilkYield: emptyMeasurement(),
    hasRCS: emptyMeasurement(),
    hasUrea: emptyMeasurement(),
    hasFat: emptyMeasurement(),
    hasProtein: emptyMeasurement(),
    hasDryMatter: emptyMeasurement(),
});

export const activityModelFactory: Record<string, (id: string) => BaseActivityModel> = {
    "/api/v1/YieldPrediction/": getEmptyYieldPrediction,
    "/api/v1/VigorEstimation/": getEmptyVigorEstimation,
    "/api/v1/Observations/": getEmptyGenericObservation,
    "/api/v1/SprayingRecommendation/": getEmptySprayingRecommendation,
    "/api/v1/CropProtectionOperations/": getEmptyCropProtectionOperation,
    "/api/v1/IrrigationOperations/": getEmptyIrrigationOperation,
    "/api/v1/FertilizationOperations/": getEmptyFertilizationOperation,
    "/api/v1/DiseaseDetection/": getEmptyDiseaseDetection,
    "/api/v1/Alerts/": getEmptyGenericAlert,
    "/api/v1/FarmCalendarActivities/": getEmptyGenericActivity,
    "/api/v1/CropStressIndicatorObservations/": getEmptyCropStressIndicatorObservation,
    "/api/v1/CropGrowthStageObservations/": getEmptyCropGrowthStageObservation,
    "/api/v1/CompostTurningOperations/": getEmptyCompostTurningOperation,
    "/api/v1/CompostOperations/": getEmptyCompostOperation,
    "/api/v1/AddRawMaterialOperations/": getEmptyAddRawMaterialOperation,
    "/api/v1/AnimalActivities/": getEmptyAnimalActivity,
    "/api/v1/AnimalLactatingActivities/": getEmptyAnimalLactatingActivity,
};