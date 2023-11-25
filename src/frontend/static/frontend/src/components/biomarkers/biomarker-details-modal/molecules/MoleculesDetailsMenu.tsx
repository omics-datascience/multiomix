import React from 'react'
import { Menu } from 'semantic-ui-react'
import { InfoPopup } from '../../../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { ActiveBiomarkerMoleculeItemMenu, BiomarkerMolecule } from '../../types'
import { MoleculeType } from '../../../../utils/interfaces'

/** MoleculesDetailsMenu props. */
interface MoleculesDetailsMenuProps {
    /** Selected BiomarkerMolecule instance to show the options. */
    selectedMolecule: BiomarkerMolecule,
    /** Getter of the active item in the menu. */
    activeItem: ActiveBiomarkerMoleculeItemMenu,
    /** Setter of the active item in the menu. */
    setActiveItem: (activeItem: ActiveBiomarkerMoleculeItemMenu) => void,
}

/**
 * Renders the menu for the modal of a Biomarker's molecule details panel.
 * @param props Component props.
 * @returns Component.
 */
export const MoleculesDetailsMenu = (props: MoleculesDetailsMenuProps) => {
    return (
        <Menu className='margin-top-0'>
            <Menu.Item
                active={props.activeItem === ActiveBiomarkerMoleculeItemMenu.DETAILS}
                onClick={() => props.setActiveItem(ActiveBiomarkerMoleculeItemMenu.DETAILS)}
            >
                Details

                <InfoPopup
                    content={`General details of ${props.selectedMolecule.identifier}`}
                    onTop={false}
                    onEvent='hover'
                    extraClassName='margin-left-5'
                />
            </Menu.Item>

            {[MoleculeType.MRNA, MoleculeType.CNA].includes(props.selectedMolecule.type) &&
                <>
                    <Menu.Item
                        active={props.activeItem === ActiveBiomarkerMoleculeItemMenu.PATHWAYS}
                        onClick={() => props.setActiveItem(ActiveBiomarkerMoleculeItemMenu.PATHWAYS)}
                    >
                        Pathways

                        <InfoPopup
                            content='It shows all the biological pathways that include each of the genes of this biomarker'
                            onTop={false}
                            onEvent='hover'
                            extraClassName='margin-left-5'
                        />
                    </Menu.Item>

                    <Menu.Item
                        active={props.activeItem === ActiveBiomarkerMoleculeItemMenu.GENE_ONTOLOGY}
                        onClick={() => props.setActiveItem(ActiveBiomarkerMoleculeItemMenu.GENE_ONTOLOGY)}
                    >
                        Gene Ontology

                        <InfoPopup
                            content='It shows information from gene ontology related with the genes of this biomarker'
                            onTop={false}
                            onEvent='hover'
                            extraClassName='margin-left-5'
                        />
                    </Menu.Item>
                </>
            }
            {[MoleculeType.MRNA, MoleculeType.CNA, MoleculeType.MIRNA].includes(props.selectedMolecule.type) &&
                <>
                    <Menu.Item
                        active={props.activeItem === ActiveBiomarkerMoleculeItemMenu.DISEASES}
                        onClick={() => props.setActiveItem(ActiveBiomarkerMoleculeItemMenu.DISEASES)}
                    >
                        Diseases

                        <InfoPopup
                            content='ni idea loco'
                            onTop={false}
                            onEvent='hover'
                            extraClassName='margin-left-5'
                        />
                    </Menu.Item>

                    <Menu.Item
                        active={props.activeItem === ActiveBiomarkerMoleculeItemMenu.DRUGS}
                        onClick={() => props.setActiveItem(ActiveBiomarkerMoleculeItemMenu.DRUGS)}
                    >
                        Drugs

                        <InfoPopup
                            content='ni idea loco'
                            onTop={false}
                            onEvent='hover'
                            extraClassName='margin-left-5'
                        />
                    </Menu.Item>
                </>
            }

        </Menu>
    )
}
