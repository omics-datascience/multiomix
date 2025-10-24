import React, { useEffect, useRef, useState } from 'react'
import { Button, Form, Header, Icon, Label, PopupContentProps, Segment, SemanticShorthandItem } from 'semantic-ui-react'
import { SourceForm } from '../pipeline/SourceForm'
import { SingleRangeSlider } from 'neo-react-semantic-ui-range'
import { CustomAlertTypes, FileType, KySearchParams, Nullable, Source, SourceType } from '../../utils/interfaces'
import { cleanRef, getDefaultSource, getDjangoHeader, getFilenameFromSource, getFileSizeInMB, getInputFileCSVColumns } from '../../utils/util_functions'
import { DjangoCGDSStudy, DjangoNumberSamplesInCommonMrnaClinicalResult, DjangoNumberSamplesInCommonOneFrontResult, DjangoResponseCode, DjangoUserFile } from '../../utils/django_interfaces'
import { InfoPopup } from '../pipeline/experiment-result/gene-gem-details/InfoPopup'
import ky from 'ky'
import { MAX_FILE_SIZE_IN_MB_WARN } from '../../utils/constants'
import { intersection, isEqual } from 'lodash'
import { DifferentialExpressionInputClinicalAttribute } from './DifferentialExpressionInputClinicalAttribute'
import { DifferentialExpressionAnalysis } from './types'

// Define the possible field names for number of samples
type NumberOfSamplesFields = 'numberOfSamplesMRNA' | 'numberOfSamplesClinical'

declare const urlDifferentialExpressionSubmit: string
declare const urlGetCommonSamplesDiferentialExperiment: string
declare const urlGetCommonSamplesOneFrontDiferentialExperiment: string
declare const urlGetClinicalAttributes: string
declare const urlCGDSDatasetClinicalAttributes: string
declare const urlUpdateExperiment: string

/** Available types of Sources for a DifferentialExpressionForm. */
type SourceStateDifferentialExpression = 'clinicalSource' | 'mRNASource'

/** Structure for the Feature Selection panel. */
interface IDifferentialExpressionFormData {
    /** mRNA source. */
    mRNASource: Source,
    /** clinical source. */
    clinicalSource: Source,
    /** Differential Expression name. */
    differentialExpressionDescription: string,
    /** Differential Expression description. */
    differentialExpressionName: string,
    /** Umbral de Percentil para el filtrado de genes de baja expresión. */
    thresholdPercentile: number,
    /** Umbral de varianza para el filtrado de genes. */
    thresholdStd: number
    /** top */
    top: number,

    numberOfSamplesMRNA: number,
    numberOfSamplesClinical: number,
    numberOfSamplesInCommon: number,
    gettingCommonSamples: boolean,
    clinicalAttribute: string,
}
interface IDifferentialExpressionForm extends IDifferentialExpressionFormData {
    isEditing: boolean,
    isLoading: boolean,
    optionsClinicalAttributes: string[],
}
const cleanForm: IDifferentialExpressionForm = {
    mRNASource: getDefaultSource(),
    clinicalSource: getDefaultSource(),
    isEditing: false,
    differentialExpressionDescription: '',
    differentialExpressionName: '',
    clinicalAttribute: '',
    thresholdPercentile: 0.15,
    thresholdStd: 0.0001,
    top: 100,
    isLoading: false,
    numberOfSamplesMRNA: 0,
    numberOfSamplesClinical: 0,
    numberOfSamplesInCommon: 0,
    gettingCommonSamples: false,
    optionsClinicalAttributes: [],
}
interface DifferentialExpressionFormProps {
    updateAlert: (type: CustomAlertTypes, msg: string) => void,
    experimentToEdit: Nullable<DifferentialExpressionAnalysis>
    handleCleanExperimentToEdit: () => void;
}

export const DifferentialExpressionForm = (props: DifferentialExpressionFormProps) => {
    const [form, setForm] = useState<IDifferentialExpressionForm>(cleanForm)
    const abortController = useRef(new AbortController())

    /**
     * Change the source state to submit a pipeline
     * @param sourceType New selected Source
     * @param sourceStateName Source's name in state object to update
     */
    const handleChangeSourceType = (sourceType: SourceType, sourceStateName: SourceStateDifferentialExpression) => {
        // Selects source to update
        const source = form[sourceStateName]
        // Change source type
        source.type = sourceType

        // Resets all source values
        source.selectedExistingFile = null
        source.CGDSStudy = null
        cleanRef(source.newUploadedFileRef)
        // After update state
        setForm(prevState => ({
            ...prevState,
            [sourceStateName]: source,
        }))

        updateSourceFilenamesAndCommonSamples()
    }

    /**
     * Selects a User's file as a source
     * @param selectedFile Selected file as Source
     * @param sourceStateName Source's name in state object to update
     */
    const selectUploadedFile = (selectedFile: DjangoUserFile, sourceStateName: SourceStateDifferentialExpression) => {
        // Selects source to update
        const source = form[sourceStateName]

        source.type = SourceType.UPLOADED_DATASETS
        source.selectedExistingFile = selectedFile
        setForm(prevState => ({
            ...prevState,
            [sourceStateName]: source,
        }))
        updateSourceFilenamesAndCommonSamples()
    }

    /**
     * Selects a CGDS Study as a source
     * @param selectedStudy Selected Study as Source
     * @param sourceStateName Source's name in state object to update
     */
    const selectStudy = (selectedStudy: DjangoCGDSStudy, sourceStateName: SourceStateDifferentialExpression) => {
        // Selects source to update
        const source = form[sourceStateName]

        source.type = SourceType.CGDS
        source.CGDSStudy = selectedStudy
        setForm(prevState => ({
            ...prevState,
            [sourceStateName]: source,
        }))
        updateSourceFilenamesAndCommonSamples()
    }

    /**
     * function to handle the update de select clinical attribute.
     */
    const updateSelectClinicalAttribute = () => {
        if (form.clinicalSource.newUploadedFileRef.current && form.clinicalSource.selectedExistingFile === null) {
            getInputFileCSVColumns(form.clinicalSource.newUploadedFileRef.current.files[0]).then((clinicalHeadersColumnsNames) => {
                setForm(prevState => ({ ...prevState, optionsClinicalAttributes: clinicalHeadersColumnsNames }))
            })
        } else if (form.clinicalSource.selectedExistingFile?.id || form.clinicalSource.CGDSStudy?.id) {
            const idToSearch = form.clinicalSource.selectedExistingFile?.id ?? form.clinicalSource.CGDSStudy?.id
            const myHeaders = getDjangoHeader()
            const url = form.clinicalSource.selectedExistingFile?.id ? urlGetClinicalAttributes + `${idToSearch}/` : urlCGDSDatasetClinicalAttributes + `${idToSearch}/`
            ky.get(url, { timeout: 60000, headers: myHeaders, signal: abortController.current.signal }).then((response) => {
                response.json().then((clinicalAttributes: string[]) => {
                    setForm(prevState => ({ ...prevState, optionsClinicalAttributes: clinicalAttributes }))
                }).catch((err) => {
                    console.error('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                if (!abortController.current.signal.aborted) {
                    console.error('Error getting clinical attributes', err)
                }
            })
        }
    }

    /**
     * Handles file input changes to set data to show in form
     * IMPORTANT: this is necessary because the file inputs are uncontrolled components
     * and doesn't trigger an update of the state fields
     */
    const updateSourceFilenames = () => {
        const updateClinicalAtt = getFilenameFromSource(form.clinicalSource) !== form.clinicalSource.filename

        setForm(prevState => ({
            ...prevState,
            clinicalSource: {
                ...prevState.clinicalSource,
                filename: getFilenameFromSource(prevState.clinicalSource)
            },
            mRNASource: {
                ...prevState.mRNASource,
                filename: getFilenameFromSource(prevState.mRNASource)
            },

        }))

        if (updateClinicalAtt) {
            updateSelectClinicalAttribute()
        }
    }

    /**
     * Callback when a new file is selected in the uncontrolled component
     * (input type=file)
     */
    const updateSourceFilenamesAndCommonSamples = () => {
        updateSourceFilenames()
        checkCommonSamples()
    }

    /**
     * Callback when a new file is selected in the uncontrolled component
     * (input type=file)
     */
    const selectNewFile = () => {
        updateSourceFilenamesAndCommonSamples()
    }

    /**
     * change name or description of manual form
     * @param value new value for input form
     * @param name type of input to change
     */
    const handleChangeForm = (value: string | number, name: keyof IDifferentialExpressionFormData) => {
        setForm(prevState => ({
            ...prevState,
            [name]: value,
        }))
    }

    /**
     * Function to convert a number to scientific notation
     * @param value Number to convert
     * @param sigfigs Significant figures to use in the conversion
     * @returns String in scientific notation
     */
    function toScientific (value: string, sigfigs?: number): string {
        const num = Number(String(value).trim().replace(',', '.'))

        if (!Number.isFinite(num)) {
            throw new Error('Número inválido')
        }

        // toExponential(n) usa n dígitos después del punto ⇒ sigfigs - 1
        return sigfigs && sigfigs > 0
            ? num.toExponential(sigfigs - 1)
            : num.toExponential()
    }

    /**
     * Handles the submit when is editting an experiment
     * It sends only the fields that can be edited: name and description
     */
    const handleEditSubmit = () => {
        setForm(prevState => ({
            ...prevState,
            isLoading: true
        }))
        const myHeaders = getDjangoHeader()

        const body = {
            name: form.differentialExpressionName,
            description: form.differentialExpressionDescription
        }

        ky.patch(urlUpdateExperiment + `/${props.experimentToEdit?.id}/`, { headers: myHeaders, json: body }).then((response) => {
            response.json().then(() => {
                props.updateAlert(CustomAlertTypes.SUCCESS, 'Differential Expression experiment updated successfully!')
                setForm(cleanForm)
            }).catch((err) => {
                console.error('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.error('Error to update experiment ->', err)
            props.updateAlert(CustomAlertTypes.ERROR, 'Error to update Differential Expression experiment!')
        }).finally(() => {
            setForm(prevState => ({
                ...prevState,
                isLoading: false
            }))
        })
    }

    const handleSubmit = () => {
        setForm(prevState => ({
            ...prevState,
            isLoading: true
        }))
        const myHeaders = getDjangoHeader()

        const body = {
            name: form.differentialExpressionName,
            description: form.differentialExpressionDescription,
            clinicalType: form.clinicalSource.type,
            mRNAType: form.mRNASource.type,
            clinicalAttribute: form.clinicalAttribute,
            thresholdPercentile: form.thresholdPercentile,
            threshold: form.thresholdStd,
            top: form.top,
            clinicalCGDSStudyPk: form.clinicalSource.CGDSStudy?.id,
            mRNACGDSStudyPk: form.mRNASource.CGDSStudy?.id,
            clinicalExistingFilePk: form.clinicalSource.selectedExistingFile?.id,
            mRNAExistingFilePk: form.mRNASource.selectedExistingFile?.id
        }
        ky.post(urlDifferentialExpressionSubmit, { headers: myHeaders, json: body }).then((response) => {
            response.json().then(() => {
                props.updateAlert(CustomAlertTypes.SUCCESS, 'Differential Expression experiment created successfully!')
                setForm(cleanForm)
            }).catch((err) => {
                console.error('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.error('Error getting users ->', err)
            props.updateAlert(CustomAlertTypes.ERROR, 'Error creating Differential Expression experiment!')
        }).finally(() => {
            setForm(prevState => ({
                ...prevState,
                isLoading: false
            }))
        })
    }

    /**
     * Gets the id of the source hosted in backend to send to the service
     * of number of samples in common
     * @param source Source to get its id
     * @returns Id of the source or null if it's not been selected yet
     */
    const getIdInBackend = (source: Source): Nullable<number> => {
        if (source.type === SourceType.UPLOADED_DATASETS && source.selectedExistingFile !== null) {
            return source.selectedExistingFile.id ?? null
        }

        if (source.type === SourceType.CGDS && source.CGDSStudy !== null) {
            return source.CGDSStudy.id ?? null
        }

        return null
    }

    /**
     * General method to avoid duplicated code when the reading
     * of a loaded user's file fails
     * @param event Event of error
     */
    const errorReadingFileInInput = (event) => {
        resetAllNumberOfSamples()
        console.error('Error reading user\'s file', event.target.error.name)
    }

    /**
     * Gets the number of samples in common between both selected datasets
     * one in frontend, other in backend
     * @param mRNASourceIsInBackend Flag to know which dataset is in frontend and backend
     */
    const checkCommonSamplesOneFrontOneBack = (mRNASourceIsInBackend: boolean) => {
        let sourceInFront: Source
        let sourceFrontNumberOfSampleName: NumberOfSamplesFields, sourceBackNumberOfSampleName: NumberOfSamplesFields
        let otherSourceId: number, otherSourceType: Nullable<SourceType>
        let otherSourceFileType: FileType
        const mRNASource = form.mRNASource
        const clinicalSource = form.clinicalSource

        if (mRNASourceIsInBackend) {
            // If mRNA is in backend, GEM is in frontend
            const idInBackend = getIdInBackend(mRNASource)

            if (idInBackend === null) {
                return
            }

            sourceInFront = clinicalSource
            sourceFrontNumberOfSampleName = 'numberOfSamplesClinical'
            sourceBackNumberOfSampleName = 'numberOfSamplesMRNA'
            otherSourceId = idInBackend
            otherSourceType = mRNASource.type
            otherSourceFileType = FileType.CLINICAL
        } else {
            const idInBackend = getIdInBackend(clinicalSource)

            if (idInBackend === null) {
                return
            }

            sourceInFront = mRNASource
            sourceFrontNumberOfSampleName = 'numberOfSamplesMRNA'
            sourceBackNumberOfSampleName = 'numberOfSamplesClinical'
            otherSourceId = idInBackend
            otherSourceType = clinicalSource.type
            otherSourceFileType = FileType.MRNA
        }

        // We need both datasets!
        const sourceCurrentRef = sourceInFront.newUploadedFileRef.current

        if (!sourceCurrentRef || sourceCurrentRef.files.length === 0) {
            resetAllNumberOfSamples()
            return
        }

        const fileSizeInMB = getFileSizeInMB(sourceInFront.newUploadedFileRef.current.files[0].size)

        if (fileSizeInMB < MAX_FILE_SIZE_IN_MB_WARN) {
            const file = sourceInFront.newUploadedFileRef.current.files[0]
            getInputFileCSVColumns(file).then((headersColumnsNames) => {
                // Sets the Request's Headers
                const myHeaders = getDjangoHeader()

                // Sends an array of headers to compare in server
                const jsonData = {
                    headersColumnsNames,
                    otherSourceId,
                    otherSourceType,
                    otherSourceFileType
                }
                setForm(prevState => ({ ...prevState, gettingCommonSamples: true }))
                ky.post(urlGetCommonSamplesOneFrontDiferentialExperiment, { json: jsonData, headers: myHeaders }).then((response) => {
                    response.json().then((jsonResponse: DjangoNumberSamplesInCommonOneFrontResult) => {
                        if (jsonResponse.status.code === DjangoResponseCode.SUCCESS) {
                            // For front Source subtracts 1 to not have in count the first column of the file
                            setForm(prevState => ({
                                ...prevState,
                                gettingCommonSamples: false,
                                [sourceFrontNumberOfSampleName]: Math.max(headersColumnsNames.length - 1, 0),
                                [sourceBackNumberOfSampleName]: jsonResponse.data.number_samples_backend,
                                numberOfSamplesInCommon: jsonResponse.data.number_samples_in_common
                            }))
                        }
                    }).catch((err) => {
                        console.error('Error parsing JSON ->', err)
                    })
                }).catch((err) => {
                    console.error('Error getting user experiments', err)
                })
            }).catch(errorReadingFileInInput).finally(() => {
                setForm(prevState => ({
                    ...prevState,
                    gettingCommonSamples: false
                }))
            })
        }
    }

    /**
     * Gets the number of samples in common between both selected datasets
     * hosted in backend
     */
    const checkCommonSamplesInBackend = () => {
        const mRNASourceId = getIdInBackend(form.mRNASource)
        const clinicalSourceId = getIdInBackend(form.clinicalSource)

        if (mRNASourceId !== null && clinicalSourceId !== null) {
            const searchParams = {
                mRNASourceId,
                mRNASourceType: form.mRNASource.type,
                clinicalSourceId,
                clinicalSourceType: form.clinicalSource.type,
            }
            setForm(prevState => ({ ...prevState, gettingCommonSamples: true }))

            ky.get(urlGetCommonSamplesDiferentialExperiment, { signal: abortController.current.signal, searchParams: searchParams as KySearchParams }).then((response) => {
                setForm(prevState => ({
                    ...prevState,
                    gettingCommonSamples: false
                }))
                response.json().then((jsonResponse: DjangoNumberSamplesInCommonMrnaClinicalResult) => {
                    if (jsonResponse.status.code === DjangoResponseCode.SUCCESS) {
                        setForm(prevState => ({
                            ...prevState,
                            numberOfSamplesMRNA: jsonResponse.data.number_samples_mrna,
                            numberOfSamplesClinical: jsonResponse.data.number_samples_clinical,
                            numberOfSamplesInCommon: jsonResponse.data.number_samples_in_common
                        }))
                    }
                }).catch((err) => {
                    console.error('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                if (!abortController.current.signal.aborted) {
                    setForm(prevState => ({
                        ...prevState,
                        gettingCommonSamples: false
                    }))
                }

                console.error('Error getting user experiments', err)
            }).finally(() => {
                setForm(prevState => ({
                    ...prevState,
                    gettingCommonSamples: false
                }))
            })
        }
    }

    /**
     * Check if a Source is hosted in the backend
     * @param source Source to check
     * @returns True if the Source is hosted in the backend. False otherwise
     */
    const isDatasetInBackend = (source: Source): boolean => {
        return source.type === SourceType.UPLOADED_DATASETS || source.type === SourceType.CGDS
    }

    /**
     * Resets all the number of samples
     */
    const resetAllNumberOfSamples = () => {
        setForm(prevState => ({
            ...prevState,
            numberOfSamplesMRNA: 0,
            numberOfSamplesClinical: 0,
            numberOfSamplesInCommon: 0
        })
        )
    }

    /**
     * Checks if there are common samples between two selected sources
     * to show in the new experiment form
     */
    const checkCommonSamples = () => {
        // It needs both sources!
        if (form.mRNASource.type === SourceType.NONE || form.clinicalSource.type === SourceType.NONE) {
            resetAllNumberOfSamples()
            return
        }

        const mRNASourceIsInBackend = isDatasetInBackend(form.mRNASource)
        const clinicalSourceIsInBackend = isDatasetInBackend(form.clinicalSource)
        // If both datasets are hosted in backend, checks in server

        if (mRNASourceIsInBackend && clinicalSourceIsInBackend) {
            checkCommonSamplesInBackend()
        } else if (mRNASourceIsInBackend || clinicalSourceIsInBackend) {
            checkCommonSamplesOneFrontOneBack(mRNASourceIsInBackend)
        } else {
            checkCommonSamplesInFrontend()
        }
    }

    /**
     * Gets the number of samples in common between both selected datasets
     * loaded in HTML file inputs
     */
    const checkCommonSamplesInFrontend = () => {
        const mRNASource = form.mRNASource
        const clinicalSource = form.clinicalSource

        // We need both datasets!
        if (mRNASource.newUploadedFileRef.current.files.length === 0 ||
            clinicalSource.newUploadedFileRef.current.files.length === 0) {
            resetAllNumberOfSamples()
            return
        }

        // Reads first file
        const mRNAFile = mRNASource.newUploadedFileRef.current.files[0]
        getInputFileCSVColumns(mRNAFile).then((mRNAHeadersColumnsNames) => {
            // Reads second file
            const clinicalFile = clinicalSource.newUploadedFileRef.current.files[0]
            getInputFileCSVColumns(clinicalFile).then((clinicalHeadersColumnsNames) => {
                // Gets length of sources and their intersection
                // For mRNA and GEM removes first element to not have in count the first column of the file (the index)
                mRNAHeadersColumnsNames.shift()
                clinicalHeadersColumnsNames.shift()

                setForm(prevState => ({
                    ...prevState,
                    numberOfSamplesMRNA: mRNAHeadersColumnsNames.length,
                    numberOfSamplesClinial: clinicalHeadersColumnsNames.length,
                    numberOfSamplesInCommon: intersection(
                        mRNAHeadersColumnsNames,
                        clinicalHeadersColumnsNames
                    ).length
                }))
            }).catch(errorReadingFileInInput)
        }).catch(errorReadingFileInInput)
    }

    /**
     * Checks if the form can be submitted
     * @returns True if the submit button is disabled.
     */
    const submitDisabled = (form.differentialExpressionName.trim() === '' ||
            form.clinicalAttribute.trim() === '' ||
            form.differentialExpressionDescription.trim() === '' ||
            isEqual(form.mRNASource, () => getDefaultSource()) ||
            isEqual(form.clinicalSource, () => getDefaultSource())
    ) && !(form.isEditing && form.differentialExpressionName.trim().length !== 0 && form.differentialExpressionDescription.trim().length !== 0)

    /**
     * Use effect to handle when is editting
     */
    useEffect(() => {
        if (props.experimentToEdit) {
            setForm(prevState => ({
                ...prevState,
                ...cleanForm,
                isEditing: true,
                differentialExpressionName: props.experimentToEdit?.name as string,
                differentialExpressionDescription: props.experimentToEdit?.description as string
            }))
        }
    }, [props.experimentToEdit])

    return (
        <Segment className='diff--side--bar--container table-bordered'>
            <Header textAlign='center' className='margin-top-0'>
                <Icon name='buromobelexperte' />
                <Header.Content>New Differential Expression</Header.Content>
            </Header>
            <Form>
                <Form.Input
                    onChange={(e) => handleChangeForm(e.target.value, 'differentialExpressionName')}
                    type='text'
                    placeholder='Name'
                    className='diff--side--bar--container--item--margin'
                    value={form.differentialExpressionName}
                    icon='asterisk'
                />

                <Form.TextArea
                    style={{ maxWidth: '100%', minWidth: '100%' }}
                    rows={3}
                    onChange={(_, e) => handleChangeForm(e.value ? e.value.toString() : '', 'differentialExpressionDescription')}
                    placeholder='Description'
                    className='diff--side--bar--container--item--margin'
                    value={form.differentialExpressionDescription}
                />
                {/* mRNA SourceForm */}
                <Form.Field>
                    <SourceForm
                        source={form.mRNASource}
                        headerTitle='mRNA profile'
                        headerIcon={{
                            type: 'img',
                            src: 'static/frontend/img/profiles/mRNA.svg'
                        }}
                        fileType={FileType.MRNA}
                        disabled={form.isEditing}
                        tagOptions={[]}
                        handleChangeSourceType={(selectedSourceType) => {
                            handleChangeSourceType(selectedSourceType, 'mRNASource')
                        }}
                        selectNewFile={selectNewFile}
                        selectUploadedFile={(selectedFile) => {
                            selectUploadedFile(selectedFile, 'mRNASource')
                        }}
                        selectStudy={(selectedStudy) => {
                            selectStudy(selectedStudy, 'mRNASource')
                        }}
                    />
                </Form.Field>
                {/* Clinical SourceForm */}
                <Form.Field>
                    <SourceForm
                        source={form.clinicalSource}
                        headerTitle='Clinical profile'
                        headerIcon={{
                            type: 'img',
                            src: '/static/frontend/img/profiles/mRNA.svg'
                        }}
                        fileType={FileType.CLINICAL}
                        disabled={form.isEditing}
                        tagOptions={[]}
                        handleChangeSourceType={(selectedSourceType) => {
                            handleChangeSourceType(selectedSourceType, 'clinicalSource')
                        }}
                        selectNewFile={selectNewFile}
                        selectUploadedFile={(selectedFile) => {
                            selectUploadedFile(selectedFile, 'clinicalSource')
                        }}
                        selectStudy={(selectedStudy) => {
                            selectStudy(selectedStudy, 'clinicalSource')
                        }}
                    />
                </Form.Field>
                <Form.Field>
                    <Label className='full-width align-left'>
                        <p>Samples mRNA: {form.numberOfSamplesMRNA}</p>
                        <p>Samples clinical: {form.numberOfSamplesClinical}</p>
                        <p>Samples in common: {form.numberOfSamplesInCommon}</p>
                    </Label>
                </Form.Field>
                <Form.Field>
                    <DifferentialExpressionInputClinicalAttribute
                        optionsClinicalAttributes={form.optionsClinicalAttributes}
                        clinicalAttribute={form.clinicalAttribute}
                        onChange={(value: string) => handleChangeForm(value, 'clinicalAttribute')}
                        isEditing={form.isEditing}
                    />
                </Form.Field>
                {/* Coefficient threshold slider */}{/* Minimum Standard Deviation for Genes */}
                <Form.Field className='diff--side--container--bar--slider'>
                    <LabelWithInfoPopup
                        labelText={`Threshold percentile: ${form.thresholdPercentile.toFixed(2)}`}
                        popupContent='Percentile threshold for filtering low-expression genes (default 0.15)'
                        centered
                    />

                    <SingleRangeSlider
                        defaultMaxValue={1}
                        defaultMinValue={0}
                        step={0.05}
                        value={form.thresholdPercentile}
                        onChange={(value) => form.isEditing && handleChangeForm(value, 'thresholdPercentile')}
                        className='diff--side--bar--slider'
                        color='blue'
                        disabled={form.isEditing}
                    />

                    <Label color='blue' className='pull-left'>0</Label>
                    <Label color='blue' className='pull-right'>1</Label>
                </Form.Field>
                <Form.Field className='diff--side--container--bar--slider'>
                    <LabelWithInfoPopup
                        labelText={`Threshold std: ${toScientific(form.thresholdStd.toString())}`}
                        popupContent='Variance threshold for gene filtering (default 1e-4)'
                        centered
                    />

                    <SingleRangeSlider
                        defaultMaxValue={0.01}
                        defaultMinValue={0.0001}
                        step={0.0001}
                        value={form.thresholdStd}
                        onChange={(value) => form.isEditing && handleChangeForm(value, 'thresholdStd')}
                        className='diff--side--bar--slider'
                        color='blue'
                        disabled={form.isEditing}
                    />

                    <Label color='blue' className='pull-left'>1e-4</Label>
                    <Label color='blue' className='pull-right'>1e-2</Label>
                </Form.Field>
                <Form.Field className='diff--side--container--bar--slider'>
                    <LabelWithInfoPopup
                        labelText={`Top: ${form.top}`}
                        popupContent='Most significant number of genes to keep as result'
                        centered
                    />

                    <SingleRangeSlider
                        defaultMaxValue={1000}
                        defaultMinValue={10}
                        step={10}
                        value={form.top}
                        onChange={(value) => form.isEditing && handleChangeForm(value, 'top')}
                        className='diff--side--bar--slider'
                        color='blue'
                        disabled={form.isEditing}
                    />

                    <Label color='blue' className='pull-left'>10</Label>
                    <Label color='blue' className='pull-right'>1000</Label>
                </Form.Field>

                <Button
                    type='submit'
                    fluid
                    primary
                    className='margin-top-10'
                    disabled={submitDisabled || form.isLoading}
                    onClick={form.isEditing ? handleEditSubmit : handleSubmit}
                    color='green'
                    loading={form.isLoading}
                >
                    {form.isEditing ? 'Edit experiment' : 'Create experiment'}
                </Button>
            </Form>
            <Button
                className='margin-top-5'
                fluid
                primary
                disabled={(isEqual(form, cleanForm)) || form.isLoading}
                color='red'
                onClick={() => {
                    setForm(cleanForm)
                    props.handleCleanExperimentToEdit()
                }}
            >
                {form.isEditing ? 'Cancel edit' : 'Reset form'}
            </Button>
        </Segment>
    )
}

/**
 * LabelWithInfoPopup's props
 */
interface LabelWithInfoPopupProps {
    labelText: string,
    popupContent: SemanticShorthandItem<PopupContentProps>,
    centered?: boolean
}

/**
 * Renders an label with an info popup. It's defined here for simplicity and reusability
 * @param props Component's props
 * @returns Component
 */
const LabelWithInfoPopup = (props: LabelWithInfoPopupProps) => (
    <Label className={'full-width' + (props.centered ? ' align-center' : '')}>
        {props.labelText}

        <InfoPopup
            content={props.popupContent}
            onTop={false}
            extraClassName='margin-left-2 no-margin-right pull-right'
        />
    </Label>
)
