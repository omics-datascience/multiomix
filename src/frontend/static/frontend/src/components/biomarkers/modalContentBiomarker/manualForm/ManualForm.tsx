import React from 'react'
import { DropdownItemProps, Grid } from 'semantic-ui-react'
import { BiomarkerType, FormBiomarkerData, MoleculesSectionData, MoleculesTypeOfSelection } from './../../types'
import { NewBiomarkerForm } from './newBiomarkerForm/NewBiomarkerForm'
import { MoleculesSectionsContainer } from './MoleculeSectionContainer'
import { DjangoTag } from '../../../../utils/django_interfaces'
import { NewFile } from '../../../files-manager/FilesManager'

/** ManualForm's props. */
interface ManualFormProps {
    tagOptions: DropdownItemProps[]
    tags: DjangoTag[]
    uploadingFile: boolean
    handleAddFileInputsChange: (name: string, value: any) => void
    newFile: NewFile
    biomarkerForm: FormBiomarkerData,
    /** Value for Checkbox. */
    checkedIgnoreProposedAlias: boolean,
    /** Handle change for Checkbox. */
    handleChangeIgnoreProposedAlias: (value: boolean) => void,
    removeSurvivalFormTuple: (idx: number) => void,
    handleSurvivalFormDatasetChanges: (idx: number, name: string, value) => void,
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
                    isFormEmpty={props.isFormEmpty}
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
                    tagOptions={props.tagOptions}
                    newFile={props.newFile}
                    uploadingFile={props.uploadingFile}
                    handleAddFileInputsChange={props.handleAddFileInputsChange}
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
