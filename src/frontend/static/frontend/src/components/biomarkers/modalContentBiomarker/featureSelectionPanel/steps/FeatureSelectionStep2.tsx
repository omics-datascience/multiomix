import React from 'react'
import { Button } from 'semantic-ui-react'
import { DjangoCGDSStudy, DjangoUserFile } from '../../../../../utils/django_interfaces'
import { Source, SourceType } from '../../../../../utils/interfaces'
import { experimentSourceIsValid } from '../../../../../utils/util_functions'
import { FeatureSelectionPanelData, SourceStateBiomarker } from '../../../types'
import { SourceSelectors } from '../../../../common/SourceSelectors'

// Styles
import './../featureSelection.css'

/** FeatureSelectionStep2 props. */
interface FeatureSelectionStep2Props {
    featureSelectionData: FeatureSelectionPanelData,
    selectNewFile: () => void,
    selectStudy: (selectedStudy: DjangoCGDSStudy, sourceStateName: SourceStateBiomarker) => void,
    selectUploadedFile: (selectedFile: DjangoUserFile, sourceStateName: SourceStateBiomarker) => void,
    handleChangeSourceType: (sourceType: SourceType, sourceStateName: SourceStateBiomarker) => void,
    handleCompleteStep2: () => void,
    cancelForm: () => void,
}

/**
 * Renders all the form's inputs to handle the second step in a Feature Selection process.
 * @param props Component props.
 * @returns Component.
 */
export const FeatureSelectionStep2 = (props: FeatureSelectionStep2Props) => {
    const {
        featureSelectionData: featureSelection,
        handleChangeSourceType,
        selectNewFile,
        selectUploadedFile,
        selectStudy,
        handleCompleteStep2
    } = props

    /**
     * Validate if the source validation applies
     * @param condition Condition to check
     * @param source Source to validate
     * @returns True if applies or if it not necessary to validate
     */

    const checkIfSourceApplies = (condition: number | undefined, source: Source) => {
        if (!condition) {
            return true
        }
        return experimentSourceIsValid(source)
    }

    /**
     * Function to check if the source are validated
     * @returns True if the clinical source is valid and experiments sources if each one applies
     */

    const allSourcesAreValid = () => {
        const mirnaValidation = checkIfSourceApplies(featureSelection.biomarker?.number_of_mirnas, featureSelection.mirnaSource)
        const cnaValidation = checkIfSourceApplies(featureSelection.biomarker?.number_of_cnas, featureSelection.cnaSource)
        const methylationValidation = checkIfSourceApplies(featureSelection.biomarker?.number_of_methylations, featureSelection.methylationSource)
        const mRNAValidation = checkIfSourceApplies(featureSelection.biomarker?.number_of_mrnas, featureSelection.mRNASource)

        return experimentSourceIsValid(featureSelection.clinicalSource) &&
            mirnaValidation &&
            cnaValidation &&
            methylationValidation &&
            mRNAValidation
    }
    return (
        <>
            {/* Sources */}
            <SourceSelectors
                clinicalSource={{ source: featureSelection.clinicalSource }}
                mRNASource={{
                    source: featureSelection.mRNASource,
                    disabled: !featureSelection.selectedBiomarker?.number_of_mrnas
                }}
                mirnaSource={{
                    source: featureSelection.mirnaSource,
                    disabled: !featureSelection.selectedBiomarker?.number_of_mirnas
                }}
                cnaSource={{
                    source: featureSelection.cnaSource,
                    disabled: !featureSelection.selectedBiomarker?.number_of_cnas
                }}
                methylationSource={{
                    source: featureSelection.methylationSource,
                    disabled: !featureSelection.selectedBiomarker?.number_of_methylations
                }}
                handleChangeSourceType={handleChangeSourceType}
                selectNewFile={selectNewFile}
                selectUploadedFile={selectUploadedFile}
                selectStudy={selectStudy}
            />

            {/* Buttons */}
            <div className='selections-buttons-container'>
                <Button
                    color="red"
                    onClick={props.cancelForm}
                >
                    Cancel
                </Button>
                <Button
                    color="green"
                    onClick={() => handleCompleteStep2()}
                    disabled={!allSourcesAreValid()}
                >
                    Confirm
                </Button>
            </div>
        </>
    )
}
