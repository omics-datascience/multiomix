import React from 'react'
import { Biomarker, BiomarkerMolecule } from '../../types'
import { MoleculesTable } from './MoleculesTable'
import { Nullable } from '../../../../utils/interfaces'
import { Grid } from 'semantic-ui-react'
import { CurrentMoleculeDetails } from './CurrentMoleculeDetails'

/** MoleculesPanel props. */
interface MoleculesPanelProps {
    /** Selected Biomarker instance to get its statistical validations. */
    selectedBiomarker: Biomarker,
}

/**
 * Renders a panel to make statistical validations for a specific Biomarker.
 * @param props Component props.
 * @returns Component.
 */
export const MoleculesPanel = (props: MoleculesPanelProps) => {
    const [selectedMolecule, setSelectedMolecule] = React.useState<Nullable<BiomarkerMolecule>>(null)

    return (
        <Grid>
            <Grid.Row columns={2} divided>
                <Grid.Column width={5}>
                    <MoleculesTable selectedBiomarker={props.selectedBiomarker} selectedMolecule={selectedMolecule} openMoleculeDetails={setSelectedMolecule} />
                </Grid.Column>
                <Grid.Column width={11}>
                    <CurrentMoleculeDetails selectedMolecule={selectedMolecule} closeDetails={() => { setSelectedMolecule(null) }} />
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}
