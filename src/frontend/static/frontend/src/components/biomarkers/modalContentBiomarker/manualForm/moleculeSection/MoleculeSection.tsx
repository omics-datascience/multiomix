import React, { useEffect, useRef, useState } from 'react'
import { Button, Dimmer, Grid, Header, Icon, Loader, Segment } from 'semantic-ui-react'
import { BiomarkerType, MoleculesSectionData, MoleculeSectionItem } from '../../../types'
import './moleculeSectionStyles.css'
import { SearchMoleculesInput } from './SearchMoleculesInput'
import { FixedSizeList } from 'react-window'

interface MoleculeSectionProps {
    title: BiomarkerType,
    biomarkerFormData: MoleculeSectionItem,
    handleRemoveMolecule: (section: BiomarkerType, molecule: MoleculesSectionData) => void,
    handleSelectOptionMolecule: (moleculeToDisambiguate: MoleculesSectionData, section: BiomarkerType, selectedOption: string) => void,
    handleRemoveInvalidGenes: (sector: BiomarkerType) => void,
}

// eslint-disable-next-line react/display-name
export const MoleculeSection = React.memo(({ title, biomarkerFormData, handleRemoveMolecule, handleSelectOptionMolecule, handleRemoveInvalidGenes }: MoleculeSectionProps) => {
    const parentRef = useRef<HTMLDivElement>(null)
    const [searchInput, setSearchInput] = useState<string>('')
    const [parentWidth, setParentWidth] = useState(0)
    const [parentHeight, setParentHeight] = useState(0)
    /**
     * Filter data to show in the section considering user search.
     * @returns Filtered data.
     */
    const dataFiltered = React.useMemo((): MoleculesSectionData[] => {
        const moleculeToSearch = searchInput.toUpperCase().trim()
        if (moleculeToSearch === '') {
            return biomarkerFormData.data
        }

        return biomarkerFormData.data.filter((item) => {
            if (Array.isArray(item.value)) {
                return item.value.some(itemValue => itemValue.toUpperCase().startsWith(moleculeToSearch))
            }

            return item.value.toUpperCase().startsWith(moleculeToSearch)
        })
    }, [biomarkerFormData.data])
    interface Asd {
        index: number,
        style: any,
    }
    const Row = ({ index, style }: Asd) => (
        <div style={style} className="row-container" >
            {<MoleculeOption
                mol={dataFiltered[index]}
                handleRemoveMolecule={handleRemoveMolecule}
                title={title}
                index={index}
                handleSelectOptionMolecule={handleSelectOptionMolecule}
            />}
        </div>
    )
    useEffect(() => {
        const updateParentSize = () => {
            if (parentRef.current) {
                const { width, height } = parentRef.current.getBoundingClientRect()
                setParentWidth(width)
                setParentHeight(height)
            }
        }

        window.addEventListener('resize', updateParentSize)
        updateParentSize()

        return () => {
            window.removeEventListener('resize', updateParentSize)
        }
    }, [])
    console.log(parentWidth, parentHeight)
    return (
        <Grid.Column width={8} className='biomarkers--molecules--container--grid'>
            <Header as='h5'>{title}</Header>

            <SearchMoleculesInput handleChange={setSearchInput} handleRemoveInvalidGenes={() => handleRemoveInvalidGenes(title)} />

            <div className='biomarkers--molecules--container table-bordered' ref={parentRef}>
                <Dimmer active={biomarkerFormData.isLoading} inverted>
                    <Loader />
                </Dimmer>
                <FixedSizeList
                    height={parentHeight}
                    width={parentWidth}
                    itemSize={50}
                    itemCount={dataFiltered.length}
                >
                    {Row}
                </FixedSizeList>
            </div>
        </Grid.Column>
    )
})

interface PropsMoleculeOption {
    mol: MoleculesSectionData,
    handleRemoveMolecule: (section: BiomarkerType, molecule: MoleculesSectionData) => void
    title: BiomarkerType,
    index: number,
    handleSelectOptionMolecule: (moleculeToDisambiguate: MoleculesSectionData, section: BiomarkerType, selectedOption: string) => void,
}
const MoleculeOption = ({
    mol,
    handleRemoveMolecule,
    title,
    index,
    handleSelectOptionMolecule
}: PropsMoleculeOption) => {
    console.log('ss')

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
            <Button color='red' compact className='biomarker--section--button'>
                {mol.value}
                <Icon name='close' onClick={() => handleRemoveMolecule(title, mol)} className='biomarker--section--icon' />
            </Button>
        </div>
    )
}
