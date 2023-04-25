import React from 'react'
import { Button } from 'semantic-ui-react'
import { DjangoCGDSStudy, DjangoUserFile } from '../../../../../utils/django_interfaces'
import { SourceType } from '../../../../../utils/interfaces'
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
    handleGoBackStep1: () => void,
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
        handleCompleteStep2,
        handleGoBackStep1
    } = props

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
                    onClick={() => handleGoBackStep1()}
                >
                    Go back
                </Button>
                <Button
                    color="green"
                    onClick={() => handleCompleteStep2()}
                    disabled={!experimentSourceIsValid(props.featureSelectionData.clinicalSource)}
                >
                    Confirm
                </Button>
            </div>
        </>
    )
}
