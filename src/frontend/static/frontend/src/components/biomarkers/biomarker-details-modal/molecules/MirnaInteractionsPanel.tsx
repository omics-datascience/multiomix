import React from 'react'
import { BiomarkerMolecule } from '../../types'
import { MiRNATargetInteractionPanel } from '../../../pipeline/experiment-result/gene-gem-details/MiRNATargetInteractionPanel'
import { Nullable } from '../../../../utils/interfaces'

interface Props {
    /** Selected Biomarker instance to retrieve its TrainedModel instances. */
    selectedMolecule: BiomarkerMolecule,
    gene: Nullable<string>,
    miRNA: Nullable<string>,
}

export const MirnaInteractionsPanel = (props: Props) => {
    const { selectedMolecule, gene, miRNA } = props
    return (
        <>
            <MiRNATargetInteractionPanel
                identifier={selectedMolecule.identifier}
                gene={gene} // para mrna y cna se envia el gem
                miRNA={miRNA} // para los otros 2
            />
        </>

    )
}
