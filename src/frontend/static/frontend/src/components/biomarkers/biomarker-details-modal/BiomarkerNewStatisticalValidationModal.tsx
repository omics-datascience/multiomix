
import React, { useState } from 'react'
import { Biomarker, StatisticalValidationType } from '../types'
import { Nullable, Source } from '../../../utils/interfaces'
import { getDefaultSource } from '../../../utils/util_functions'
import { Icon, Segment, Step } from 'semantic-ui-react'

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
    clinicalSource: getDefaultSource(),
    mRNASource: getDefaultSource(),
    mirnaSource: getDefaultSource(),
    methylationSource: getDefaultSource(),
    cnaSource: getDefaultSource(),
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
     * Returns current component depending on the current step
     * @returns Current component.
     */
    function handleSectionActive () {
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
        </div>
    )
}
