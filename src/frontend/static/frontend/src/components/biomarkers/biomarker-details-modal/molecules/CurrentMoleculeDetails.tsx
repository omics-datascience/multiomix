import React, { useEffect, useState } from 'react'
import { Grid, Header, Icon } from 'semantic-ui-react'
import { ActiveBiomarkerMoleculeItemMenu, BiomarkerMolecule } from '../../types'
import { MoleculeType, Nullable } from '../../../../utils/interfaces'
import { MoleculesDetailsMenu } from './MoleculesDetailsMenu'
import { MoleculeGeneralInformation } from './MoleculeGeneralInformation'
import { PathwaysInformation } from './genes/PathwaysInformation'
import { DiseasesPanel } from './DiseasesPanel'
import { DrugsPanel } from './DrugsPanel'
import { MirnaInteractionsPanel } from './MirnaInteractionsPanel'
import { ActionableCancerGenesPanel } from './ActionableCancerGenesPanel'
import { GeneOntologyPanel } from './gene-ontology/GeneOntologyPanel'

/** CurrentMoleculeDetails props. */
interface CurrentMoleculeDetailsProps {
    /** Selected BiomarkerMolecule instance to show the options. */
    selectedMolecule: Nullable<BiomarkerMolecule>,
    /** Callback to "close" this panel. */
    closeDetails: () => void

}

/**
 * Renders a the panel with the tabs of all the different kind of data for a specific BiomarkerMolecule.
 * @param props Component props.
 * @returns Component.
 */
export const CurrentMoleculeDetails = (props: CurrentMoleculeDetailsProps) => {
    const [activeItem, setActiveItem] = useState<ActiveBiomarkerMoleculeItemMenu>(ActiveBiomarkerMoleculeItemMenu.DETAILS)

    /**
     * Gets the selected component according to the active item.
     * @param selectedMolecule Selected BiomarkerMolecule instance to show in the selected panel.
     * @returns The corresponding component
     */
    function getSelectedComponent (selectedMolecule: BiomarkerMolecule): Nullable<JSX.Element> {
        switch (activeItem) {
            case ActiveBiomarkerMoleculeItemMenu.DETAILS:
                return <MoleculeGeneralInformation selectedMolecule={selectedMolecule} />
            case ActiveBiomarkerMoleculeItemMenu.PATHWAYS:
                return <PathwaysInformation selectedMolecule={selectedMolecule} />
            case ActiveBiomarkerMoleculeItemMenu.GENE_ASSOCIATIONS_NETWORK:
                return <GeneAssociationsNetworkPanel selectedGene={selectedMolecule} />
            case ActiveBiomarkerMoleculeItemMenu.GENE_ONTOLOGY:
                return <GeneOntologyPanel selectedMolecule={selectedMolecule} />
            case ActiveBiomarkerMoleculeItemMenu.DISEASES:
                return <DiseasesPanel selectedMolecule={selectedMolecule} />
            case ActiveBiomarkerMoleculeItemMenu.DRUGS:
                return <DrugsPanel selectedMolecule={selectedMolecule} />
            case ActiveBiomarkerMoleculeItemMenu.MIRNA_GENE_INTERACTIONS:
                return (
                    <MirnaInteractionsPanel
                        selectedMolecule={selectedMolecule}
                        gene={[MoleculeType.MRNA, MoleculeType.CNA].includes(props.selectedMolecule?.type as MoleculeType) ? selectedMolecule.identifier : null}
                        miRNA={[MoleculeType.MIRNA].includes(props.selectedMolecule?.type as MoleculeType) ? selectedMolecule.identifier : null}
                    />)
            case ActiveBiomarkerMoleculeItemMenu.ACT_CAN_GENES:
                return <ActionableCancerGenesPanel />
            default:
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
                <div>
                    {/* Menu */}
                    <MoleculesDetailsMenu
                        activeItem={activeItem}
                        setActiveItem={setActiveItem}
                        selectedMolecule={props.selectedMolecule}
                    />

                    {/* Selected menu option */}
                    <div>
                        {getSelectedComponent(props.selectedMolecule)}
                    </div>
                </div>
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

    const moleculeIsNull = props.selectedMolecule === null
    useEffect(() => {
        setActiveItem(ActiveBiomarkerMoleculeItemMenu.DETAILS)
    }, [props.selectedMolecule])

    return (
        <Grid padded>
            <Grid.Row className='min-height-50vh' columns={1} verticalAlign={moleculeIsNull ? 'middle' : undefined}>
                <Grid.Column textAlign={moleculeIsNull ? 'center' : undefined}>
                    {getPanel()}
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}
