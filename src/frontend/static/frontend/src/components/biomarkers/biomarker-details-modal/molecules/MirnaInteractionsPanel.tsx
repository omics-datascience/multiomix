import React from 'react'
import { BiomarkerMolecule } from '../../types'
import { MiRNATargetInteractionPanel } from '../../../pipeline/experiment-result/gene-gem-details/MiRNATargetInteractionPanel'
import { Nullable } from '../../../../utils/interfaces'

interface MirnaInteractionsPanelProps {
    /** Selected Biomarker instance to retrieve its TrainedModel instances. */
    selectedMolecule: BiomarkerMolecule,
    /** Gene identifier. */
    gene: Nullable<string>,
    /** miRNA identifier. */
    miRNA: Nullable<string>,
}

export const MirnaInteractionsPanel = (props: MirnaInteractionsPanelProps) => {
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
