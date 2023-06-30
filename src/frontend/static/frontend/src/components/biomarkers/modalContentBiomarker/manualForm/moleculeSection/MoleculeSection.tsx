import React, { useState } from 'react'
import { Button, Dimmer, Grid, Header, Icon, Loader, Segment } from 'semantic-ui-react'
import { BiomarkerType, MoleculesSectionData, MoleculeSectionItem } from '../../../types'
import { SearchMoleculesInput } from './SearchMoleculesInput'

// Styles
import './moleculeSectionStyles.css'

/** MoleculeSection's props. */
interface MoleculeSectionProps {
    title: BiomarkerType,
    biomarkerFormData: MoleculeSectionItem,
    /** If true, the user can edit the molecules in the Biomarker. */
    canEditMolecules: boolean,
    handleRemoveMolecule: (section: BiomarkerType, molecule: MoleculesSectionData) => void,
    handleSelectOptionMolecule: (moleculeToDisambiguate: MoleculesSectionData, section: BiomarkerType, selectedOption: string) => void,
    handleRemoveInvalidGenes: (sector: BiomarkerType) => void,
}

/**
 * Renders a section to manage a specific type of molecules.
 * @param props Component props.
 * @returns Component.
 */
export const MoleculeSection = (props: MoleculeSectionProps) => {
    const [searchInput, setSearchInput] = useState<string>('')
    const {
        title,
        biomarkerFormData,
        canEditMolecules,
        handleRemoveMolecule,
        handleSelectOptionMolecule,
        handleRemoveInvalidGenes
    } = props

    const dataToShow = biomarkerFormData.data // For short

    /**
     * Filter data to show in the section considering user search.
     * @returns Filtered data.
     */
    const dataFiltered = (): MoleculesSectionData[] => {
        const moleculeToSearch = searchInput.toUpperCase().trim()

        if (moleculeToSearch === '') {
            return dataToShow
        }

        return dataToShow.filter((item) => {
            if (Array.isArray(item.value)) {
                return item.value.some(itemValue => itemValue.toUpperCase().startsWith(moleculeToSearch))
            }

            return item.value.toUpperCase().startsWith(moleculeToSearch)
        })
    }

    return (
        <Grid.Column width={8} className='biomarkers--molecules--container--grid'>
            <Header as='h5'>{title}</Header>

            <SearchMoleculesInput
                handleChange={setSearchInput}
                handleRemoveInvalidGenes={() => handleRemoveInvalidGenes(title)}
                canEditMolecules={canEditMolecules}
            />

            <Segment className='biomarkers--molecules--container table-bordered'>
                <Dimmer active={biomarkerFormData.isLoading} inverted>
                    <Loader />
                </Dimmer>

                {dataFiltered().map((mol, index) => {
                    if (mol.isValid) {
                        return (
                            <div className='biomarkers--molecules--container--item' key={title + mol.value}>
                                <Button color='green' compact className='biomarkers--molecules--container--item biomarker--section--button'>
                                    {mol.value}

                                    {/* If user cannot edit the Biomarker, then he cannot remove molecules */}
                                    {canEditMolecules &&
                                        <Icon name='close' onClick={() => handleRemoveMolecule(title, mol)} className='biomarker--section--icon'/>
                                    }
                                </Button>
                            </div>
                        )
                    }

                    // If it's an array, it's a yellow button (ambiguous molecule)
                    if (Array.isArray(mol.value)) {
                        const moleculeKey = index + title + mol.value.length
                        return (
                            <Segment key={moleculeKey} className="biomarkers--molecules--container--item margin-right-1">
                                {mol.value.map((item) => (
                                    <Button key={moleculeKey + item} color='yellow' compact onClick={() => { handleSelectOptionMolecule(mol, title, item) }} >
                                        {item}
                                    </Button>
                                ))}
                            </Segment>
                        )
                    }

                    // Molecule with error
                    return (
                        <div className='biomarkers--molecules--container--item' key={title + mol.value}>
                            <Button color='orange' compact className='biomarker--section--button'>
                                {mol.value}

                                {/* If user cannot edit the Biomarker, then he cannot remove molecules */}
                                {canEditMolecules &&
                                    <Icon name='close' onClick={() => handleRemoveMolecule(title, mol)} className='biomarker--section--icon' />
                                }
                            </Button>
                        </div>
                    )
                })}
            </Segment>
        </Grid.Column>
    )
}
