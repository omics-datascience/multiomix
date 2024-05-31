import React, { useEffect, useState } from 'react'
import { Grid, Header, Icon } from 'semantic-ui-react'
import { ActiveBiomarkerMoleculeItemMenu, BiomarkerMolecule } from '../../types'
import { MoleculeType, Nullable } from '../../../../utils/interfaces'
import { MoleculesDetailsMenu } from './MoleculesDetailsMenu'
import { MoleculeGeneralInformation } from './MoleculeGeneralInformation'
import { PathwaysInformation } from './genes/PathwaysInformation'
import { MirnaInteractionsPanel } from './MirnaInteractionsPanel'
import { GeneOntologyPanel } from './gene-ontology/GeneOntologyPanel'
import { GeneAssociationsNetworkPanel } from './genes/GeneAssociationsNetworkPanel'
import { MiRNADrugsPanel } from '../../../pipeline/experiment-result/gene-gem-details/MiRNADrugsPanel'
import { MiRNADiseasesPanel } from '../../../pipeline/experiment-result/gene-gem-details/MiRNADiseasesPanel'
import { ActionableCancerGenesPanel } from './genes/ActionableCancerGenesPanel'

// const MENU_DEFAULT: ActiveBiomarkerMoleculeItemMenu = ActiveBiomarkerMoleculeItemMenu.DETAILS // TODO: use this
const MENU_DEFAULT: ActiveBiomarkerMoleculeItemMenu = ActiveBiomarkerMoleculeItemMenu.DETAILS

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
    const [activeItem, setActiveItem] = useState<ActiveBiomarkerMoleculeItemMenu>(MENU_DEFAULT)

    /** Effect to set the active item to DETAILS when the selected molecule changes. */
    useEffect(() => {
        setActiveItem(MENU_DEFAULT)
    }, [props.selectedMolecule])

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
                return <MiRNADiseasesPanel miRNA={selectedMolecule.identifier} />
            case ActiveBiomarkerMoleculeItemMenu.DRUGS:
                return <MiRNADrugsPanel miRNA={selectedMolecule.identifier} />
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

    return (
        <Grid padded>
            <Grid.Row className='min-height-50vh' columns={1}>
                <Grid.Column>
                    {getPanel()}
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}
