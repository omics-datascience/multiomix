import React, { memo } from 'react'
import { Grid } from 'semantic-ui-react'
import { BiomarkerType, FormBiomarkerData, MoleculesSectionData } from './../../types'
import MoleculeSection from './moleculeSection/MoleculeSection'

interface Props {
    biomarkerForm: FormBiomarkerData,
    handleRemoveMolecule: (section: BiomarkerType, molecule: MoleculesSectionData) => void,
    handleSelectOptionMolecule: (mol: MoleculesSectionData, section: BiomarkerType, itemSelected: string) => void,
    handleRemoveInvalidGenes: (sector: BiomarkerType) => void,
    handleRestartSection: (sector: BiomarkerType) => void,
}
const MoleculesSectionsContainer = memo(({
    biomarkerForm,
    handleRemoveMolecule,
    handleSelectOptionMolecule,
    handleRemoveInvalidGenes,
    handleRestartSection
}: Props) => {
    return (
        <Grid.Column width={12}>
            <Grid columns={2} stackable className='biomarkers--modal--container'>
                {Object.values(BiomarkerType).map(item => {
                    return (
                        <MoleculeSection
                            key={item}
                            title={item}
                            biomarkerFormData={biomarkerForm.moleculesSection[item]}
                            handleRemoveMolecule={handleRemoveMolecule}
                            handleSelectOptionMolecule={handleSelectOptionMolecule}
                            handleRemoveInvalidGenes={handleRemoveInvalidGenes}
                            handleRestartSection={handleRestartSection}
                        />
                    )
                })}
            </Grid>
        </Grid.Column>
    )
})

MoleculesSectionsContainer.displayName = 'MoleculesSectionsContainer'

export default MoleculesSectionsContainer
