import { AddRawMaterialOperationModel, BaseActivityModel, GenericAlertOptions, IrrigationOperationOptions } from "@models/FarmCalendarActivities";
import { ActivityDynamicCRUDActionsProps } from "./ActivityDynamicCRUDActions.types";
import { Box, Button, Card, CardContent, IconButton, List, ListItem, ListItemButton, ListItemText, MenuItem, Stack, TextField, Typography } from "@mui/material";
import dayjs, { Dayjs } from "dayjs";
import { useEffect, useRef, useState } from "react";
import { DateTimePicker } from "@mui/x-date-pickers";
import GenericSelect from "@components/shared/GenericSelect/GenericSelect";
import { FarmParcelModel } from "@models/FarmParcel";
import { FarmCropModel } from "@models/FarmCrop";
import { FarmAnimalModel } from "@models/FarmAnimalModel";

import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import useDialog from "@hooks/useDialog";
import GenericDialog from "@components/shared/GenericDialog/GenericDialog";
import { AgriculturalMachine } from "@models/AgriculturalMachine";
import { PesticideModel } from "@models/Pesticide";
import { FertilizerModel } from "@models/Fertilizer";

import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { FarmCalendarActivityModel } from "@models/FarmCalendarActivity";
import useFetch from "@hooks/useFetch";
import { useNavigate } from "react-router-dom";
import { useSession } from "@contexts/SessionContext";

const REQUIRED_KEYS_BY_TYPE: Record<string, Set<string>> = {
    AddRawMaterialOperation: new Set([
        'title', 'responsibleAgent', 'hasStartDatetime', 'operatedOn', 'hasCompostMaterial',
    ]),
    CompostOperation: new Set([
        'title', 'responsibleAgent', 'hasStartDatetime', 'isOperatedOn',
    ]),
    CompostTurningOperation: new Set([
        'title', 'responsibleAgent', 'hasStartDatetime', 'operatedOn',
    ]),
    CropGrowthStageObservation: new Set([
        'title', 'phenomenonTime', 'madeBySensor.name', 'hasAgriCrop',
        'hasResult.hasValue', 'hasResult.unit', 'observedProperty',
    ]),
    CropProtectionOperation: new Set([
        'title', 'responsibleAgent', 'hasStartDatetime', 'operatedOn',
        'hasAppliedAmount.numericValue', 'hasAppliedAmount.unit', 'usesPesticide',
    ]),
    CropStressIndicatorObservation: new Set([
        'title', 'phenomenonTime', 'madeBySensor.name', 'hasAgriCrop',
        'hasResult.hasValue', 'hasResult.unit', 'observedProperty',
    ]),
    DiseaseDetection: new Set([
        'title', 'phenomenonTime', 'madeBySensor.name', 'hasArea',
        'hasResult.hasValue', 'hasResult.unit', 'observedProperty',
    ]),
    FertilizationOperation: new Set([
        'title', 'responsibleAgent', 'hasStartDatetime', 'operatedOn',
        'hasAppliedAmount.numericValue', 'hasAppliedAmount.unit',
        'hasApplicationMethod', 'usesFertilizer',
    ]),
    FarmCalendarActivity: new Set([
        'title', 'responsibleAgent', 'hasStartDatetime',
    ]),
    Alert: new Set([
        'title', 'validFrom', 'validTo', 'relatedObservation', 'severity',
    ]),
    Observation: new Set([
        'title', 'phenomenonTime', 'madeBySensor.name',
        'hasResult.hasValue', 'hasResult.unit', 'observedProperty',
    ]),
    IrrigationOperation: new Set([
        'title', 'responsibleAgent', 'hasStartDatetime', 'operatedOn',
        'hasAppliedAmount.numericValue', 'hasAppliedAmount.unit', 'usesIrrigationSystem',
    ]),
    SprayingRecommendation: new Set([
        'title', 'phenomenonTime', 'madeBySensor.name', 'hasArea',
        'hasResult.hasValue', 'hasResult.unit', 'observedProperty', 'usesPesticide',
    ]),
    VigorEstimation: new Set([
        'title', 'phenomenonTime', 'madeBySensor.name', 'hasArea',
        'hasResult.hasValue', 'hasResult.unit', 'observedProperty',
    ]),
    YieldPrediction: new Set([
        'title', 'phenomenonTime', 'madeBySensor.name', 'hasArea',
        'hasResult.hasValue', 'hasResult.unit', 'observedProperty',
    ]),
    AnimalActivity: new Set([
        'title', 'responsibleAgent', 'hasStartDatetime', 'hasAnimal',
    ]),
    AnimalLactatingActivity: new Set([
        'title', 'responsibleAgent', 'hasStartDatetime', 'hasAnimal',
        'hasDaysInMilk', 'hasLactationNumber', 'hasControl',
        'hasTotalMilkYield.hasValue', 'hasTotalMilkYield.unit',
        'hasMilkYield.hasValue', 'hasMilkYield.unit',
        'hasRCS.hasValue', 'hasRCS.unit',
        'hasUrea.hasValue', 'hasUrea.unit',
        'hasFat.hasValue', 'hasFat.unit',
        'hasProtein.hasValue', 'hasProtein.unit',
        'hasDryMatter.hasValue', 'hasDryMatter.unit',
    ]),
};

const ActivityDynamicCRUDActions = <T extends BaseActivityModel>({ activity, activityTypes, onAdd, onDelete, onSave, loading, canEdit, canDelete }: ActivityDynamicCRUDActionsProps<T>) => {
    const navigate = useNavigate();
    const { session } = useSession();
    const preselectedParcelId = session?.farm_parcel?.["@id"].split(':').pop() ?? '';

    const [formData, setFormData] = useState<T>(activity);
    const requiredKeys = REQUIRED_KEYS_BY_TYPE[formData['@type']] ?? new Set<string>();
    const isReq = (key: string) => requiredKeys.has(key);
    const [selectedParcel, setSelectedParcel] = useState<string>(preselectedParcelId);
    const [selectedAgriCrop, setSelectedAgriCrop] = useState<string>('');
    const [selectedAgriMachines, setSelectedAgriMachines] = useState<string[]>([]);
    const [operatedOnCompostPile, setOperatedOnCompostPile] = useState<string>('');
    const [selectedPesticide, setSelectedPesticide] = useState<string>('');
    const [selectedFertilizer, setSelectedFertilizer] = useState<string>('');
    const [parentActivity, setParentActivity] = useState<string>('');
    const [severity, setSeverity] = useState<string>('');
    const [usesIrrigationSystem, setUsesIrrigationSystem] = useState<string>('');
    const [selectedAnimal, setSelectedAnimal] = useState<string>('');

    /** All calendar activities section start */
    const [allActivities, setAllActivities] = useState<FarmCalendarActivityModel[]>([]);
    const [allObservations, setAllObservations] = useState<FarmCalendarActivityModel[]>([]);

    const { fetchData: fetchDataAllActivities, response: responseAllActivities } = useFetch<FarmCalendarActivityModel[]>(
        `proxy/farmcalendar/api/v1/FarmCalendarActivities/?format=json`,
        {
            method: 'GET',
        }
    );

    const { fetchData: fetchDataAllObservations, response: responseAllObservations } = useFetch<FarmCalendarActivityModel[]>(
        `proxy/farmcalendar/api/v1/Observations/?format=json`,
        {
            method: 'GET',
        }
    );

    useEffect(() => {
        if (responseAllActivities) {
            setAllActivities(responseAllActivities);
        }
    }, [responseAllActivities])

    useEffect(() => {
        if (responseAllObservations) {
            setAllObservations(responseAllObservations);
        }
    }, [responseAllObservations])
    /** All calendar activities section end */

    /** Parcel-scoped machines section start */
    const [parcelMachines, setParcelMachines] = useState<AgriculturalMachine[]>([]);
    const prevParcelForMachines = useRef<string>('');

    const { fetchData: fetchParcelMachines, response: parcelMachinesResponse } = useFetch<AgriculturalMachine[]>(
        '',
        { method: 'GET' }
    );

    useEffect(() => {
        if (Array.isArray(parcelMachinesResponse)) {
            setParcelMachines(parcelMachinesResponse);
        }
    }, [parcelMachinesResponse]);

    useEffect(() => {
        if (!('usesAgriculturalMachinery' in formData)) return;
        const prev = prevParcelForMachines.current;
        prevParcelForMachines.current = selectedParcel;

        if (!selectedParcel) {
            setParcelMachines([]);
            if (prev) setSelectedAgriMachines([]);
            return;
        }
        // Clear saved selection only on user-initiated switch, not on hydration
        if (prev && prev !== selectedParcel) {
            setSelectedAgriMachines([]);
            setParcelMachines([]);
        }
        fetchParcelMachines({
            url: `proxy/farmcalendar/api/v1/AgriculturalMachines/?format=json&parcel=${selectedParcel}`
        });
    }, [selectedParcel]);
    /** Parcel-scoped machines section end */

    /** Parcel-scoped animals section start */
    const [parcelAnimals, setParcelAnimals] = useState<FarmAnimalModel[]>([]);
    const prevParcelForAnimals = useRef<string>('');

    const { fetchData: fetchParcelAnimals, response: parcelAnimalsResponse } = useFetch<FarmAnimalModel[]>(
        '',
        { method: 'GET' }
    );

    useEffect(() => {
        if (Array.isArray(parcelAnimalsResponse)) {
            setParcelAnimals(parcelAnimalsResponse);
        }
    }, [parcelAnimalsResponse]);

    useEffect(() => {
        if (!('hasAnimal' in formData)) return;
        const prev = prevParcelForAnimals.current;
        prevParcelForAnimals.current = selectedParcel;

        if (!selectedParcel) {
            setParcelAnimals([]);
            if (prev) setSelectedAnimal('');
            return;
        }
        if (prev && prev !== selectedParcel) {
            setSelectedAnimal('');
            setParcelAnimals([]);
        }
        fetchParcelAnimals({
            url: `proxy/farmcalendar/api/v1/FarmAnimals/?format=json&parcel=${selectedParcel}`
        });
    }, [selectedParcel]);
    /** Parcel-scoped animals section end */

    useEffect(() => {
        fetchDataAllActivities();
        if ('relatedObservation' in formData) {
            fetchDataAllObservations();
        }

        let parcelID: string | undefined;
        if ('hasAgriParcel' in formData) {
            if (formData.hasAgriParcel)
                parcelID = (formData as any).hasAgriParcel["@id"];
        } else if ('operatedOn' in formData) {
            if (formData.operatedOn)
                parcelID = (formData as any).operatedOn["@id"];
        }
        if (parcelID) {
            const idParts = parcelID.split(':');
            setSelectedParcel(idParts[idParts.length - 1]);
        }

        let parentActivityID: string | undefined;
        if ('isPartOfActivity' in formData) {
            if (formData.isPartOfActivity)
                parentActivityID = (formData as any).isPartOfActivity["@id"];
        } else if ('relatedObservation' in formData) {
            if (formData.relatedObservation)
                parentActivityID = (formData as any).relatedObservation["@id"];
        }
        if (parentActivityID) {
            const idParts = parentActivityID.split(':');
            setParentActivity(idParts[idParts.length - 1]);
        }

        let cropID: string | undefined;
        if ('hasAgriCrop' in formData) {
            if (formData.hasAgriCrop)
                cropID = (formData as any).hasAgriCrop["@id"];
        }
        if (cropID) {
            const idParts = cropID.split(':');
            setSelectedAgriCrop(idParts[idParts.length - 1]);
        }

        let animalID: string | undefined;
        if ('hasAnimal' in formData) {
            if ((formData as any).hasAnimal)
                animalID = (formData as any).hasAnimal["@id"];
        }
        if (animalID) {
            const idParts = animalID.split(':');
            setSelectedAnimal(idParts[idParts.length - 1]);
        }

        let agriMachinesIDs: string[] | undefined;
        if ('usesAgriculturalMachinery' in formData) {
            if (formData.usesAgriculturalMachinery)
                agriMachinesIDs = (formData as any).usesAgriculturalMachinery.map((m: any) => { return m["@id"].split(':')[3] });
        }
        if (agriMachinesIDs) {
            setSelectedAgriMachines(agriMachinesIDs);
        }

        let operatedOnCompostPile: string | undefined;
        if ('isOperatedOn' in formData) {
            if (formData.isOperatedOn)
                operatedOnCompostPile = (formData as any).isOperatedOn["@id"];
        }
        if (operatedOnCompostPile) {
            const idParts = operatedOnCompostPile.split(':');
            setOperatedOnCompostPile(idParts[idParts.length - 1]);
        }

        let pesticideID: string | undefined;
        if ('usesPesticide' in formData) {
            if (formData.usesPesticide)
                pesticideID = (formData as any).usesPesticide["@id"];
        }
        if (pesticideID) {
            const idParts = pesticideID.split(':');
            setSelectedPesticide(idParts[idParts.length - 1]);
        }

        let fertilizerID: string | undefined;
        if ('usesFertilizer' in formData) {
            if (formData.usesFertilizer)
                fertilizerID = (formData as any).usesFertilizer["@id"];
        }
        if (fertilizerID) {
            const idParts = fertilizerID.split(':');
            setSelectedFertilizer(idParts[idParts.length - 1]);
        }

        let severity: string | undefined;
        if ('severity' in formData) {
            if (formData.severity)
                severity = (formData as any).severity;
        }
        if (severity) {
            setSeverity(severity);
        }

        let usesIrrigationSystem: string | undefined;
        if ('usesIrrigationSystem' in formData) {
            if (formData.usesIrrigationSystem)
                usesIrrigationSystem = (formData as any).usesIrrigationSystem;
        }
        if (usesIrrigationSystem) {
            setUsesIrrigationSystem(usesIrrigationSystem);
        }
    }, []);

    const { dialogProps, showDialog } = useDialog();

    const handleCloseDialog = () => {
        dialogProps.onClose();
    };

    /** -------------------------------------------------------------------------- */

    /** Field change handlers start */
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        const keys = name.split('.');

        setFormData(prev => {
            const newState = JSON.parse(JSON.stringify(prev)) as T;

            let currentLevel: any = newState;
            try {
                for (let i = 0; i < keys.length - 1; i++) {
                    currentLevel = currentLevel[keys[i]];
                }
                const finalKey = keys[keys.length - 1];
                const isNumeric = typeof currentLevel[finalKey] === 'number';
                currentLevel[finalKey] = isNumeric ? parseFloat(value) || 0 : value;

            } catch (error) {
                console.error(`Error setting nested property "${name}":`, error);
                return prev;
            }
            return newState;
        });
    };

    const handleDateChange = (newValue: Dayjs | null, fieldName: string) => {
        const formattedValue = newValue ? newValue.toISOString() : null;
        setFormData(prev => ({ ...prev, [fieldName]: formattedValue } as T));
    };

    const handleOperatedOnCompostPile = (e: React.ChangeEvent<HTMLInputElement>) => {
        setOperatedOnCompostPile(e.target.value);
    }

    const handleAddCompostMaterial = () => {
        setFormData(prev => {
            if (!prev || !('hasCompostMaterial' in prev)) return prev;

            const newState = JSON.parse(JSON.stringify(prev)) as T & AddRawMaterialOperationModel;
            const newMaterial = {
                "@id": Date.now().toString(),
                "@type": '',
                typeName: '',
                quantityValue: {
                    "@id": '',
                    "@type": '',
                    unit: '',
                    numericValue: 0
                }
            };
            newState.hasCompostMaterial.push(newMaterial);

            return newState;
        });
    };

    const handleRemoveCompostMaterial = (itemId: string) => () => {
        setFormData(prev => {
            if (!prev || !('hasCompostMaterial' in prev)) return prev;

            const newState = JSON.parse(JSON.stringify(prev)) as T & AddRawMaterialOperationModel;
            newState.hasCompostMaterial = newState.hasCompostMaterial.filter(mat => mat['@id'] !== itemId);

            return newState;
        });
    };

    const handleCompostMaterialChange = (itemId: string) =>
        (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {

            const { name, value } = e.target;
            const keys = name.split('.');

            setFormData(prev => {
                if (!prev || !('hasCompostMaterial' in prev)) return prev;

                const newState = JSON.parse(JSON.stringify(prev)) as T & AddRawMaterialOperationModel;

                const materialToUpdate = newState.hasCompostMaterial.find(mat => mat['@id'] === itemId);
                if (!materialToUpdate) return prev;

                let currentLevel: any = materialToUpdate;
                try {
                    for (let i = 0; i < keys.length - 1; i++) {
                        currentLevel = currentLevel[keys[i]];
                    }

                    const finalKey = keys[keys.length - 1];

                    const isNumeric = typeof currentLevel[finalKey] === 'number';
                    currentLevel[finalKey] = isNumeric ? parseFloat(value) || 0 : value;

                } catch (error) {
                    console.error(`Error setting nested property "${name}" on item ${itemId}:`, error);
                    return prev;
                }

                return newState;
            });
        };
    /** Field change handlers end */

    /** -------------------------------------------------------------------------- */

    const isDateInvalid = (v: any) => !(v && dayjs(v).isValid());

    /** Field rendering helpers start */
    const renderDateFields = () => {
        return (
            <>
                {'hasStartDatetime' in formData && (
                    <DateTimePicker
                        readOnly={!canEdit}
                        label="Start datetime"
                        value={dayjs(formData.hasStartDatetime as string | Date | null)}
                        onChange={(val) => handleDateChange(val, 'hasStartDatetime')}
                        slotProps={{
                            textField: {
                                required: isReq('hasStartDatetime'),
                                error: isReq('hasStartDatetime') && isDateInvalid(formData.hasStartDatetime),
                            },
                        }}
                    />
                )}
                {'phenomenonTime' in formData && (
                    <DateTimePicker
                        readOnly={!canEdit}
                        label="Start datetime"
                        value={dayjs(formData.phenomenonTime as string | Date | null)}
                        onChange={(val) => handleDateChange(val, 'phenomenonTime')}
                        slotProps={{
                            textField: {
                                required: isReq('phenomenonTime'),
                                error: isReq('phenomenonTime') && isDateInvalid(formData.phenomenonTime),
                            },
                        }}
                    />
                )}
                {'validFrom' in formData && (
                    <DateTimePicker
                        readOnly={!canEdit}
                        label="Valid from"
                        value={dayjs(formData.validFrom as string | Date | null)}
                        onChange={(val) => handleDateChange(val, 'validFrom')}
                        slotProps={{
                            textField: {
                                required: isReq('validFrom'),
                                error: isReq('validFrom') && isDateInvalid(formData.validFrom),
                            },
                        }}
                    />
                )}
                {'hasEndDatetime' in formData && (
                    <DateTimePicker
                        readOnly={!canEdit}
                        label="End datetime"
                        value={dayjs(formData.hasEndDatetime as string | Date | null)}
                        onChange={(val) => handleDateChange(val, 'hasEndDatetime')}
                    />
                )}
                {'validTo' in formData && (
                    <DateTimePicker
                        readOnly={!canEdit}
                        label="Valid to"
                        value={dayjs(formData.validTo as string | Date | null)}
                        onChange={(val) => handleDateChange(val, 'validTo')}
                        slotProps={{
                            textField: {
                                required: isReq('validTo'),
                                error: isReq('validTo') && isDateInvalid(formData.validTo),
                            },
                        }}
                    />
                )}
            </>
        )
    }

    const renderAgentAndMachinery = () => {
        return (
            <>
                {'responsibleAgent' in formData && (
                    <TextField
                        slotProps={{ input: { readOnly: !canEdit } }}
                        fullWidth margin="normal" label="Responsible agent"
                        name="responsibleAgent"
                        required={isReq('responsibleAgent')}
                        value={formData.responsibleAgent ?? ''}
                        onChange={handleChange}
                        error={isReq('responsibleAgent') && !(formData.responsibleAgent ? formData.responsibleAgent as string : '').trim()} />
                )}
                {'usesAgriculturalMachinery' in formData && (
                    <GenericSelect<AgriculturalMachine>
                        canEdit={canEdit && !!selectedParcel}
                        multiple={true}
                        endpoint=''
                        data={parcelMachines}
                        label={selectedParcel ? 'Agricultural machines' : 'Agricultural machines (select a parcel first)'}
                        getOptionLabel={item => `${item.name} (${item.model})`}
                        getOptionValue={item => item["@id"].split(':')[3]}
                        setSelectedValue={setSelectedAgriMachines}
                        selectedValue={selectedAgriMachines}
                    />
                )}
            </>
        )
    }

    const renderSensorResultAndObservedProperty = () => {
        type SensorShape = { name: string };
        type ResultShape = { unit: string; hasValue: string };

        return (
            <>
                {'madeBySensor' in formData && (
                    <TextField
                        slotProps={{ input: { readOnly: !canEdit } }}
                        fullWidth margin="normal" label="Made by sensor"
                        name="madeBySensor.name"
                        required={isReq('madeBySensor.name')}
                        value={(formData.madeBySensor as SensorShape).name ?? ''}
                        onChange={handleChange}
                        error={isReq('madeBySensor.name') && !(formData.madeBySensor as SensorShape).name?.trim()} />
                )}
                {'hasResult' in formData && (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            slotProps={{ input: { readOnly: !canEdit } }}
                            fullWidth margin="normal" label="Value"
                            name="hasResult.hasValue"
                            required={isReq('hasResult.hasValue')}
                            value={(formData.hasResult as ResultShape).hasValue ?? ''}
                            onChange={handleChange}
                            error={isReq('hasResult.hasValue') && !(formData.hasResult as ResultShape).hasValue?.trim()} />
                        <TextField
                            slotProps={{ input: { readOnly: !canEdit } }}
                            fullWidth margin="normal" label="Value unit"
                            name="hasResult.unit"
                            required={isReq('hasResult.unit')}
                            value={(formData.hasResult as ResultShape).unit ?? ''}
                            onChange={handleChange}
                            error={isReq('hasResult.unit') && !(formData.hasResult as ResultShape).unit?.trim()} />
                    </Stack>
                )}
                {'observedProperty' in formData && (
                    <TextField
                        slotProps={{ input: { readOnly: !canEdit } }}
                        fullWidth margin="normal" label="Observed property"
                        name="observedProperty"
                        required={isReq('observedProperty')}
                        value={formData.observedProperty ?? ''}
                        onChange={handleChange}
                        error={isReq('observedProperty') && !(formData.observedProperty as string).trim()} />
                )}
            </>
        )
    }

    const renderSeverity = () => {
        return (
            <>
                {'severity' in formData && (
                    <GenericSelect<GenericAlertOptions['actions']['POST']['severity']['choices'][number], GenericAlertOptions>
                        canEdit={canEdit}
                        endpoint='proxy/farmcalendar/api/v1/Alerts/?format=json'
                        method="OPTIONS"
                        label='Severity'
                        selectedValue={severity}
                        setSelectedValue={setSeverity}
                        transformResponse={a => a.actions.POST.severity.choices}
                        getOptionLabel={item => item.display_name}
                        getOptionValue={item => item.value}
                        required={isReq('severity')}
                        error={isReq('severity') && !severity}
                    />
                )}
            </>
        )
    }

    const renderUsesIrrigationSystem = () => {
        return (
            <>
                {'usesIrrigationSystem' in formData && (
                    <GenericSelect<IrrigationOperationOptions['actions']['POST']['usesIrrigationSystem']['choices'][number], IrrigationOperationOptions>
                        canEdit={canEdit}
                        endpoint='proxy/farmcalendar/api/v1/IrrigationOperations/?format=json'
                        method="OPTIONS"
                        label='Irrigation system'
                        selectedValue={usesIrrigationSystem}
                        setSelectedValue={setUsesIrrigationSystem}
                        transformResponse={a => a.actions.POST.usesIrrigationSystem.choices}
                        getOptionLabel={item => item.display_name}
                        getOptionValue={item => item.value}
                        required={isReq('usesIrrigationSystem')}
                        error={isReq('usesIrrigationSystem') && !usesIrrigationSystem}
                    />
                )}
            </>
        )
    }

    const renderSelectedCrop = () => {
        // NTH: filter if parcel is selected
        return (
            <>
                {'hasAgriCrop' in formData && (
                    <GenericSelect<FarmCropModel>
                        canEdit={canEdit}
                        endpoint='proxy/farmcalendar/api/v1/FarmCrops/?format=json'
                        label='Crop'
                        selectedValue={selectedAgriCrop}
                        setSelectedValue={setSelectedAgriCrop}
                        getOptionLabel={item => `${item.name} - ${item.cropSpecies.name} - ${item.growth_stage}`}
                        getOptionValue={item => item["@id"].split(':')[3]}
                        required={isReq('hasAgriCrop')}
                        error={isReq('hasAgriCrop') && !selectedAgriCrop}
                    />
                )}
            </>
        )
    }

    const renderSelectedAnimal = () => {
        return (
            <>
                {'hasAnimal' in formData && (
                    <GenericSelect<FarmAnimalModel>
                        canEdit={canEdit && !!selectedParcel}
                        endpoint=''
                        data={parcelAnimals}
                        label={selectedParcel ? 'Animal' : 'Animal (select a parcel first)'}
                        selectedValue={selectedAnimal}
                        setSelectedValue={setSelectedAnimal}
                        getOptionLabel={item => `${item.name || item.nationalID} - ${item.species} ${item.breed ? '(' + item.breed + ')' : ''}`}
                        getOptionValue={item => item["@id"].split(':')[3]}
                        required={isReq('hasAnimal')}
                        error={isReq('hasAnimal') && !selectedAnimal}
                    />
                )}
            </>
        )
    }

    const renderLactationFields = () => {
        if (!('hasDaysInMilk' in formData)) return null;
        const measurements: { key: string; label: string }[] = [
            { key: 'hasTotalMilkYield', label: 'Total milk yield' },
            { key: 'hasMilkYield', label: 'Milk yield' },
            { key: 'hasRCS', label: 'RCS' },
            { key: 'hasUrea', label: 'Urea' },
            { key: 'hasFat', label: 'Fat' },
            { key: 'hasProtein', label: 'Protein' },
            { key: 'hasDryMatter', label: 'Dry matter' },
        ];
        return (
            <>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                    <TextField
                        slotProps={{ input: { readOnly: !canEdit } }}
                        fullWidth margin="normal" label="Days in milk"
                        name="hasDaysInMilk"
                        required={isReq('hasDaysInMilk')}
                        value={(formData as any).hasDaysInMilk ?? ''}
                        onChange={handleChange}
                        error={isReq('hasDaysInMilk') && !((formData as any).hasDaysInMilk ?? '').toString().trim()}
                    />
                    <TextField
                        slotProps={{ input: { readOnly: !canEdit } }}
                        fullWidth margin="normal" label="Lactation number"
                        name="hasLactationNumber"
                        required={isReq('hasLactationNumber')}
                        value={(formData as any).hasLactationNumber ?? ''}
                        onChange={handleChange}
                        error={isReq('hasLactationNumber') && !((formData as any).hasLactationNumber ?? '').toString().trim()}
                    />
                    <TextField
                        slotProps={{ input: { readOnly: !canEdit } }}
                        fullWidth margin="normal" label="Control"
                        name="hasControl"
                        required={isReq('hasControl')}
                        value={(formData as any).hasControl ?? ''}
                        onChange={handleChange}
                        error={isReq('hasControl') && !((formData as any).hasControl ?? '').toString().trim()}
                    />
                </Stack>
                {measurements.map(m => (
                    <Stack key={m.key} direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            slotProps={{ input: { readOnly: !canEdit } }}
                            fullWidth margin="normal" label={`${m.label} value`}
                            name={`${m.key}.hasValue`}
                            required={isReq(`${m.key}.hasValue`)}
                            value={(formData as any)[m.key]?.hasValue ?? ''}
                            onChange={handleChange}
                            error={isReq(`${m.key}.hasValue`) && !((formData as any)[m.key]?.hasValue ?? '').toString().trim()}
                        />
                        <TextField
                            slotProps={{ input: { readOnly: !canEdit } }}
                            fullWidth margin="normal" label={`${m.label} unit`}
                            name={`${m.key}.unit`}
                            required={isReq(`${m.key}.unit`)}
                            value={(formData as any)[m.key]?.unit ?? ''}
                            onChange={handleChange}
                            error={isReq(`${m.key}.unit`) && !((formData as any)[m.key]?.unit ?? '').toString().trim()}
                        />
                    </Stack>
                ))}
            </>
        )
    }

    const renderHasArea = () => {
        return (
            <>
                {'hasArea' in formData && (
                    <TextField
                        slotProps={{ input: { readOnly: !canEdit } }}
                        fullWidth
                        label="Has area"
                        name="hasArea"
                        type="number"
                        required={isReq('hasArea')}
                        value={isNaN(formData.hasArea as number) ? '' : formData.hasArea}
                        onChange={handleChange}
                        error={isReq('hasArea') && isNaN(formData.hasArea as number)} />
                )}
            </>
        )
    }

    const renderOperatedOnCompostPile = () => {
        return (
            <>
                {'isOperatedOn' in formData && (
                    <TextField
                        slotProps={{ input: { readOnly: !canEdit } }}
                        fullWidth margin="normal" label="Operated on compost pile"
                        name="isOperatedOn.@id"
                        required={isReq('isOperatedOn')}
                        value={operatedOnCompostPile}
                        onChange={handleOperatedOnCompostPile}
                        error={isReq('isOperatedOn') && !operatedOnCompostPile.trim()} />
                )}
            </>
        )
    }

    const renderApplicationMethod = () => {
        return (
            <>
                {'hasApplicationMethod' in formData && (
                    <TextField
                        slotProps={{ input: { readOnly: !canEdit } }}
                        fullWidth margin="normal" label="Application method"
                        name="hasApplicationMethod"
                        required={isReq('hasApplicationMethod')}
                        value={formData.hasApplicationMethod}
                        onChange={handleChange}
                        error={isReq('hasApplicationMethod') && !(formData.hasApplicationMethod as string).trim()} />
                )}
            </>
        )
    }

    const renderAppliedAmount = () => {
        type AppliedAmountShape = { unit: string, numericValue: number };

        return (
            <>
                {'hasAppliedAmount' in formData && (
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                        <TextField
                            slotProps={{ input: { readOnly: !canEdit } }}
                            fullWidth label="Applied amount"
                            name="hasAppliedAmount.numericValue"
                            type="number"
                            required={isReq('hasAppliedAmount.numericValue')}
                            value={isNaN((formData.hasAppliedAmount as AppliedAmountShape)['numericValue']) ?
                                '' : (formData.hasAppliedAmount as AppliedAmountShape)["numericValue"]}
                            onChange={handleChange}
                            error={isReq('hasAppliedAmount.numericValue') && isNaN((formData.hasAppliedAmount as AppliedAmountShape)['numericValue'])} />
                        {formData['@type'] === 'IrrigationOperation' ? (
                            // FE-only convention: irrigation applied-amount unit is restricted to
                            // a fixed set (not enforced by BE). Labels use superscript m³.
                            <TextField
                                select
                                slotProps={{ input: { readOnly: !canEdit } }}
                                fullWidth margin="normal" label="Applied amount unit"
                                name="hasAppliedAmount.unit"
                                required={isReq('hasAppliedAmount.unit')}
                                value={(formData.hasAppliedAmount as AppliedAmountShape).unit ?? ''}
                                onChange={handleChange}
                                error={isReq('hasAppliedAmount.unit') && !(formData.hasAppliedAmount as AppliedAmountShape).unit?.trim()}>
                                <MenuItem value="m3">m³</MenuItem>
                                <MenuItem value="m3/hectare">m³/hectare</MenuItem>
                            </TextField>
                        ) : (
                            <TextField
                                slotProps={{ input: { readOnly: !canEdit } }}
                                fullWidth margin="normal" label="Applied amount unit"
                                name="hasAppliedAmount.unit"
                                required={isReq('hasAppliedAmount.unit')}
                                value={(formData.hasAppliedAmount as AppliedAmountShape).unit ?? ''}
                                onChange={handleChange}
                                error={isReq('hasAppliedAmount.unit') && !(formData.hasAppliedAmount as AppliedAmountShape).unit?.trim()} />
                        )}
                    </Stack>
                )}
            </>
        )
    }

    const renderPesticide = () => {
        return (
            <>
                {'usesPesticide' in formData && (
                    <GenericSelect<PesticideModel>
                        canEdit={canEdit && !!selectedParcel}
                        endpoint='proxy/farmcalendar/api/v1/Pesticides/?format=json'
                        label={selectedParcel ? 'Pesticide' : 'Pesticide (select a parcel first)'}
                        selectedValue={selectedPesticide}
                        setSelectedValue={setSelectedPesticide}
                        getOptionLabel={item => `${item.hasCommercialName} - ${item.hasActiveSubstance} - ${item.hasPreharvestInterval}`}
                        getOptionValue={item => item["@id"].split(':')[3]}
                        required={isReq('usesPesticide')}
                        error={isReq('usesPesticide') && !selectedPesticide}
                    />
                )}
            </>
        )
    }

    const renderFertilizer = () => {
        return (
            <>
                {'usesFertilizer' in formData && (
                    <GenericSelect<FertilizerModel>
                        canEdit={canEdit && !!selectedParcel}
                        endpoint='proxy/farmcalendar/api/v1/Fertilizers/?format=json'
                        label={selectedParcel ? 'Fertilizer' : 'Fertilizer (select a parcel first)'}
                        selectedValue={selectedFertilizer}
                        setSelectedValue={setSelectedFertilizer}
                        getOptionLabel={item => `${item.hasCommercialName} - ${item.hasActiveSubstance} - ${item.hasNutrientConcentration}`}
                        getOptionValue={item => item["@id"].split(':')[3]}
                        required={isReq('usesFertilizer')}
                        error={isReq('usesFertilizer') && !selectedFertilizer}
                    />
                )}
            </>
        )
    }

    const renderCompostMaterials = () => {
        return (
            <>
                {'hasCompostMaterial' in formData && (
                    <Box display={'flex'} flexDirection={'column'} gap={2}>
                        <Typography variant="h6">Compost materials</Typography>
                        {(formData.hasCompostMaterial as AddRawMaterialOperationModel['hasCompostMaterial']).map((compMat) => {
                            return (
                                <Card key={`compMat-${compMat["@id"]}`} /*sx={{ backgroundColor: theme.palette.background.default }}*/>
                                    <CardContent>
                                        <Stack display={'flex'} direction={{ sm: 'column', md: 'row' }} gap={2}>
                                            <Box display={'flex'} gap={2} minWidth={"60%"}>
                                                <TextField fullWidth label="Material name"
                                                    slotProps={{ input: { readOnly: !canEdit } }}
                                                    name="typeName"
                                                    value={compMat.typeName ?? ''}
                                                    onChange={handleCompostMaterialChange(compMat["@id"])}
                                                    error={!compMat.typeName?.trim()} />
                                                <TextField fullWidth label="Quantity"
                                                    slotProps={{ input: { readOnly: !canEdit } }}
                                                    name="quantityValue.numericValue"
                                                    type="number"
                                                    value={isNaN(compMat.quantityValue.numericValue) ? '' : compMat.quantityValue.numericValue}
                                                    onChange={handleCompostMaterialChange(compMat["@id"])}
                                                    error={isNaN(compMat.quantityValue.numericValue)} />
                                            </Box>
                                            <Box display={'flex'} gap={2} flex={1} minWidth={200}>
                                                <TextField fullWidth label="Unit"
                                                    slotProps={{ input: { readOnly: !canEdit } }}
                                                    name="quantityValue.unit"
                                                    value={compMat.quantityValue.unit ?? ''}
                                                    onChange={handleCompostMaterialChange(compMat["@id"])}
                                                    error={!compMat.quantityValue.unit?.trim()} />
                                                <IconButton aria-label="remove"
                                                    disabled={!canEdit}
                                                    onClick={handleRemoveCompostMaterial(compMat["@id"])}>
                                                    <RemoveCircleOutlineIcon />
                                                </IconButton>
                                            </Box>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            );
                        })}
                        {canEdit &&
                            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                <Button variant="outlined"
                                    startIcon={<AddIcon />}
                                    onClick={handleAddCompostMaterial}
                                >
                                    Add compost material
                                </Button>
                            </Box>
                        }
                    </Box>
                )}
            </>
        )
    }

    const renderNestedActivities = () => {
        let nestedActivities = [];
        if ('hasMeasurement' in formData) {
            nestedActivities.push(...(formData.hasMeasurement as any));
        }
        if ('hasNestedOperation' in formData) {
            nestedActivities.push(...(formData.hasNestedOperation as any));
        }
        if (nestedActivities.length && allActivities.length) {
            const allActivitiesWithEndpoints = allActivities.map(a => {
                return {
                    ...a,
                    activity_endpoint: activityTypes.find(at => at["@id"].split(':')[3] === a.activityType["@id"].split(':')[3])?.activity_endpoint
                }
            })

            nestedActivities = nestedActivities.map(na => {
                const naID = na["@id"].split(':')[3];
                const additionalParams = allActivitiesWithEndpoints.find(a => a["@id"].split(':')[3] === naID);

                return {
                    ...na,
                    title: additionalParams?.title,
                    hasStartDatetime: additionalParams?.hasStartDatetime,
                    hasEndDatetime: additionalParams?.hasEndDatetime,
                    activity_endpoint: additionalParams?.activity_endpoint
                }
            })
        }
        return (
            <>
                {nestedActivities.length > 0 &&
                    <Card>
                        <CardContent>
                            <Typography variant="h6">Nested activities</Typography>
                            <List dense={nestedActivities.length > 10}>
                                {nestedActivities.map((n: any) => {
                                    return <ListItem key={`nested-activity-${n["@id"]}`} disablePadding>
                                        <ListItemButton onClick={() => {
                                            navigate(`/farm-calendar/edit-activity/${n["@id"].split(":")[3]}`, { state: { api: n.activity_endpoint, activityTypes: activityTypes } })

                                        }}>
                                            <ListItemText
                                                primary={`${n.title} (${dayjs(n.hasStartDatetime).format('YYYY-MM-DD HH:mm')} - ${dayjs(n.hasEndDatetime).format('YYYY-MM-DD HH:mm')})`}
                                            />
                                        </ListItemButton>
                                    </ListItem>
                                })}
                            </List>
                        </CardContent>
                    </Card>
                }
            </>
        )
    }
    /** Field rendering helpers end */

    /** -------------------------------------------------------------------------- */

    /** Validation start */
    const fieldValidators: Record<string, () => boolean> = {
        'title': () => !!formData.title?.trim(),
        'responsibleAgent': () => !!((formData as any).responsibleAgent ?? '').toString().trim(),
        'hasStartDatetime': () => !isDateInvalid((formData as any).hasStartDatetime),
        'phenomenonTime': () => !isDateInvalid((formData as any).phenomenonTime),
        'validFrom': () => !isDateInvalid((formData as any).validFrom),
        'validTo': () => !isDateInvalid((formData as any).validTo),
        'operatedOn': () => !!selectedParcel,
        'hasAgriCrop': () => !!selectedAgriCrop,
        'usesPesticide': () => !!selectedPesticide,
        'usesFertilizer': () => !!selectedFertilizer,
        'usesIrrigationSystem': () => !!usesIrrigationSystem,
        'relatedObservation': () => !!parentActivity,
        'isOperatedOn': () => !!operatedOnCompostPile.trim(),
        'hasArea': () => !isNaN((formData as any).hasArea as number),
        'hasAppliedAmount.numericValue': () => !isNaN(((formData as any).hasAppliedAmount?.numericValue) as number),
        'hasAppliedAmount.unit': () => !!((formData as any).hasAppliedAmount?.unit ?? '').toString().trim(),
        'hasResult.hasValue': () => !!((formData as any).hasResult?.hasValue ?? '').toString().trim(),
        'hasResult.unit': () => !!((formData as any).hasResult?.unit ?? '').toString().trim(),
        'observedProperty': () => !!((formData as any).observedProperty ?? '').toString().trim(),
        'madeBySensor.name': () => !!((formData as any).madeBySensor?.name ?? '').toString().trim(),
        'hasApplicationMethod': () => !!((formData as any).hasApplicationMethod ?? '').toString().trim(),
        'severity': () => !!severity,
        'hasAnimal': () => !!selectedAnimal,
        'hasDaysInMilk': () => !!((formData as any).hasDaysInMilk ?? '').toString().trim(),
        'hasLactationNumber': () => !!((formData as any).hasLactationNumber ?? '').toString().trim(),
        'hasControl': () => !!((formData as any).hasControl ?? '').toString().trim(),
        'hasTotalMilkYield.hasValue': () => !!((formData as any).hasTotalMilkYield?.hasValue ?? '').toString().trim(),
        'hasTotalMilkYield.unit': () => !!((formData as any).hasTotalMilkYield?.unit ?? '').toString().trim(),
        'hasMilkYield.hasValue': () => !!((formData as any).hasMilkYield?.hasValue ?? '').toString().trim(),
        'hasMilkYield.unit': () => !!((formData as any).hasMilkYield?.unit ?? '').toString().trim(),
        'hasRCS.hasValue': () => !!((formData as any).hasRCS?.hasValue ?? '').toString().trim(),
        'hasRCS.unit': () => !!((formData as any).hasRCS?.unit ?? '').toString().trim(),
        'hasUrea.hasValue': () => !!((formData as any).hasUrea?.hasValue ?? '').toString().trim(),
        'hasUrea.unit': () => !!((formData as any).hasUrea?.unit ?? '').toString().trim(),
        'hasFat.hasValue': () => !!((formData as any).hasFat?.hasValue ?? '').toString().trim(),
        'hasFat.unit': () => !!((formData as any).hasFat?.unit ?? '').toString().trim(),
        'hasProtein.hasValue': () => !!((formData as any).hasProtein?.hasValue ?? '').toString().trim(),
        'hasProtein.unit': () => !!((formData as any).hasProtein?.unit ?? '').toString().trim(),
        'hasDryMatter.hasValue': () => !!((formData as any).hasDryMatter?.hasValue ?? '').toString().trim(),
        'hasDryMatter.unit': () => !!((formData as any).hasDryMatter?.unit ?? '').toString().trim(),
        'hasCompostMaterial': () => {
            const arr = (formData as any).hasCompostMaterial;
            if (!Array.isArray(arr) || arr.length === 0) return false;
            return arr.every((m: any) =>
                !!m.typeName?.trim()
                && !isNaN(m.quantityValue?.numericValue)
                && !!m.quantityValue?.unit?.trim()
            );
        },
    };

    const isFormInvalid = !selectedParcel || Array.from(requiredKeys).some(k => {
        const fn = fieldValidators[k];
        return fn ? !fn() : false;
    });
    /** Validation end */

    /** Button handler functions start */
    const prepPostAndPatch = () => {
        let body = { ...formData };
        if ('hasAgriParcel' in body) {
            (body.hasAgriParcel as { '@id': string })['@id'] = `urn:farmcalendar:Parcel:${selectedParcel}`;
        } else if ('operatedOn' in body) {
            (body.operatedOn as { '@id': string })['@id'] = `urn:farmcalendar:Parcel:${selectedParcel}`;
        }
        if ('isPartOfActivity' in body) {
            if (!body.isPartOfActivity) {
                body.isPartOfActivity = { '@id': '', '@type': 'FarmCalendarActivity' }
            }
            if (parentActivity) {
                (body.isPartOfActivity as { '@id': string })['@id'] = `urn:farmcalendar:FarmCalendarActivity:${parentActivity}`;
            } else {
                body.isPartOfActivity = null;
            }
        } else if ('relatedObservation' in body) {
            if (!body.relatedObservation) {
                body.relatedObservation = { '@id': '', '@type': 'Observation' }
            }
            if (parentActivity) {
                (body.relatedObservation as { '@id': string })['@id'] = `urn:farmcalendar:Observation:${parentActivity}`;
            } else {
                body.relatedObservation = null;
            }
        }
        if ('hasAgriCrop' in body) {
            (body.hasAgriCrop as { '@id': string })['@id'] = `urn:farmcalendar:FarmCrop:${selectedAgriCrop}`;
        }
        if ('hasAnimal' in body) {
            (body.hasAnimal as { '@id': string })['@id'] = `urn:farmcalendar:Animal:${selectedAnimal}`;
        }
        if ('usesAgriculturalMachinery' in body) {
            (body.usesAgriculturalMachinery as string[]) = selectedAgriMachines;
        }
        if ('isOperatedOn' in body) {
            (body.isOperatedOn as { '@id': string })['@id'] = `urn:farmcalendar:CompostPile:${operatedOnCompostPile}`;
        }
        if ('usesPesticide' in body) {
            (body.usesPesticide as { '@id': string })['@id'] = `urn:farmcalendar:Pesticide:${selectedPesticide}`;
        }
        if ('usesFertilizer' in body) {
            if (!body.usesFertilizer) {
                body.usesFertilizer = { '@id': '', '@type': 'Fertilizer' };
            }
            (body.usesFertilizer as { '@id': string })['@id'] = `urn:farmcalendar:Fertilizer:${selectedFertilizer}`;
        }
        if ('severity' in body) {
            body.severity = severity;
        }
        // Necessary for generic alerts as they have this field set to null
        if ('quantityValue' in body && !body.quantityValue) {
            body.quantityValue = {};
        }
        if ('usesIrrigationSystem' in body) {
            body.usesIrrigationSystem = usesIrrigationSystem;
        }
        return body;
    }

    const handlePost = () => {
        onAdd && onAdd(prepPostAndPatch());
    };

    const handlePatch = () => {
        const body = prepPostAndPatch();

        console.log(body);

        onSave && onSave(body);
    }

    const handleDelete = () => {
        onDelete && onDelete();
    };
    /** Button handler functions end */

    return (
        <>
            <Card>
                <CardContent>
                    <Stack direction={'column'} spacing={2}>
                        <TextField
                            slotProps={{ input: { readOnly: !canEdit } }}
                            fullWidth margin="normal" label="Title" name="title"
                            required={isReq('title')}
                            value={formData.title ?? ''} onChange={handleChange}
                            error={isReq('title') && !formData.title?.trim()}
                        />
                        {renderDateFields()}
                        <TextField
                            slotProps={{ input: { readOnly: !canEdit } }}
                            fullWidth margin="normal" multiline rows={4} label="Details" name="details"
                            value={formData.details ?? ''} onChange={handleChange}
                        />
                        {renderAgentAndMachinery()}
                        <GenericSelect<FarmParcelModel>
                            canEdit={canEdit}
                            endpoint='proxy/farmcalendar/api/v1/FarmParcels/?format=json'
                            label='Parcel'
                            selectedValue={selectedParcel}
                            setSelectedValue={setSelectedParcel}
                            getOptionLabel={item => `${item.identifier} (${item.category})`}
                            getOptionValue={item => item["@id"].split(':')[3]}
                            required
                            error={!selectedParcel}
                        />
                        {/* NTH: string filtering of the displayed activities */}
                        <GenericSelect<FarmCalendarActivityModel>
                            canEdit={canEdit}
                            endpoint=''
                            data={'relatedObservation' in formData ? allObservations : allActivities}
                            label={'relatedObservation' in formData ? 'Related observation' : 'Part of activity'}
                            // Filtering out the current activity to avoid recursive links
                            transformResponse={resp => {
                                return resp.filter(fa => {
                                    return fa["@id"].split(':')[3] !== formData["@id"].split(':')[3]
                                })
                            }}
                            selectedValue={parentActivity}
                            setSelectedValue={setParentActivity}
                            getOptionLabel={item => {
                                const start = (item as any).hasStartDatetime ?? (item as any).phenomenonTime;
                                const end = (item as any).hasEndDatetime;
                                return `${item.title} (${dayjs(start).format('YYYY-MM-DD HH:mm')}${end ? ` - ${dayjs(end).format('YYYY-MM-DD HH:mm')}` : ''})`;
                            }}
                            getOptionValue={item => item["@id"].split(':')[3]}
                            required={isReq('relatedObservation')}
                            error={isReq('relatedObservation') && !parentActivity}
                        />
                        {renderSeverity()}
                        {renderSensorResultAndObservedProperty()}
                        {renderSelectedCrop()}
                        {renderSelectedAnimal()}
                        {renderLactationFields()}
                        {renderHasArea()}
                        {renderOperatedOnCompostPile()}
                        {renderAppliedAmount()}
                        {renderUsesIrrigationSystem()}
                        {renderApplicationMethod()}
                        {renderPesticide()}
                        {renderFertilizer()}
                        {renderCompostMaterials()}
                        {renderNestedActivities()}
                    </Stack>
                </CardContent>
            </Card>
            <Box sx={{ display: 'flex', justifyContent: 'flex-start', gap: 2 }}>
                {onAdd && <Button
                    variant="contained"
                    color="primary"
                    startIcon={<AddIcon />}
                    loading={loading}
                    loadingPosition="start"
                    disabled={!canEdit || isFormInvalid}
                    onClick={handlePost}
                >
                    Add
                </Button>}
                {onDelete && <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SaveIcon />}
                    loading={loading}
                    loadingPosition="start"
                    disabled={!canEdit || isFormInvalid}
                    onClick={handlePatch}
                >
                    Save Changes
                </Button>}
                {onSave && <Button
                    variant="contained"
                    color="error"
                    startIcon={<DeleteIcon />}
                    loading={loading}
                    loadingPosition="start"
                    // disabled={isFormInvalid}
                    disabled={!canDelete}
                    onClick={() => {
                        showDialog({
                            title: `Are you sure you want to delete this activity?`,
                            variant: 'yes-no',
                            children: <></>
                        });
                    }}
                >
                    Delete
                </Button>}
            </Box>
            <GenericDialog {...dialogProps} onClose={handleCloseDialog} onYes={handleDelete} />
        </>
    )
}

export default ActivityDynamicCRUDActions;