import React, { useEffect, useMemo, useState } from 'react'
import { Button, Grid, Icon, Segment } from 'semantic-ui-react'
import { BiomarkerType, MoleculesSectionData } from '../../types'
import './moleculeSectionStyles.css'
import { SearchMoleculesInput } from './searchMoleculesInput/SearchMoleculesInput'

interface MoleculeSectionProps {
    title: BiomarkerType,
    biomarkerFormData: MoleculesSectionData[],
    handleRemoveMolecule: (section: BiomarkerType, molecule: MoleculesSectionData) => void,
    handleSelectOptionMolecule: (mol: MoleculesSectionData, section: BiomarkerType, itemSelected: string) => void,
}
export const MoleculeSection = ({ title, biomarkerFormData, handleRemoveMolecule, handleSelectOptionMolecule }: MoleculeSectionProps) => {
    const [dataToShow, setDataToShow] = useState<MoleculesSectionData[]>([])
    const dataOrder = useMemo(() => {
        return biomarkerFormData.sort((a, b) => Number(a.isValid) - Number(b.isValid))
    }, [biomarkerFormData])
    const handleSearchData = (searchInput: string) => {
        const searchInputData = dataOrder.map((item, index) => {
            if (Array.isArray(item.value)) {
                let dataOfArray
                item.value.forEach(itemValue => {
                    if (itemValue.includes(searchInput)) {
                        dataOfArray = dataOrder[index]
                    }
                })
                return dataOfArray
            }
            if (item.value.includes(searchInput)) {
                return dataOrder[index]
            }
        }).filter(item => item)
        setDataToShow(searchInputData)
    }
    useEffect(() => {
        setDataToShow(dataOrder)
    }, [dataOrder])

    return (
        <Grid.Column width={8} className='biomarkers--molecules--container--grid'>
            <h5>{title}</h5>
            <SearchMoleculesInput handleSearchData={handleSearchData} />
            <Segment className='biomarkers--molecules--container'>
                {dataToShow.map((mol, index) => (
                    mol.isValid
                        ? <div className='biomarkers--molecules--container--item' key={title + mol.value}>
                            <Button color='green' onClick={() => handleRemoveMolecule(title, mol)} compact className='biomarkers--molecules--container--item'>{mol.value}   <Icon link name='close' /></Button>
                        </div>
                        : Array.isArray(mol.value)
                            ? <Segment key={index + title + mol.value.length} className="biomarkers--molecules--container--item">
                                {mol.value.map((item, i) => (
                                    <Button key={title + item + i} color='yellow' compact onClick={() => handleSelectOptionMolecule(mol, title, item)} >
                                        {item}
                                    </Button>
                                ))}
                            </Segment>
                            : <div className='biomarkers--molecules--container--item' key={title + mol.value}>
                                <Button color='red' compact onClick={() => handleRemoveMolecule(title, mol)}>{mol.value}     <Icon link name='close' /></Button>
                            </div>
                ))}
            </Segment>
        </Grid.Column>
    )
}
