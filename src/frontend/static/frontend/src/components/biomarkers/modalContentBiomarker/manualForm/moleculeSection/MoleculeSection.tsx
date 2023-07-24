import React, { useEffect, useRef, useState } from 'react'
import { Dimmer, Grid, Header, Loader } from 'semantic-ui-react'
import { BiomarkerType, MoleculesSectionData, MoleculeSectionItem } from '../../../types'
import { SearchMoleculesInput } from './SearchMoleculesInput'
import { List } from 'react-virtualized'
import { MoleculeDynamicRow } from './MoleculeDynamicRow'

// Styles
import './moleculeSectionStyles.css'

/** MoleculeSection's props. */
interface MoleculeSectionProps {
    title: BiomarkerType,
    biomarkerFormData: MoleculeSectionItem,
    /** If true, the user can edit the molecules in the Biomarker. */
    canEditMolecules: boolean,
    /** If true, the user can edit the molecules in the Biomarker. */
    handleRemoveMolecule: (section: BiomarkerType, molecule: MoleculesSectionData) => void,
    handleSelectOptionMolecule: (moleculeToDisambiguate: MoleculesSectionData, section: BiomarkerType, selectedOption: string) => void,
    handleRemoveInvalidGenes: (sector: BiomarkerType) => void,
    handleRestartSection: (sector: BiomarkerType) => void,
}

export const MoleculeSection = ({
    title,
    biomarkerFormData: sectionFormData,
    handleRemoveMolecule,
    handleSelectOptionMolecule,
    handleRemoveInvalidGenes,
    handleRestartSection,
    canEditMolecules
}: MoleculeSectionProps) => {
    const parentRef = useRef<HTMLDivElement>(null)
    const [searchInput, setSearchInput] = useState<string>('')
    const [parentWidth, setParentWidth] = useState(0)
    const [parentHeight, setParentHeight] = useState(0)
    let rowCount = 0

    /**
     * Filter data to show in the section considering user search.
     * @returns Filtered data.
     */
    const getDataFiltered = (): MoleculesSectionData[][] => {
        const searchInputLower = searchInput.toLowerCase()
        const data = sectionFormData.data.filter(item =>
            (!Array.isArray(item.value) && item.value.toLowerCase().includes(searchInputLower)) ||
            (Array.isArray(item.value) && item.value.some(itemVal => itemVal.toLocaleLowerCase().includes(searchInputLower)))
        )

        const result: MoleculesSectionData[][] = []
        let subArray: MoleculesSectionData[] = []
        for (let i = 0; i < data.length; i++) {
            if (Array.isArray(data[i].value)) {
                rowCount += 1
                result.push([data[i]])
            } else {
                subArray.push(data[i])

                if (subArray.length === 3 || i === data.length - 1) {
                    rowCount += 1
                    result.push(subArray)
                    subArray = []
                }
            }
        }
        return result
    }

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

    const dataFiltered = getDataFiltered()

    return (
        <Grid.Column width={8} className='biomarkers--molecules--container--grid'>
            <Header as='h5'>{title}</Header>

            <SearchMoleculesInput
                handleChange={setSearchInput}
                handleRemoveInvalidGenes={() => handleRemoveInvalidGenes(title)}
                handleRestartSection={() => handleRestartSection(title)}
                disabled={!canEditMolecules}
            />

            <div className='biomarkers--molecules--container table-bordered' ref={parentRef}>
                <Dimmer active={sectionFormData.isLoading} inverted>
                    <Loader />
                </Dimmer>

                <List
                    width={parentWidth}
                    height={parentHeight}
                    rowCount={rowCount}
                    rowHeight={50}
                    rowRenderer={({ index, key, style }) => {
                        const item = dataFiltered[index]
                        return (
                            <div key={key} style={{ ...style, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <MoleculeDynamicRow
                                    content={item}
                                    title={title}
                                    canEditMolecules={canEditMolecules}
                                    handleRemoveMolecule={handleRemoveMolecule}
                                    handleSelectOptionMolecule={handleSelectOptionMolecule}
                                />
                            </div>
                        )
                    }}
                />
            </div >
        </Grid.Column >
    )
}
