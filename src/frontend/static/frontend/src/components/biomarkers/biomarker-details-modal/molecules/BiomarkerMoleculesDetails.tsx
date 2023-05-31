import React, { useState } from 'react'
import { Grid, Header, Icon, Segment } from 'semantic-ui-react'
import { ActiveBiomarkerMoleculeItemMenu, BiomarkerMolecule } from '../../types'
import { Nullable } from '../../../../utils/interfaces'
import { BiomarkerMoleculesDetailsMenu } from './BiomarkerMoleculesDetailsMenu'

/** BiomarkerMoleculesDetails props. */
interface BiomarkerMoleculesDetailsProps {
    /** Selected BiomarkerMolecule instance to show the options. */
    selectedMolecule: Nullable<BiomarkerMolecule>,
    /** Callback to "close" this panel. */
    closeDetails: () => void
}

/**
 * Renders a Table with the samples and the cluster where they belong.
 * @param props Component props.
 * @returns Component.
 */
export const BiomarkerMoleculesDetails = (props: BiomarkerMoleculesDetailsProps) => {
    const [activeItem, setActiveItem] = useState<ActiveBiomarkerMoleculeItemMenu>(ActiveBiomarkerMoleculeItemMenu.DETAILS)

    /**
     * Gets the selected component according to the active item.
     * @returns The corresponding component
     */
    function getSelectedComponent (): Nullable<JSX.Element> {
        switch (activeItem) {
            case ActiveBiomarkerMoleculeItemMenu.DETAILS:
            case ActiveBiomarkerMoleculeItemMenu.PATHWAYS:
            case ActiveBiomarkerMoleculeItemMenu.GENE_ONTOLOGY:
                return null
        }
    }

    /**
     * Gets the corresponding panel according to the state of the selected molecule.
     * @returns Component.
     */
    const getPanel = (): JSX.Element => {
        if (props.selectedMolecule !== null) {
            return (
                <Segment>
                    {/* Menu */}
                    <BiomarkerMoleculesDetailsMenu
                        activeItem={activeItem}
                        setActiveItem={setActiveItem}
                        selectedMolecule={props.selectedMolecule}
                    />

                    {/* Selected menu option */}
                    {getSelectedComponent()}
                </Segment>
            )
        }

        return (
            <Header size='huge' icon textAlign='center'>
                <Icon name='dna' />

                No molecule selected

                <Header.Subheader>
                    Select one in the left panel
                </Header.Subheader>
            </Header>
        )
    }

    return (
        <Grid>
            <Grid.Row columns={1} verticalAlign='middle'>
                <Grid.Column textAlign='center'>
                    {getPanel()}
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}
