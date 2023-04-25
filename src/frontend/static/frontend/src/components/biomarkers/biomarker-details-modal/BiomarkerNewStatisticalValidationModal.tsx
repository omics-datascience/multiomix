
import React, { useState } from 'react'
import { Biomarker, SourceStateBiomarker, StatisticalValidationType, TrainedModel } from '../types'
import { Nullable, Source, SourceType } from '../../../utils/interfaces'
import { cleanRef, getDefaultSource, getFilenameFromSource } from '../../../utils/util_functions'
import { Button, Icon, Segment, Step } from 'semantic-ui-react'
import { SourceSelectors } from '../../common/SourceSelectors'
import { DjangoCGDSStudy, DjangoUserFile } from '../../../utils/django_interfaces'
import { BiomarkerTrainedModelsTable } from './BiomarkerTrainedModelsTable'

/** BiomarkerNewStatisticalValidationModal props. */
interface BiomarkerNewStatisticalValidationModalProps {
    /** Selected Biomarker instance. */
    selectedBiomarker: Biomarker
}

/** Data to handle in the form of a new StatisticalValidation. */
type NewStatisticalValidationData = {
    name: string,
    description: Nullable<string>,
    type: Nullable<StatisticalValidationType>,
    /** TrainedModel instance. */
    selectedTrainedModel: Nullable<TrainedModel>,
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

/**
 * Generates a NewStatisticalValidationData instance.
 * @returns Default NewStatisticalValidationData instance.
 */
const getDefaultNewStatisticalValidationData = (): NewStatisticalValidationData => ({
    name: '',
    description: null,
    type: null,
    selectedTrainedModel: null,
    clinicalSource: getDefaultSource(),
    mRNASource: getDefaultSource(),
    mirnaSource: getDefaultSource(),
    methylationSource: getDefaultSource(),
    cnaSource: getDefaultSource()
})

/**
 * TODO: complete
 * @param props Component's props
 * @returns Component
 */
export const BiomarkerNewStatisticalValidationModal = (props: BiomarkerNewStatisticalValidationModalProps) => {
    const [form, setForm] = useState<NewStatisticalValidationData>(getDefaultNewStatisticalValidationData())
    const [currentStep, setCurrentStep] = useState(1)

    /**
     * Handles file input changes to set data to show in form
     * IMPORTANT: this is necessary because the file inputs are uncontrolled components
     * and doesn't trigger an update of the state fields. After updating names in the object, updates the component's state.
     * @param newFormState New state to set to `form`
     */
    const updateSourceFilenamesAndState = (newFormState: NewStatisticalValidationData) => {
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
    const updateSourceFilenamesAndCommonSamples = (newFormState: NewStatisticalValidationData) => {
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
            )
        }

        if (currentStep === 2) {
            return (
                <BiomarkerTrainedModelsTable
                    selectedBiomarker={props.selectedBiomarker}
                    selectedTrainedModel={form.selectedTrainedModel}
                    selectTrainedModel={selectTrainedModel}
                />
            )
        }
        return null
    }

    return (
        <div className='selection-main-container'>
            {/* Steps */}
            <Step.Group widths={3}>
                <Step active={currentStep === 1} completed={currentStep > 1} link onClick={() => { setCurrentStep(1) }}>
                    <Icon name='truck' />
                    <Step.Content>
                        <Step.Title>Step 1: Datasets</Step.Title>
                    </Step.Content>
                </Step>
                <Step active={currentStep === 2} completed={currentStep > 2} link onClick={() => { setCurrentStep(2) }}>
                    <Icon name='credit card' />
                    <Step.Content>
                        <Step.Title>Step 2: Trained model</Step.Title>
                    </Step.Content>
                </Step>
            </Step.Group>

            {/* Content */}
            <Segment className='selection-steps-container'>
                {handleSectionActive()}
            </Segment>

            {/* Buttons */}
            <div className='selections-buttons-container'>
                {currentStep > 1 &&
                    <Button
                        color="red"
                        onClick={() => setCurrentStep(currentStep - 1)}
                    >
                        Go back
                    </Button>
                }

                <Button
                    color="green"
                    onClick={() => {
                        if (currentStep === 1) {
                            setCurrentStep(currentStep + 1)
                        } else {
                            // runStatisticalAnalysis()
                        }
                    }}
                    // disabled={!experimentSourceIsValid(props.featureSelectionData.clinicalSource)}  // TODO: implement
                >
                    {currentStep === 1 ? 'Continue' : 'Confirm'}
                </Button>
            </div>
        </div>
    )
}
