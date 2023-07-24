import React from 'react'
import { Button, Icon, Segment } from 'semantic-ui-react'
import { BiomarkerType, MoleculesSectionData } from '../../../types'
// Styles
import './moleculeSectionStyles.css'

interface PropsMoleculeOption {
    mol: MoleculesSectionData,
    handleRemoveMolecule: (section: BiomarkerType, molecule: MoleculesSectionData) => void
    title: BiomarkerType,
    index: number,
    handleSelectOptionMolecule: (moleculeToDisambiguate: MoleculesSectionData, section: BiomarkerType, selectedOption: string) => void,
}
export const MoleculeOption = ({
    mol,
    handleRemoveMolecule,
    title,
    index,
    handleSelectOptionMolecule
}: PropsMoleculeOption) => {
    if (mol.isValid) {
        return (
            <div className='biomarkers--molecules--container--item' key={title + mol.value}>
                <Button color='green' compact className='biomarkers--molecules--container--item biomarker--section--button'>
                    {mol.value}
                    <Icon name='close' onClick={() => handleRemoveMolecule(title, mol)} className='biomarker--section--icon' />
                </Button>
            </div>
        )
    }

    // If it's an array, it's a yellow button (ambiguous molecule)
    if (Array.isArray(mol.value)) {
        const moleculeKey = index + title + mol.value.length
        return (
            <Segment key={moleculeKey} className="biomarkers--molecules--container--item table-bordered">
                {mol.value.map((item) => (
                    <Button compact className='biomarkers--molecules--container--item biomarker--section--button' key={moleculeKey + item} color='yellow' onClick={() => { handleSelectOptionMolecule(mol, title, item) }} >
                        {item}
                    </Button>
                ))}
            </Segment>
        )
    }

    // Molecule with error
    return (
        <div className='biomarkers--molecules--container--item' key={title + mol.value}>
            <Button color='red' compact className='biomarkers--molecules--container--item biomarker--section--button'>
                {mol.value}
                <Icon name='close' onClick={() => handleRemoveMolecule(title, mol)} className='biomarker--section--icon' />
            </Button>
        </div>
    )
}
