
import React, { useState } from 'react'
import { Biomarker, SourceStateBiomarker, TrainedModel } from '../../types'
import { Nullable, OkResponse, Source, SourceType } from '../../../../utils/interfaces'
import { alertGeneralError, cleanRef, experimentSourceIsValid, getDefaultSource, getDjangoHeader, getFilenameFromSource, makeSourceAndAppend } from '../../../../utils/util_functions'
import { Button, Form, Grid, Header, Icon, Modal, Segment, Step } from 'semantic-ui-react'
import { SourceSelectors } from '../../../common/SourceSelectors'
import { DjangoCGDSStudy, DjangoUserFile } from '../../../../utils/django_interfaces'
import { BiomarkerTrainedModelsTable } from '../BiomarkerTrainedModelsTable'
import ky from 'ky'

declare const urlSubmitInferenceExperiment: string

/** NewInferenceExperimentModal props. */
interface NewInferenceExperimentModalProps {
    /** Selected Biomarker instance. */
    selectedBiomarker: Biomarker,
    /** Flag to open the modal. */
    openModalNewInferenceExperiment: boolean,
    /** Callback to close the modal. */
    closeModal: () => void
}

/** Data to handle in the form of a new InferenceExperiment. */
type NewInferenceExperimentData = {
    name: string,
    description: Nullable<string>,
    /** TrainedModel instance. */
    selectedTrainedModel: Nullable<TrainedModel>,
    /** mRNA source. */
    mRNASource: Source,
    /** mirna source. */
    mirnaSource: Source,
    /** cna source. */
    cnaSource: Source,
    /** methylation source. */
    methylationSource: Source,
}

/**
 * Generates a NewInferenceExperimentData instance.
 * @returns Default NewInferenceExperimentData instance.
 */
const getDefaultNewInferenceExperimentData = (): NewInferenceExperimentData => ({
    name: '',
    description: null,
    selectedTrainedModel: null,
    mRNASource: getDefaultSource(),
    mirnaSource: getDefaultSource(),
    methylationSource: getDefaultSource(),
    cnaSource: getDefaultSource()
})

/**
 * Renders a panel to submit a new InferenceExperiment for the selected Biomarker.
 * @param props Component's props
 * @returns Component
 */
export const NewInferenceExperimentModal = (props: NewInferenceExperimentModalProps) => {
    const [form, setForm] = useState<NewInferenceExperimentData>(getDefaultNewInferenceExperimentData())
    const [currentStep, setCurrentStep] = useState(1)
    const [sendingData, setSendingData] = useState(false)

    /**
     * Handles file input changes to set data to show in form
     * IMPORTANT: this is necessary because the file inputs are uncontrolled components
     * and doesn't trigger an update of the state fields. After updating names in the object, updates the component's state.
     * @param newFormState New state to set to `form`
     */
    const updateSourceFilenamesAndState = (newFormState: NewInferenceExperimentData) => {
        // Updates state filenames
        newFormState.mRNASource.filename = getFilenameFromSource(newFormState.mRNASource)
        newFormState.cnaSource.filename = getFilenameFromSource(newFormState.cnaSource)
        newFormState.methylationSource.filename = getFilenameFromSource(newFormState.methylationSource)
        newFormState.mirnaSource.filename = getFilenameFromSource(newFormState.mirnaSource)
        setForm(newFormState)
    }

    /**
     * Updates Sources' filenames and common examples counter,
     * @param newFormState New state to set to `form`.
     */
    const updateSourceFilenamesAndCommonSamples = (newFormState: NewInferenceExperimentData) => {
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
     * Set a new TrainedModel instance.
     * @param newSelectedTrainedModel New TrainedModel instance
     */
    const selectTrainedModel = (newSelectedTrainedModel: TrainedModel) => {
        setForm({ ...form, selectedTrainedModel: newSelectedTrainedModel })
    }

    /**
     * Returns current component depending on the current step
     * @returns Current component.
     */
    function handleSectionActive () {
        if (currentStep === 1) {
            return (
                <BiomarkerTrainedModelsTable
                    selectedBiomarker={props.selectedBiomarker}
                    showOnlyCompleted
                    allowFullManagement={false}
                    selectedTrainedModel={form.selectedTrainedModel}
                    selectTrainedModel={selectTrainedModel}
                />
            )
        }

        if (currentStep === 2) {
            return (
                <SourceSelectors
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
            )
        }
        return null
    }

    /** Runs a new statistical analysis */
    const runStatisticalAnalysis = () => {
        if (!formIsValid()) {
            return
        }

        setSendingData(true)

        // Generates the FormData
        const formData = new FormData()

        // Appends InferenceExperiment fields
        formData.append('name', form.name)
        formData.append('description', form.description ?? 'null')
        formData.append('trainedModelPk', (form.selectedTrainedModel?.id as number).toString())
        formData.append('biomarkerPk', (props.selectedBiomarker.id as number).toString())

        // Appends the source type, and the file content depending of it (pk if selecting
        // an existing file, Blob content if uploading a new file, etc)
        makeSourceAndAppend(form.mRNASource, formData, 'mRNA')
        makeSourceAndAppend(form.mirnaSource, formData, 'miRNA')
        makeSourceAndAppend(form.cnaSource, formData, 'cna')
        makeSourceAndAppend(form.methylationSource, formData, 'methylation')

        const headers = getDjangoHeader()

        ky.post(urlSubmitInferenceExperiment, { headers, body: formData }).then((response) => {
            response.json().then((jsonResponse: OkResponse) => {
                if (jsonResponse.ok) {
                    props.closeModal()
                } else {
                    alertGeneralError()
                }
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            alertGeneralError()
            console.log('Error adding new InferenceExperiment ->', err)
        }).finally(() => {
            setSendingData(false)
        })
    }

    /**
     * Checks if the sources are valid for a StatisticalAnalysis. Clinical is mandatory, the rest are mandatory only
     * if the Biomarker has that type of molecules.
     * @returns True if all the sources are valid
     */
    const allSourcesAreValid = (): boolean => {
        return (
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
     * Checks if the form is valid to run a inference experiment.
     * @returns True if user can submit the form.
     */
    const formIsValid = (): boolean => {
        return !sendingData &&
            form.name.trim().length > 0 &&
            allSourcesAreValid() &&
            form.selectedTrainedModel?.id !== undefined
    }

    /**
     * Updates the component state from the user input
     * @param e Change event
     */
    const handleInputChange = (e) => {
        const newForm = { ...form }
        newForm[e.target.name] = e.target.value
        setForm(newForm)
    }

    const selectedTrainedModelIsValid = form.selectedTrainedModel?.id !== undefined

    return (
        <Modal
            className='large-modal'
            closeIcon={<Icon name='close' size='large' />}
            closeOnEscape={false}
            centered={false}
            closeOnDimmerClick={false}
            closeOnDocumentClick={false}
            onClose={props.closeModal}
            open={props.openModalNewInferenceExperiment}
        >
            <Modal.Header>
                <Icon name='sitemap' />
                Create new inference experiment
            </Modal.Header>
            <Modal.Content>
                <Grid>
                    {/* Form */}
                    <Grid.Row columns={2} divided>
                        <Grid.Column width={4}>
                            {/* Basic data */}
                            <Segment>
                                <Header dividing as='h2'>Basic data</Header>

                                <Form>
                                    <Form.Input
                                        name='name'
                                        value={form.name}
                                        icon='asterisk'
                                        placeholder='Name'
                                        onChange={handleInputChange}
                                    />

                                    <Form.TextArea
                                        name='description'
                                        value={form.description ?? ''}
                                        placeholder='Description (optional)'
                                        onChange={handleInputChange}
                                    />
                                </Form>

                                <div className="margin-top-2">
                                    <Icon name='asterisk' /> Required field
                                </div>
                            </Segment>
                        </Grid.Column>
                        <Grid.Column width={12}>
                            {/* Steps */}
                            <Step.Group widths={3}>
                                <Step active={currentStep === 1} completed={currentStep > 1} link onClick={() => { setCurrentStep(1) }}>
                                    <Icon name='list' />
                                    <Step.Content>
                                        <Step.Title>Step 1: Trained model</Step.Title>
                                    </Step.Content>
                                </Step>
                                <Step
                                    active={currentStep === 2}
                                    completed={currentStep > 2}
                                    link
                                    disabled={!selectedTrainedModelIsValid}
                                    onClick={() => {
                                        if (selectedTrainedModelIsValid) {
                                            setCurrentStep(2)
                                        }
                                    }}
                                >
                                    <Icon name='boxes' />
                                    <Step.Content>
                                        <Step.Title>Step 2: molecules datasets</Step.Title>
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

            {/* Buttons */}
            <Modal.Actions>
                {currentStep > 1 &&
                    <Button
                        color="red"
                        onClick={() => setCurrentStep(currentStep - 1)}
                    >
                        Go back
                    </Button>
                }

                {/* Continue button */}
                {currentStep === 1 &&
                    <Button
                        color="green"
                        loading={sendingData}
                        onClick={() => {
                            setCurrentStep(currentStep + 1)
                        }}
                        disabled={!selectedTrainedModelIsValid}
                    >
                        Continue
                    </Button>
                }

                {/* Submit StatisticalAnalysis button */}
                {currentStep === 2 &&
                    <Button
                        color="green"
                        loading={sendingData}
                        onClick={() => {
                            runStatisticalAnalysis()
                        }}
                        disabled={!formIsValid()}
                    >
                        Confirm
                    </Button>
                }
            </Modal.Actions>
        </Modal>
    )
}
