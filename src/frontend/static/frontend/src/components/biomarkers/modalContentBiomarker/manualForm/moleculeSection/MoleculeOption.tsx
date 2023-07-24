import React from 'react'
import { Button, Icon, Segment } from 'semantic-ui-react'
import { BiomarkerType, MoleculesSectionData } from '../../../types'

// Styles
import './moleculeSectionStyles.css'

/** MoleculeOption props. */
interface PropsMoleculeOption {
    molecule: MoleculesSectionData,
    title: BiomarkerType,
    index: number,
    /** Indicates if user can remove the molecule. */
    canRemove: boolean,
    handleRemoveMolecule: (section: BiomarkerType, molecule: MoleculesSectionData) => void
    handleSelectOptionMolecule: (moleculeToDisambiguate: MoleculesSectionData, section: BiomarkerType, selectedOption: string) => void,
}

/**
 * Renders a label with a molecule and a button to remove it.
 * @param props Component props.
 * @returns Component.
 */
export const MoleculeOption = (props: PropsMoleculeOption) => {
    const {
        molecule,
        title,
        index,
        canRemove,
        handleRemoveMolecule,
        handleSelectOptionMolecule
    } = props

    if (molecule.isValid) {
        return (
            <div className='biomarkers--molecules--container--item' key={title + molecule.value}>
                <Button
                    color='green'
                    compact
                    className='biomarkers--molecules--container--item biomarker--section--button'
                    disabled={!canRemove}
                >
                    {molecule.value}
                    <Icon name='close' onClick={() => handleRemoveMolecule(title, molecule)} className='biomarker--section--icon' />
                </Button>
            </div>
        )
    }

    // If it's an array, it's a yellow button (ambiguous molecule)
    if (Array.isArray(molecule.value)) {
        const moleculeKey = index + title + molecule.value.length
        return (
            <Segment key={moleculeKey} className="biomarkers--molecules--container--item table-bordered">
                {molecule.value.map((item) => (
                    <Button
                        key={moleculeKey + item}
                        compact
                        className='biomarkers--molecules--container--item biomarker--section--button'
                        color='yellow'
                        onClick={() => { handleSelectOptionMolecule(molecule, title, item) }}
                        disabled={!canRemove}
                    >
                        {item}
                    </Button>
                ))}
            </Segment>
        )
    }

    // Molecule with error
    return (
        <div className='biomarkers--molecules--container--item' key={title + molecule.value}>
            <Button
                color='orange'
                compact
                className='biomarkers--molecules--container--item biomarker--section--button'
                disabled={!canRemove}
            >
                {molecule.value}
                <Icon name='close' onClick={() => handleRemoveMolecule(title, molecule)} className='biomarker--section--icon' />
            </Button>
        </div>
    )
}
