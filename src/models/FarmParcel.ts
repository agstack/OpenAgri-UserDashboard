export interface FarmParcelModel {
    '@type': string,
    '@id': string,
    'status': any, // TODO: change, it was a number but it could be a string
    'deleted_at': string | null,
    'created_at': string,
    'updated_at': string,
    'identifier': string,
    'description': string,
    'validFrom': string,
    'validTo': string,
    'area': string,
    'hasIrrigationFlow': string,
    'category': string,
    'inRegion': string,
    'hasToponym': string,
    'isNitroArea': boolean,
    'isNatura2000Area': boolean,
    'isPdopgArea': boolean,
    'isIrrigated': boolean,
    'isCultivatedInLevels': boolean,
    'isGroundSlope': boolean,
    'depiction': string | null,
    'hasGeometry': {
        '@id': string,
        '@type': string,
        'asWKT': string
    },
    'location': {
        '@id': string,
        '@type': string,
        'lat': number | null,
        'long': number | null
    },
    'hasAgriCrop': any[],
    'farm': {
        '@type': string,
        '@id': string
    }
}