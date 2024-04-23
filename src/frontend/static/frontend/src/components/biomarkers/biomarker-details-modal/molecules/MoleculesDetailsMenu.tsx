import React from 'react'
import { Menu } from 'semantic-ui-react'
import { InfoPopup } from '../../../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { ActiveBiomarkerMoleculeItemMenu, BiomarkerMolecule } from '../../types'
import { MoleculeType } from '../../../../utils/interfaces'
import './../../../../css/biomarkers.css'

/** MoleculesDetailsMenu props. */
interface MoleculesDetailsMenuProps {
    /** Selected BiomarkerMolecule instance to show the options. */
    selectedMolecule: BiomarkerMolecule,
    /** Getter of the active item in the menu. */
    activeItem: ActiveBiomarkerMoleculeItemMenu,
    /** Setter of the active item in the menu. */
    setActiveItem: (activeItem: ActiveBiomarkerMoleculeItemMenu) => void,
}

interface ItemMenuProp {
    name: string,
    onClick: () => void,
    isActive: boolean,
    popupInfo: string,
    isVisible: boolean
}

/**
 * Renders the menu for the modal of a Biomarker's molecule details panel.
 * @param props Component props.
 * @returns Component.
 */
export const MoleculesDetailsMenu = (props: MoleculesDetailsMenuProps) => {
    const isGene = [MoleculeType.MRNA, MoleculeType.CNA].includes(props.selectedMolecule.type)

    /**
     * Array with all the items and conditions
     */
    const items: ItemMenuProp[] = [
        {
            name: 'Details',
            onClick: () => props.setActiveItem(ActiveBiomarkerMoleculeItemMenu.DETAILS),
            isActive: props.activeItem === ActiveBiomarkerMoleculeItemMenu.DETAILS,
            popupInfo: `Details of ${props.selectedMolecule.identifier} obtained from different standardized sources`,
            isVisible: true // All molecules
        },
        {
            name: 'Pathways',
            onClick: () => props.setActiveItem(ActiveBiomarkerMoleculeItemMenu.PATHWAYS),
            isActive: props.activeItem === ActiveBiomarkerMoleculeItemMenu.PATHWAYS,
            popupInfo: 'Allows to explore the specific pathways associated with a particular gene, shedding light on the interconnected processes within a biological system',
            isVisible: isGene
        },
        {
            name: 'Gene associations network',
            onClick: () => props.setActiveItem(ActiveBiomarkerMoleculeItemMenu.GENE_ASSOCIATIONS_NETWORK),
            isActive: props.activeItem === ActiveBiomarkerMoleculeItemMenu.GENE_ASSOCIATIONS_NETWORK,
            popupInfo: 'It shows the network of gene associations of the genes of this biomarker',
            isVisible: isGene
        },
        {
            name: 'Gene Ontology',
            onClick: () => props.setActiveItem(ActiveBiomarkerMoleculeItemMenu.GENE_ONTOLOGY),
            isActive: props.activeItem === ActiveBiomarkerMoleculeItemMenu.GENE_ONTOLOGY,
            popupInfo: 'Gene Ontology (GO) is a powerful tool for understanding the biological processes, molecular functions, and cellular components associated with a gene',
            isVisible: isGene
        },
        {
            name: 'Actionable/Cancer genes',
            onClick: () => props.setActiveItem(ActiveBiomarkerMoleculeItemMenu.ACT_CAN_GENES),
            isActive: props.activeItem === ActiveBiomarkerMoleculeItemMenu.ACT_CAN_GENES,
            popupInfo: 'It shows information from gene ontology related with the genes of this biomarker',
            isVisible: isGene
        },
        {
            name: 'Diseases',
            onClick: () => props.setActiveItem(ActiveBiomarkerMoleculeItemMenu.DISEASES),
            isActive: props.activeItem === ActiveBiomarkerMoleculeItemMenu.DISEASES,
            popupInfo: 'Interactions of the molecule with diseases that have been reported in the literature',
            isVisible: [MoleculeType.MIRNA].includes(props.selectedMolecule.type)
        },
        {
            name: 'Drugs',
            onClick: () => props.setActiveItem(ActiveBiomarkerMoleculeItemMenu.DRUGS),
            isActive: props.activeItem === ActiveBiomarkerMoleculeItemMenu.DRUGS,
            popupInfo: 'Interactions of the molecule with drugs that have been reported in the literature',
            isVisible: [MoleculeType.MIRNA].includes(props.selectedMolecule.type)
        },
        {
            name: 'miRNA-Gene interactions',
            onClick: () => props.setActiveItem(ActiveBiomarkerMoleculeItemMenu.MIRNA_GENE_INTERACTIONS),
            isActive: props.activeItem === ActiveBiomarkerMoleculeItemMenu.MIRNA_GENE_INTERACTIONS,
            popupInfo: 'Different miRNA-Gene interactions that have been reported in the literature along with the associated mirDIP score and Pubmed sources',
            isVisible: [MoleculeType.MRNA, MoleculeType.CNA, MoleculeType.MIRNA].includes(props.selectedMolecule.type)
        }
    ]

    /**
     * Function to render menus, every 6 items it will generate a menu in order to keep space.
     * TODO: use CSS flex properties and remove this.
     * @returns Menus with 6 items stackable
     */
    const handleMenuRender = () => {
        const menuRender: {
            items: ItemMenuProp[],
            key: number,
            className: string
        }[] = []
        let itemMenu: ItemMenuProp[] = []
        let key = 1

        for (const item of items) {
            if (item.isVisible) {
                itemMenu.push(item)
            }

            if (itemMenu.length === 6) {
                menuRender.push({ items: itemMenu, key, className: 'remove-margin-bottom' })
                key += 1
                itemMenu = []
            }
        }

        if (itemMenu.length) {
            menuRender.push({ items: itemMenu, key, className: 'remove-margin-top' })
        } else {
            menuRender[menuRender.length - 1].className = 'remove-margin-top'
        }

        return (
            <>
                {
                    menuRender.map(menu => (
                        <Menu className={menu.className} stackable key={menu.key}>
                            {
                                menu.items.map(item => {
                                    if (!item.isVisible) {
                                        return null
                                    }

                                    return (
                                        <Menu.Item
                                            key={item.name}
                                            active={item.isActive}
                                            onClick={item.onClick}
                                        >
                                            {item.name}

                                            <InfoPopup
                                                content={item.popupInfo}
                                                onTop={false}
                                                onEvent='hover'
                                                extraClassName='margin-left-5'
                                            />
                                        </Menu.Item>
                                    )
                                })
                            }
                        </Menu>
                    ))
                }
            </>
        )
    }

    return (
        <>
            {handleMenuRender()}
        </>

    )
}
