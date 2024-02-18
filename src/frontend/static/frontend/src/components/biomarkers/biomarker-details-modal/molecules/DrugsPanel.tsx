import React from 'react'
import { BiomarkerMolecule } from '../../types'
import { MiRNADrugsPanel } from '../../../pipeline/experiment-result/gene-gem-details/MiRNADrugsPanel'
interface BiomarkerDiseasesPanelProps {
    /** Selected Biomarker instance to retrieve its TrainedModel instances. */
    selectedMolecule: BiomarkerMolecule,

}

export const DrugsPanel = (props: BiomarkerDiseasesPanelProps) => {
    const { selectedMolecule } = props

    return (
        <div>
            <MiRNADrugsPanel miRNA={selectedMolecule.identifier} identifier={selectedMolecule.identifier} />
        </div>
    )
}
