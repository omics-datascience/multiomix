import React from 'react'
import { BiomarkerStatisticalValidationsTable } from './BiomarkerStatisticalValidationsTable'
import { Biomarker } from '../types'

/** BiomarkerStatisticalValidationPanel props. */
interface BiomarkerStatisticalValidationPanelProps {
    /** Selected Biomarker instance to get its statistical validations. */
    selectedBiomarker: Biomarker
}

/**
 * Renders a panel to make statistical validations for a specific Biomarker.
 * @param props Component props.
 * @returns Component.
 */
export const BiomarkerStatisticalValidationPanel = (props: BiomarkerStatisticalValidationPanelProps) => {
    return (
        <BiomarkerStatisticalValidationsTable selectedBiomarker={props.selectedBiomarker} />
    )
}
