import React, { memo, useEffect, useMemo, useRef, useState } from 'react'
import { Dimmer, Grid, Header, Loader } from 'semantic-ui-react'
import { BiomarkerType, MoleculesSectionData, MoleculeSectionItem } from '../../../types'
import { SearchMoleculesInput } from './SearchMoleculesInput'
import { List } from 'react-virtualized'
import { MoleculeDinamicRow } from './MoleculeDinamicRow'

// Styles
import './moleculeSectionStyles.css'

/** MoleculeSection's props. */
interface MoleculeSectionProps {
    title: BiomarkerType,
    biomarkerFormData: MoleculeSectionItem,
    /** If true, the user can edit the molecules in the Biomarker. */
    handleRemoveMolecule: (section: BiomarkerType, molecule: MoleculesSectionData) => void,
    handleSelectOptionMolecule: (moleculeToDisambiguate: MoleculesSectionData, section: BiomarkerType, selectedOption: string) => void,
    handleRemoveInvalidGenes: (sector: BiomarkerType) => void,
    handleRestartSection: (sector: BiomarkerType) => void,
}
const MoleculeSection = memo(({
    title,
    biomarkerFormData,
    handleRemoveMolecule,
    handleSelectOptionMolecule,
    handleRemoveInvalidGenes,
    handleRestartSection
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
    const dataFiltered = useMemo((): MoleculesSectionData[][] => {
        const data = biomarkerFormData.data.filter(item =>
            (
                !Array.isArray(item.value) && item.value.includes(searchInput)
            ) ||
            (
                Array.isArray(item.value) && item.value.some(itemVal => itemVal.includes(searchInput))
            )
        )
        const resultado: MoleculesSectionData[][] = []
        let subarreglo: MoleculesSectionData[] = []
        for (let i = 0; i < data.length; i++) {
            if (Array.isArray(data[i].value)) {
                rowCount += 1
                resultado.push([data[i]])
            } else {
                subarreglo.push(data[i])

                if (subarreglo.length === 3 || i === data.length - 1) {
                    rowCount += 1
                    resultado.push(subarreglo)
                    subarreglo = []
                }
            }
        }
        return resultado
    }, [biomarkerFormData, searchInput])
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

    return (
        <Grid.Column width={8} className='biomarkers--molecules--container--grid'>
            <Header as='h5'>{title}</Header>

            <SearchMoleculesInput
                handleChange={setSearchInput}
                handleRemoveInvalidGenes={() => handleRemoveInvalidGenes(title)}
                handleRestartSection={() => handleRestartSection(title)}

            />

            <div className='biomarkers--molecules--container table-bordered' ref={parentRef}>
                <Dimmer active={biomarkerFormData.isLoading} inverted>
                    <Loader />
                </Dimmer>

                <List
                    width={parentWidth}
                    height={parentHeight}
                    rowCount={rowCount}
                    rowHeight={80}
                    rowRenderer={({ index, key, style }) => {
                        const item = dataFiltered[index]
                        return (
                            <div key={key} style={{ ...style, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                <MoleculeDinamicRow
                                    content={item}
                                    handleRemoveMolecule={handleRemoveMolecule}
                                    handleSelectOptionMolecule={handleSelectOptionMolecule}
                                    title={title}
                                />
                            </div>
                        )
                    }}
                />
            </div >
        </Grid.Column >
    )
})
MoleculeSection.displayName = 'MoleculeSection'

export default MoleculeSection
