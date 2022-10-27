import React from 'react'
import { Button, Grid, Icon, Segment } from 'semantic-ui-react'
import { BiomarkerType, MoleculesSectionData } from '../../types'
import './moleculeSectionStyles.css'

interface MoleculeSectionProps {
    title: BiomarkerType,
    biomarkerFormData:MoleculesSectionData[],
    handleRemoveMolecule: (section:BiomarkerType, molecule: MoleculesSectionData) => void,
}
export const MoleculeSection = ({ title, biomarkerFormData, handleRemoveMolecule }: MoleculeSectionProps) => {
    return (
        <Grid.Column width={8} className='biomarkers--molecules--container--grid'>
            <h5>{title}</h5>
            <Segment className='biomarkers--molecules--container'>
                {biomarkerFormData.map((item) => (
                    !item.isValid
                        ? <div className='biomarkers--molecules--container--item' key={title + item.fakeId}>
                            <Button color='red' compact onClick={() => handleRemoveMolecule(title, item)}>{item.value}     <Icon link name='close' /></Button>
                        </div>
                        : <div className='biomarkers--molecules--container--item' key={title + item.fakeId}>
                            <Button color='green' onClick={() => handleRemoveMolecule(title, item)} compact className='biomarkers--molecules--container--item'>{item.value}   <Icon link name='close' /></Button>
                        </div>
                ))}
            </Segment>
        </Grid.Column>
    )
}
