import React from 'react'
import { BiomarkerMolecule } from '../../types'
import { MoleculeType } from '../../../../utils/interfaces'
import { GeneInformation } from './genes/GeneInformation'
import { MiRNAInformation } from './mirnas/MiRNAInformation'

/** MoleculeGeneralInformation props. */
interface MoleculeGeneralInformationProps {
    /** Selected BiomarkerMolecule instance to show the options. */
    selectedMolecule: BiomarkerMolecule,
}

/**
 * Renders a panel with general information of a molecule
 * @param props Component props.
 * @returns Component.
 */
export const MoleculeGeneralInformation = (props: MoleculeGeneralInformationProps) => {
    // Genes panel
    if ([MoleculeType.MRNA, MoleculeType.CNA].includes(props.selectedMolecule.type)) {
        return <GeneInformation selectedMolecule={props.selectedMolecule} />
    }

    if (props.selectedMolecule.type === MoleculeType.MIRNA) {
        return <MiRNAInformation selectedMiRNA={props.selectedMolecule.identifier} />
    }

    // TODO: implement Methylation
    return (
        null
    )
}
