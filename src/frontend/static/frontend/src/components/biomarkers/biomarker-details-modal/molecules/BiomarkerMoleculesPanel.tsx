import React from 'react'
import { Biomarker, BiomarkerMolecule } from '../../types'
import { BiomarkerMoleculesTable } from './BiomarkerMoleculesTable'
import { Nullable } from '../../../../utils/interfaces'
import { Grid } from 'semantic-ui-react'
import { BiomarkerMoleculesDetails } from './BiomarkerMoleculesDetails'

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
    const [selectedMolecule, setSelectedMolecule] = React.useState<Nullable<BiomarkerMolecule>>(null)

    return (
        <Grid>
            <Grid.Row columns={2} divided>
                <Grid.Column width={5}>
                    <BiomarkerMoleculesTable selectedBiomarker={props.selectedBiomarker} openMoleculeDetails={setSelectedMolecule} />
                </Grid.Column>
                <Grid.Column width={11} className='column-fixed-height'>
                    <BiomarkerMoleculesDetails selectedMolecule={selectedMolecule} closeDetails={() => { setSelectedMolecule(null) }} />
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}
