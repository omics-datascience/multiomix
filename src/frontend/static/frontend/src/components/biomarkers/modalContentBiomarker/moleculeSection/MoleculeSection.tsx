import React, { useMemo } from 'react'
import { Button, Grid, Icon, Segment } from 'semantic-ui-react'
import { BiomarkerType, MoleculesSectionData } from '../../types'
import './moleculeSectionStyles.css'

interface MoleculeSectionProps {
    title: BiomarkerType,
    biomarkerFormData: MoleculesSectionData[],
    handleRemoveMolecule: (section: BiomarkerType, molecule: MoleculesSectionData) => void,
    handleSelectOptionMolecule: (mol: MoleculesSectionData, section: BiomarkerType, itemSelected: string) => void,
}
export const MoleculeSection = ({ title, biomarkerFormData, handleRemoveMolecule, handleSelectOptionMolecule }: MoleculeSectionProps) => {
    const dataOrder = useMemo(() => {
        return biomarkerFormData.sort((a, b) => Number(a.isValid) - Number(b.isValid))
    }, [biomarkerFormData])
    return (
        <Grid.Column width={8} className='biomarkers--molecules--container--grid'>
            <h5>{title}</h5>
            <Segment className='biomarkers--molecules--container'>
                {dataOrder.map((mol, index) => (
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
