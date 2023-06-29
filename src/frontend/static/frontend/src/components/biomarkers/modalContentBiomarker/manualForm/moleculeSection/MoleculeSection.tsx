import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Button, Dimmer, Grid, Header, Icon, Loader, Segment } from 'semantic-ui-react'
import { BiomarkerType, MoleculesSectionData, MoleculeSectionItem } from '../../../types'
import './moleculeSectionStyles.css'
import { SearchMoleculesInput } from './SearchMoleculesInput'
import { FixedSizeList } from 'react-window'
//import { DynamicSizeList } from 'react-window-dynamic'

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
    const listRef = useRef<any>(null)

    const sizeMap = useRef<any>(null)
    const setSize = useCallback((index, size) => {
        sizeMap.current = { ...sizeMap.current, [index]: size }
        if (listRef.current) {
            console.log('current')
            listRef.current.resetAfterIndex(index)
        }
    }, [])
    const getSize = useCallback(index => {
        console.log(sizeMap, 'execgetsize')
        return 50
    }, [])
    /**
     * Filter data to show in the section considering user search.
     * @returns Filtered data.
     */
    const dataFiltered = React.useMemo((): MoleculesSectionData[][] => {
        const resultado: MoleculesSectionData[][] = []
        let subarreglo: MoleculesSectionData[] = []

        for (let i = 0; i < biomarkerFormData.data.length; i++) {
            subarreglo.push(biomarkerFormData.data[i])

            if (subarreglo.length === 4 || i === biomarkerFormData.data.length - 1) {
                resultado.push(subarreglo)
                subarreglo = []
            }
        }
        // const moleculeToSearch = searchInput.toUpperCase().trim()
        return resultado
        /* if (moleculeToSearch === '') {
            return biomarkerFormData.data
        }

        return biomarkerFormData.data.filter((item) => {
            if (Array.isArray(item.value)) {
                return item.value.some(itemValue => itemValue.toUpperCase().startsWith(moleculeToSearch))
            }

            return item.value.toUpperCase().startsWith(moleculeToSearch)
        }) */
    }, [biomarkerFormData.data])
    interface RowProps {
        index: number,
        // style: any,
    }
    const Row = ({ index }: RowProps) => {
        return (
            <div
                className="row-container"
                style={{ display: 'inline-flex' }}
            >
                {
                    dataFiltered[index].map((mol, i) => (
                        < MoleculeOption
                            key={i + index}
                            mol={mol}
                            handleRemoveMolecule={handleRemoveMolecule}
                            title={title}
                            index={index}
                            handleSelectOptionMolecule={handleSelectOptionMolecule}
                        />
                    ))
                }
            </div>
        )
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
                    ref={listRef}
                    height={parentHeight}
                    width={parentWidth}
                    itemSize={50}
                    itemCount={dataFiltered.length / 4}
                >
                    {({ index, style }) => (
                        <div style={style}>
                            <Row
                                index={index}
                            />
                        </div>
                    )}
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
