import React from 'react'
import { DjangoCGDSStudy, DjangoUserFile } from '../../../../../utils/django_interfaces'
import { SourceType } from '../../../../../utils/interfaces'
import { FeatureSelectionPanelData, SourceStateBiomarker } from '../../../types'
import { SourceSelectors } from '../../../../common/SourceSelectors'

// Styles
import './../featureSelection.css'

/** FeatureSelectionStep2 props. */
interface FeatureSelectionStep2Props {
    featureSelection: FeatureSelectionPanelData,
    selectNewFile: () => void,
    selectStudy: (selectedStudy: DjangoCGDSStudy, sourceStateName: SourceStateBiomarker) => void,
    selectUploadedFile: (selectedFile: DjangoUserFile, sourceStateName: SourceStateBiomarker) => void,
    handleChangeSourceType: (sourceType: SourceType, sourceStateName: SourceStateBiomarker) => void,
}

/**
 * Renders all the form's inputs to handle the second step in a Feature Selection process.
 * @param props Component props.
 * @returns Component.
 */
export const FeatureSelectionStep2 = (props: FeatureSelectionStep2Props) => {
    const {
        featureSelection,
        handleChangeSourceType,
        selectNewFile,
        selectUploadedFile,
        selectStudy
    } = props

    return (

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
    )
}
