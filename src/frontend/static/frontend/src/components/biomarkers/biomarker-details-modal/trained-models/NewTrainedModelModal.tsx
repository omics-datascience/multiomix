import React, { useState } from 'react'
import { Biomarker, FitnessFunction, SVMKernel, SVMParameters, SVMTask, SourceStateBiomarker } from '../../types'
import { Button, Form, Grid, Header, Icon, InputOnChangeData, Modal, Segment, Select, Step } from 'semantic-ui-react'
import { fitnessFunctionsOptions } from '../../utils'
import { Nullable, OkResponse, Source, SourceType } from '../../../../utils/interfaces'
import { NewSVMModelForm } from './NewSVMModelForm'
import { SourceSelectors } from '../../../common/SourceSelectors'
import { alertGeneralError, cleanRef, experimentSourceIsValid, getDefaultSource, getDjangoHeader, getFilenameFromSource, makeSourceAndAppend } from '../../../../utils/util_functions'
import { DjangoCGDSStudy, DjangoUserFile } from '../../../../utils/django_interfaces'
import ky from 'ky'

declare const urlNewTrainedModel: string

/** Available CrossValidation types. */
enum CrossValidationType {
    CROSS_VALIDATION = 1,
    LEAVE_ONE_OUT = 2
}

/** NewTrainedModelModal props. */
interface NewTrainedModelModalProps {
    /** Selected Biomarker instance to retrieve its TrainedModel instances. */
    selectedBiomarker: Biomarker,
    showNewTrainedModelModal: boolean,
    setShowNewTrainedModelModal: (state: boolean) => void
}

/** CV parameters. */
interface CrossValidationParameters {
    type: CrossValidationType,
    folds: number
}

/** TODO: complete */
type NewTrainedModelClusteringParameters = {

}

/** TODO: complete */
type NewTrainedModelRFParameters = {

}

type ModelParameters = {
    svmParameters: SVMParameters,
    clusteringParameters: NewTrainedModelClusteringParameters,
    rfParameters: NewTrainedModelRFParameters
}

/** Data to handle in the form of a new StatisticalValidation. */
type NewTrainedModelData = {
    name: string,
    description: Nullable<string>,
    selectedFitnessFunction: Nullable<FitnessFunction>,
    crossValidationParameters: CrossValidationParameters,
    /** TrainedModel instance. */
    modelParameters: ModelParameters,
    /** Clinical source. */
    clinicalSource: Source,
    /** mRNA source. */
    mRNASource: Source,
    /** mirna source. */
    mirnaSource: Source,
    /** cna source. */
    cnaSource: Source,
    /** methylation source. */
    methylationSource: Source,
}

const getDefaultModelParameters = (): ModelParameters => ({
    svmParameters: {
        task: SVMTask.REGRESSION,
        maxIterations: 1000,
        kernel: SVMKernel.LINEAR,
        randomState: null
    },
    clusteringParameters: {},
    rfParameters: {}
})

/**
 * Generates a NewTrainedModelData instance.
 * @returns Default NewTrainedModelData instance.
 */
const getDefaultNewTrainedModelData = (): NewTrainedModelData => ({
    name: '',
    description: null,
    selectedFitnessFunction: null,
    crossValidationParameters: {
        type: CrossValidationType.CROSS_VALIDATION,
        folds: 10
    },
    modelParameters: getDefaultModelParameters(),
    clinicalSource: getDefaultSource(),
    mRNASource: getDefaultSource(),
    mirnaSource: getDefaultSource(),
    methylationSource: getDefaultSource(),
    cnaSource: getDefaultSource()
})

/**
 * Renders a panel to add a new TrainedModel instance.
 * @param props Component props.
 * @returns Component.
 */
const NewTrainedModelModal = (props: NewTrainedModelModalProps) => {
    const [form, setForm] = useState<NewTrainedModelData>(getDefaultNewTrainedModelData())
    const [currentStep, setCurrentStep] = useState<1 | 2>(1)
    const [sendingData, setSendingData] = useState(false)

    const selectedFitnessFunction = form.selectedFitnessFunction

    /**
     * Handles changes in any model's parameters form.
     * @param model Model to edit
     * @param data Data with the name and current value of the input element.
     */
    const handleChangeParamsGeneric = (model: keyof ModelParameters, data: InputOnChangeData) => {
        const { name, value } = data
        const newParameters = { ...form.modelParameters[model], [name]: value }
        setForm({ ...form, modelParameters: { ...form.modelParameters, [model]: newParameters } })
    }

    /**
     * Handles changes in the SVM model's parameters form.
     * @param _event Event of change of the input element.
     * @param data Data with the name and current value of the input element.
     */
    const handleChangeParamsSVM = (_event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => {
        handleChangeParamsGeneric('svmParameters', data)
    }

    /**
     * Handles changes in the name/description inputs.
     * @param name Name of
     * @param value New value to set.
     */
    const handleInputChanges = (name: 'name' | 'description', value: string | undefined) => {
        setForm({ ...form, [name]: value })
    }

    /**
     * Handles changes in the FitnessFunction select.
     * @param selectedFitnessFunction New FitnessFunction value.
     */
    const handleChangeFitnessValue = (selectedFitnessFunction: FitnessFunction) => {
        setForm({ ...form, selectedFitnessFunction })
    }

    const getModelForm = (): Nullable<JSX.Element> => {
        switch (selectedFitnessFunction) {
            case FitnessFunction.SVM:
                return <NewSVMModelForm parameters={form.modelParameters.svmParameters} handleChangeParams={handleChangeParamsSVM} />
            default:
                return null
        }
    }

    /**
     * Handles file input changes to set data to show in form
     * IMPORTANT: this is necessary because the file inputs are uncontrolled components
     * and doesn't trigger an update of the state fields. After updating names in the object, updates the component's state.
     * @param newFormState New state to set to `form`
     */
    const updateSourceFilenamesAndState = (newFormState: NewTrainedModelData) => {
        // Updates state filenames
        newFormState.mRNASource.filename = getFilenameFromSource(newFormState.mRNASource)
        newFormState.clinicalSource.filename = getFilenameFromSource(newFormState.clinicalSource)
        newFormState.cnaSource.filename = getFilenameFromSource(newFormState.cnaSource)
        newFormState.methylationSource.filename = getFilenameFromSource(newFormState.methylationSource)
        newFormState.mirnaSource.filename = getFilenameFromSource(newFormState.mirnaSource)
        setForm(newFormState)
    }

    /**
     * Updates Sources' filenames and common examples counter,
     * @param newFormState New state to set to `form`.
     */
    const updateSourceFilenamesAndCommonSamples = (newFormState: NewTrainedModelData) => {
        updateSourceFilenamesAndState(newFormState)
        // this.checkCommonSamples() TODO: check function and dependencies functions in file Pipeline.tsx
    }

    /**
     * Change the source state to submit a pipeline
     * @param sourceType New selected Source
     * @param sourceStateName Source's name in state object to update
     */
    const handleChangeSourceType = (sourceType: SourceType, sourceStateName: SourceStateBiomarker) => {
        // Selects source to update
        const newFormState = { ...form }
        const source = newFormState[sourceStateName]
        // Change source type
        source.type = sourceType

        // Resets all source values
        source.selectedExistingFile = null
        source.CGDSStudy = null
        cleanRef(source.newUploadedFileRef)

        // After update state
        updateSourceFilenamesAndCommonSamples(newFormState)
    }

    /** Makes a copy of the form state and updates the filenames. */
    const selectNewFile = () => { updateSourceFilenamesAndCommonSamples({ ...form }) }

    /**
     * Selects a CGDS Study as a source
     * @param selectedStudy Selected Study as Source
     * @param sourceStateName Source's name in state object to update
     */
    const selectStudy = (selectedStudy: DjangoCGDSStudy, sourceStateName: SourceStateBiomarker) => {
        // Selects source to update
        const newFormState = { ...form }
        const source = newFormState[sourceStateName]

        source.type = SourceType.CGDS
        source.CGDSStudy = selectedStudy
        updateSourceFilenamesAndCommonSamples(newFormState)
    }

    /**
     * Selects a User's file as a source
     * @param selectedFile Selected file as Source
     * @param sourceStateName Source's name in state object to update
     */
    const selectUploadedFile = (selectedFile: DjangoUserFile, sourceStateName: SourceStateBiomarker) => {
        // Selects source to update
        const newFormState = { ...form }
        const source = newFormState[sourceStateName]

        source.type = SourceType.UPLOADED_DATASETS
        source.selectedExistingFile = selectedFile
        updateSourceFilenamesAndCommonSamples(newFormState)
    }

    /**
     * Checks if the sources are valid for a StatisticalAnalysis. Clinical is mandatory, the rest are mandatory only
     * if the Biomarker has that type of molecules.
     * @returns True if all the sources are valid
     */
    const allSourcesAreValid = (): boolean => {
        return experimentSourceIsValid(form.clinicalSource) &&
            (
                props.selectedBiomarker.number_of_mirnas === 0 ||
                (props.selectedBiomarker.number_of_mirnas > 0 && experimentSourceIsValid(form.mirnaSource))
            ) &&
            (
                props.selectedBiomarker.number_of_cnas === 0 ||
                (props.selectedBiomarker.number_of_cnas > 0 && experimentSourceIsValid(form.cnaSource))
            ) &&
            (
                props.selectedBiomarker.number_of_methylations === 0 ||
                (props.selectedBiomarker.number_of_methylations > 0 && experimentSourceIsValid(form.methylationSource))
            ) &&
            (
                props.selectedBiomarker.number_of_mrnas === 0 ||
                (props.selectedBiomarker.number_of_mrnas > 0 && experimentSourceIsValid(form.mRNASource))
            )
    }

    /**
     * Checks that all the parameters for the different types of models are valid.
     * @returns True if parameters are valid, false otherwise
     */
    const modelParametersAreValid = (): boolean => {
        const modelParameters = form.modelParameters
        switch (selectedFitnessFunction) {
            case FitnessFunction.SVM: {
                const svmParameters = modelParameters.svmParameters
                return svmParameters.maxIterations > 100 && svmParameters.maxIterations < 2000
            }
            // TODO: implement all cases
            default:
                return false
        }
    }

    /**
     * Return `true` if the form is valid to submit
     * @returns True if the form is valid. False otherwise.
     */
    const formIsValid = (): boolean => {
        return !sendingData &&
            form.name.trim().length > 0 &&
            modelParametersAreValid() &&
            allSourcesAreValid()
    }

    /** Runs a new training to get a new TrainedModel for this Biomarker. */
    const runNewTrainedModel = () => {
        if (!formIsValid()) {
            return
        }

        setSendingData(true)

        // Generates the FormData
        const formData = new FormData()

        // Appends StatisticalValidation fields
        formData.append('name', form.name)
        formData.append('description', form.description ?? 'null')
        formData.append('fitnessFunction', (form.selectedFitnessFunction as FitnessFunction).toString())
        formData.append('crossValidationType', form.crossValidationParameters.type.toString())
        formData.append('crossValidationFolds', form.crossValidationParameters.folds.toString())
        formData.append('biomarkerPk', (props.selectedBiomarker.id as number).toString())
        formData.append('modelParameters', JSON.stringify(form.modelParameters))

        // Appends all the parameters for the model
        for (const [parameterName, parameterValue] of Object.entries(form.modelParameters)) {
            formData.append(parameterName, parameterValue.toString())
        }

        // Appends the source type, and the file content depending of it (pk if selecting
        // an existing file, Blob content if uploading a new file, etc)
        makeSourceAndAppend(form.mRNASource, formData, 'mRNA')
        makeSourceAndAppend(form.mirnaSource, formData, 'miRNA')
        makeSourceAndAppend(form.cnaSource, formData, 'cna')
        makeSourceAndAppend(form.methylationSource, formData, 'methylation')
        makeSourceAndAppend(form.clinicalSource, formData, 'clinical')

        const headers = getDjangoHeader()

        ky.post(urlNewTrainedModel, { headers, body: formData }).then((response) => {
            response.json().then((jsonResponse: OkResponse) => {
                if (jsonResponse.ok) {
                    props.setShowNewTrainedModelModal(false)
                } else {
                    alertGeneralError()
                }
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            alertGeneralError()
            console.log('Error adding new TrainedModel ->', err)
        }).finally(() => {
            setSendingData(false)
        })
    }

    /**
     * Handles changes in the CrossValidation form.
     * @param name Name of the input to change.
     * @param value New value to assign.
     */
    const handleCVParametersChange = (name: keyof CrossValidationParameters, value: CrossValidationType | number) => {
        setForm({ ...form, crossValidationParameters: { ...form.crossValidationParameters, [name]: value } })
    }

    /**
     * Shows the corresponding section depending on the current selected step.
     * @returns Corresponding component.
     */
    const handleSectionActive = (): JSX.Element => {
        switch (currentStep) {
            case 1:
                // Model parameters panel
                return (
                    <Grid>
                        <Grid.Row columns={3} divided>
                            <Grid.Column width={5}>
                                <Header as='h4'>Select a new model to train</Header>

                                <Form>
                                    <Form.Field
                                        control={Select}
                                        options={fitnessFunctionsOptions}
                                        value={selectedFitnessFunction}
                                        onChange={(_, { value }) => { handleChangeFitnessValue(value) }}
                                        placeholder='Select a model'
                                    />
                                </Form>
                            </Grid.Column>

                            {/* Specific model params */}
                            <Grid.Column width={6}>
                                {selectedFitnessFunction !== null &&
                                    <Header as='h4'>Select model parameters</Header>
                                }

                                <Form>
                                    {getModelForm()}
                                </Form>
                            </Grid.Column>

                            {/* Specific model params */}
                            <Grid.Column width={5}>
                                <Header as='h4'>Select optimization process</Header>

                                <Form.Select
                                    fluid
                                    label='Cross Validation method'
                                    options={[
                                        { key: CrossValidationType.CROSS_VALIDATION, text: 'Normal', value: CrossValidationType.CROSS_VALIDATION },
                                        { key: CrossValidationType.LEAVE_ONE_OUT, text: 'Leave One Out', value: CrossValidationType.LEAVE_ONE_OUT }
                                    ]}
                                    placeholder='Select a CV method'
                                    name='type'
                                    value={form.crossValidationParameters.type}
                                    onChange={(_, { name, value }) => { handleCVParametersChange(name, value as any) }}
                                />

                                {form.crossValidationParameters.type === CrossValidationType.CROSS_VALIDATION &&
                                    <Form.Input
                                        fluid
                                        label='Number of folds'
                                        placeholder='An integer number'
                                        type='number'
                                        step={1}
                                        min={3}
                                        max={10}
                                        name='folds'
                                        value={form.crossValidationParameters.folds}
                                        onChange={(_, { name, value }) => { handleCVParametersChange(name, value as any) }}
                                    />
                                }
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                )
            case 2:
                // Sources panel
                return (
                    <Grid>

                        <Grid.Row columns={1}>
                            <Grid.Column>
                                <SourceSelectors
                                    clinicalSource={{ source: form.clinicalSource }}
                                    mRNASource={{
                                        source: form.mRNASource,
                                        disabled: !props.selectedBiomarker.number_of_mrnas
                                    }}
                                    mirnaSource={{
                                        source: form.mirnaSource,
                                        disabled: !props.selectedBiomarker.number_of_mirnas
                                    }}
                                    cnaSource={{
                                        source: form.cnaSource,
                                        disabled: !props.selectedBiomarker.number_of_cnas
                                    }}
                                    methylationSource={{
                                        source: form.methylationSource,
                                        disabled: !props.selectedBiomarker.number_of_methylations
                                    }}
                                    handleChangeSourceType={handleChangeSourceType}
                                    selectNewFile={selectNewFile}
                                    selectUploadedFile={selectUploadedFile}
                                    selectStudy={selectStudy}
                                />
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                )
        }
    }

    const modelIsValid = modelParametersAreValid()
    const isLastStep = currentStep === 2

    return (
        <Modal
            className='large-modal'
            onClose={() => props.setShowNewTrainedModelModal(false)}
            onOpen={() => props.setShowNewTrainedModelModal(true)}
            closeOnEscape={false}
            centered={false}
            closeOnDimmerClick={false}
            closeOnDocumentClick={false}
            closeIcon={<Icon name='close' size='large' />}
            open={props.showNewTrainedModelModal}
        >
            <Modal.Header>
                <Icon name='code branch' />
                    Create new trained model
            </Modal.Header>
            <Modal.Content>
                <Grid>
                    <Grid.Row columns={2} divided>
                        <Grid.Column width={4}>
                            <Header dividing as='h2'>Basic data</Header>

                            <Form>
                                <Form.Input
                                    icon='asterisk'
                                    placeholder='Name'
                                    name='name'
                                    value={form.name}
                                    onChange={(_, { name, value }) => handleInputChanges(name, value)}
                                    maxLength={100}
                                />

                                <Form.TextArea
                                    placeholder='Description (optional)'
                                    name='description'
                                    value={form.description ?? undefined}
                                    onChange={(_, { name, value }) => handleInputChanges(name, value as string | undefined)}
                                />
                            </Form>

                            <div className="margin-top-2">
                                <Icon name='asterisk' /> Required field
                            </div>
                        </Grid.Column>
                        <Grid.Column id='column-new-trained-model' width={12}>
                            {/* Steps */}
                            <Step.Group widths={3}>
                                <Step active={currentStep === 1} completed={currentStep > 1} link onClick={() => { setCurrentStep(1) }}>
                                    <Icon name='truck' />
                                    <Step.Content>
                                        <Step.Title>Step 1: Training parameters</Step.Title>
                                    </Step.Content>
                                </Step>
                                <Step
                                    active={currentStep === 2}
                                    completed={currentStep > 2}
                                    link
                                    disabled={!modelIsValid}
                                    onClick={() => {
                                        if (modelIsValid) {
                                            setCurrentStep(2)
                                        }
                                    }}
                                >
                                    <Icon name='credit card' />
                                    <Step.Content>
                                        <Step.Title>Step 2: Training datasets</Step.Title>
                                    </Step.Content>
                                </Step>
                            </Step.Group>

                            {/* Active panel */}
                            <Segment>
                                {handleSectionActive()}
                            </Segment>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Modal.Content>
            <Modal.Actions>
                <Button onClick={() => props.setShowNewTrainedModelModal(false)}>Cancel</Button>

                {/* Submit StatisticalAnalysis button */}
                <Button
                    color="green"
                    loading={sendingData}
                    onClick={() => {
                        if (isLastStep) {
                            runNewTrainedModel()
                        } else {
                            setCurrentStep(2)
                        }
                    }}
                    disabled={isLastStep ? !formIsValid() : !modelIsValid}
                >
                    {isLastStep ? 'Confirm' : 'Continue'}
                </Button>
            </Modal.Actions>
        </Modal>

    )
}

export {
    NewTrainedModelClusteringParameters,
    NewTrainedModelRFParameters,
    NewTrainedModelModal
}
