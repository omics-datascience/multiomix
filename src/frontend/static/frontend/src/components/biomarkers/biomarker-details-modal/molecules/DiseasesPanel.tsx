import React from 'react'
import { BiomarkerMolecule } from '../../types'
import { MiRNADiseasesPanel } from '../../../pipeline/experiment-result/gene-gem-details/MiRNADiseasesPanel'

interface BiomarkerDiseasesPanelProps {
    /** Selected Biomarker instance to retrieve its TrainedModel instances. */
    selectedMolecule: BiomarkerMolecule,

}

export const DiseasesPanel = (props: BiomarkerDiseasesPanelProps) => {
    const { selectedMolecule } = props

    return (
        <div>
            <MiRNADiseasesPanel miRNA={selectedMolecule.identifier} identifier={selectedMolecule.identifier} />
        </div>
    )
}
