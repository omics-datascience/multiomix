import React from 'react'
import { Biomarker } from '../../types'
import { BiomarkerMoleculesTable } from './BiomarkerMoleculesTable'

/** BiomarkerMoleculesPanel props. */
interface BiomarkerMoleculesPanelProps {
    /** Selected Biomarker instance to get its statistical validations. */
    selectedBiomarker: Biomarker
}

/**
 * Renders a panel to make statistical validations for a specific Biomarker.
 * @param props Component props.
 * @returns Component.
 */
export const BiomarkerMoleculesPanel = (props: BiomarkerMoleculesPanelProps) => {
    /* TODO: add a grid, in the left, the table, in the right the details */
    return (
        <BiomarkerMoleculesTable selectedBiomarker={props.selectedBiomarker} />
    )
}
