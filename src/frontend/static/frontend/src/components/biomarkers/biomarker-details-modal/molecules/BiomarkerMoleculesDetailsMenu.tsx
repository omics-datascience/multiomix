import React from 'react'
import { Menu } from 'semantic-ui-react'
import { InfoPopup } from '../../../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { ActiveBiomarkerMoleculeItemMenu, BiomarkerMolecule } from '../../types'
import { MoleculeType } from '../../../../utils/interfaces'

/** BiomarkerMoleculesDetailsMenu props. */
interface BiomarkerMoleculesDetailsMenuProps {
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
export const BiomarkerMoleculesDetailsMenu = (props: BiomarkerMoleculesDetailsMenuProps) => {
    return (
        <Menu className='menu-with-bolder-border margin-top-0'>
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
                            content='' // TODO: complete with Butti
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
                            content='' // TODO: complete with Butti
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
