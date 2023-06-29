import React, { useState } from 'react'
import { ActiveBiomarkerDetailItemMenu, Biomarker } from './types'
import { Nullable } from '../../utils/interfaces'
import { BiomarkerDetailsMenu } from './BiomarkerDetailsMenu'
import { BiomarkerStatisticalValidationPanel } from './biomarker-details-modal/stat-validations/BiomarkerStatisticalValidationPanel'
import { BiomarkerTrainedModelsTable } from './biomarker-details-modal/BiomarkerTrainedModelsTable'
import { MoleculesPanel } from './biomarker-details-modal/molecules/MoleculesPanel'
import { BiomarkerInferenceExperimentsPanel } from './biomarker-details-modal/inference/BiomarkerInferenceExperimentsPanel'

interface BiomarkerDetailsModalProps {
    /** Selected Biomarker instance to show its details. */
    selectedBiomarker: Nullable<Biomarker>,
}

/**
 * Renders a modal with a lot of options to manage a Biomarker data. Such as statistical validations, molecules details
 * among others.
 * @param props Component props.
 * @returns Component.
 */
export const BiomarkerDetailsModal = (props: BiomarkerDetailsModalProps) => {
    const [activeItem, setActiveItem] = useState<ActiveBiomarkerDetailItemMenu>(ActiveBiomarkerDetailItemMenu.MOLECULES_DETAILS)

    if (!props.selectedBiomarker) {
        return null
    }

    /**
     * Gets the selected component according to the active item.
     * @returns The corresponding component
     */
    function getSelectedComponent (): Nullable<JSX.Element> {
        if (!props.selectedBiomarker) {
            return null
        }

        switch (activeItem) {
            case ActiveBiomarkerDetailItemMenu.MOLECULES_DETAILS:
                return <MoleculesPanel selectedBiomarker={props.selectedBiomarker}/>
            case ActiveBiomarkerDetailItemMenu.MODELS:
                return <BiomarkerTrainedModelsTable selectedBiomarker={props.selectedBiomarker} allowFullManagement />
            case ActiveBiomarkerDetailItemMenu.STATISTICAL_VALIDATION:
                return <BiomarkerStatisticalValidationPanel selectedBiomarker={props.selectedBiomarker} />
            case ActiveBiomarkerDetailItemMenu.INFERENCE:
                return <BiomarkerInferenceExperimentsPanel selectedBiomarker={props.selectedBiomarker} />
            default:
                return null // TODO: remove this and change the function return type
        }
    }

    return (
        <>
            {/* Menu */}
            <BiomarkerDetailsMenu activeItem={activeItem} setActiveItem={setActiveItem} selectedBiomarker={props.selectedBiomarker} />

            {/* Selected menu option */}
            {getSelectedComponent()}
        </>
    )
}
