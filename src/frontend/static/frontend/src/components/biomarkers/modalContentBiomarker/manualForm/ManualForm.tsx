import React from 'react'
import { Grid } from 'semantic-ui-react'
import { BiomarkerType, FormBiomarkerData, MoleculesSectionData, MoleculesTypeOfSelection } from './../../types'
import { NewBiomarkerForm } from './newBiomarkerForm/NewBiomarkerForm'
import { MoleculesSectionsContainer } from './MoleculeSectionContainer'
import { DjangoTag } from '../../../../utils/django_interfaces'

/** ManualForm's props. */
interface ManualFormProps {
    tags: DjangoTag[]
    biomarkerForm: FormBiomarkerData,
    /** Value for Checkbox. */
    checkedIgnoreProposedAlias: boolean,
    /** Handle change for Checkbox. */
    handleChangeIgnoreProposedAlias: (value: boolean) => void,
    cleanForm: () => void,
    isFormEmpty: () => boolean,
    handleChangeMoleculeSelected: (value: BiomarkerType) => void,
    handleChangeMoleculeInputSelected: (value: MoleculesTypeOfSelection) => void,
    handleAddMoleculeToSection: (value: MoleculesSectionData) => void,
    handleRemoveMolecule: (section: BiomarkerType, molecule: MoleculesSectionData) => void,
    handleGenesSymbolsFinder: (query: string) => void,
    handleGenesSymbols: (genes: string[]) => void,
    handleSelectOptionMolecule: (molecule: MoleculesSectionData, section: BiomarkerType, itemSelected: string) => void,
    handleRemoveInvalidGenes: (sector: BiomarkerType) => void,
    handleRestartSection: (sector: BiomarkerType) => void,
    handleChangeConfirmModalState: (setOption: boolean, headerText: string, contentText: string, onConfirm: () => void) => void,
    handleValidateForm: () => { haveAmbiguous: boolean, haveInvalid: boolean },
    handleSendForm: () => void,
    handleChangeCheckBox: (value: boolean) => void,
    handleChangeInputForm: (value: any, name: 'biomarkerName' | 'biomarkerDescription' | 'tag') => void,

}

export const ManualForm = (props: ManualFormProps) => {
    return (
        <Grid columns={2} padded stackable divided className='biomarkers--modal--container'>
            <Grid.Column width={4} textAlign='left'>
                <NewBiomarkerForm
                    handleChangeInputForm={props.handleChangeInputForm}
                    biomarkerForm={props.biomarkerForm}
                    cleanForm={props.cleanForm}
                    checkedIgnoreProposedAlias={props.checkedIgnoreProposedAlias}
                    handleChangeIgnoreProposedAlias={props.handleChangeIgnoreProposedAlias}
                    handleChangeMoleculeSelected={props.handleChangeMoleculeSelected}
                    handleChangeMoleculeInputSelected={props.handleChangeMoleculeInputSelected}
                    handleAddMoleculeToSection={props.handleAddMoleculeToSection}
                    handleGenesSymbolsFinder={props.handleGenesSymbolsFinder}
                    handleGenesSymbols={props.handleGenesSymbols}
                    handleChangeConfirmModalState={props.handleChangeConfirmModalState}
                    handleValidateForm={props.handleValidateForm}
                    handleSendForm={props.handleSendForm}
                    handleChangeCheckBox={props.handleChangeCheckBox}
                    tags={props.tags}
                />
            </Grid.Column>
            <MoleculesSectionsContainer
                biomarkerForm={props.biomarkerForm}
                handleRemoveMolecule={props.handleRemoveMolecule}
                handleSelectOptionMolecule={props.handleSelectOptionMolecule}
                handleRemoveInvalidGenes={props.handleRemoveInvalidGenes}
                handleRestartSection={props.handleRestartSection}
            />
        </Grid>
    )
}
