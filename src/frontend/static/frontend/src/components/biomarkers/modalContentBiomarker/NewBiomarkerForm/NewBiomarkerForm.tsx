import React from 'react'
import { Segment, Header, Icon, Button, Select, Container, Label, Checkbox } from 'semantic-ui-react'
import { NameOfCGDSDataset } from '../../../../utils/interfaces'
import { TextAreaMolecules } from './textAreaMolecules'
/* import { checkedValidityCallback } from '../../utils/util_functions' */
import { BiomarkerType, FormBiomarkerData, MoleculesSectionData, MoleculesTypeOfSelection } from '../../types'
import { ButtonsForTypeOfInsert } from './buttonsForTypeOfInsert'
import './newBiomarkerFormStyles.css'
import { SelectDropDownSingleMolecule } from './selectDropdownSingleMolecule/SelectDropDownSingleMolecule'
import './../../../../css/base.css'

/**
 * Component's props
 */
interface NewBiomarkerFormProps {
    biomarkerForm: FormBiomarkerData,
    addingOrEditingCGDSStudy: boolean,
    handleFormDatasetChanges: (datasetName: NameOfCGDSDataset, name: string, value: any) => void,
    addSurvivalFormTuple: (datasetName: NameOfCGDSDataset) => void,
    removeSurvivalFormTuple: (datasetName: NameOfCGDSDataset, idxSurvivalTuple: number) => void,
    handleSurvivalFormDatasetChanges: (datasetName: NameOfCGDSDataset, idx: number, name: string, value: any) => void,
    handleFormChanges: (name: string, value: any) => void,
    handleKeyDown: (e) => void,
    addCGDSDataset: (datasetName: NameOfCGDSDataset) => void,
    removeCGDSDataset: (datasetName: NameOfCGDSDataset) => void,
    canAddCGDSStudy: () => boolean,
    addOrEditStudy: () => void,
    isFormEmpty: () => boolean,
    cleanForm: () => void,
    handleChangeMoleculeSelected: (name: BiomarkerType) => void,
    handleChangeMoleculeInputSelected: (value: MoleculesTypeOfSelection) => void,
    handleAddMoleculeToSection: (value: MoleculesSectionData) => void,
    handleGenesSymbolsFinder: (query: string) => void,
    handleGenesSymbols: (genes: string[]) => void,
    handleChangeConfirmModalState: (setOption: boolean, headerText: string, contentText: string, onConfirm: Function) => void,
    handleValidateForm: () => void,
    handleChangeCheckBox: (value: boolean) => void,
    handleValidateFormCheckBox: () => void,
}

/**
 * Renders a form to add a CGDS Study
 * @param props Component's props
 * @returns Component
 */
export const NewBiomarkerForm = (props: NewBiomarkerFormProps) => {
    /* const checkedHandleFormChanges = checkedValidityCallback(props.handleFormChanges) */
    const biomarkersOptions = [
        {
            key: BiomarkerType.MRNA,
            value: BiomarkerType.MRNA,
            text: BiomarkerType.MRNA
        },
        {
            key: BiomarkerType.MIRNA,
            value: BiomarkerType.MIRNA,
            text: BiomarkerType.MIRNA
        },
        {
            key: BiomarkerType.CNA,
            value: BiomarkerType.CNA,
            text: BiomarkerType.CNA
        },
        {
            key: BiomarkerType.METHYLATION,
            value: BiomarkerType.METHYLATION,
            text: BiomarkerType.METHYLATION
        }
    ]
    const handleSendForm = () => {
        if (!props.biomarkerForm.validation.checkBox) {
            return props.handleValidateForm()
        }
        return props.handleValidateFormCheckBox()
    }
    return (
        <Segment className='biomarkers--side--bar--container table-bordered'>
            <Header textAlign="center">
                <Icon name='th' />
                <Header.Content>New Biomarker</Header.Content>
            </Header>

            <Select
                className='biomarkers--side--bar--input--selection'
                placeholder='Select molecule'
                name='moleculeSelected'
                options={biomarkersOptions}
                value={props.biomarkerForm.moleculeSelected}
                onChange={(_, { value }) => props.handleChangeMoleculeSelected(Object.values(BiomarkerType).includes(value as BiomarkerType) ? value as BiomarkerType : BiomarkerType.MIRNA)}
            />

            <ButtonsForTypeOfInsert
                handleChangeMoleculeInputSelected={props.handleChangeMoleculeInputSelected}
                moleculesTypeOfSelection={props.biomarkerForm.moleculesTypeOfSelection} />
            {
                props.biomarkerForm.moleculesTypeOfSelection === MoleculesTypeOfSelection.INPUT &&
                <SelectDropDownSingleMolecule
                    handleAddMoleculeToSection={props.handleAddMoleculeToSection}
                    handleSearchNewData={props.handleGenesSymbolsFinder}
                    options={props.biomarkerForm.genesSymbolsFinder} />
            }
            {
                props.biomarkerForm.moleculesTypeOfSelection === MoleculesTypeOfSelection.AREA &&
                <TextAreaMolecules
                    handleGenesSymbols={props.handleGenesSymbols} />
            }
            {/* Submit form button */}

            <Container className='biomarkers--side--bar--buttons--box'>
                {props.biomarkerForm.validation.haveInvalid &&
                    <div className='biomarkers--side--bar--validation--items'>
                        <Label color={'red'}>
                            Remove the invalid molecules (in red) from the molecule panels
                        </Label>
                    </div>
                }
                {props.biomarkerForm.validation.haveAmbiguous &&
                    <div className='biomarkers--side--bar--validation--items'>
                        <Label color={'yellow'}>
                            There are some ambiguous molecules (in yellow). Please select the appropriate ones in the molecule panels.
                        </Label>
                    </div>
                }

                <Checkbox
                    className='biomarkers--side--bar--validation--items'
                    label='Ignore molecules with errors'
                    checked={props.biomarkerForm.validation.checkBox}
                    onChange={() => props.handleChangeCheckBox(!props.biomarkerForm.validation.checkBox)}
                />
                <Container className='biomarkers--side--bar--box'>
                    <Button
                        color='green'
                        content={'Send Form'}
                        fluid
                        onClick={handleSendForm}
                        loading={props.biomarkerForm.validation.isLoading}
                        disabled={props.biomarkerForm.validation.isLoading}
                    />
                </Container>
                {/* Cancel button  */}
                <Container className='biomarkers--side--bar--box'>
                    <Button
                        color='red'
                        content='Reset Form'
                        fluid
                        onClick={() => props.handleChangeConfirmModalState(true, 'You are going to reset the form and clean all the data inserted', 'Are you sure?', props.cleanForm)}
                        disabled={props.biomarkerForm.validation.isLoading}
                    // chequear la opinion antes de borrar isFormEmpty
                    // disabled={props.isFormEmpty()}
                    />
                </Container>
            </Container>
        </Segment>
    )
}
