import React from 'react'
import { Segment, Header, Icon, Button, Select, Container, Label, Checkbox, Input, TextArea } from 'semantic-ui-react'
import { TextAreaMolecules } from './TextAreaMolecules'
import { BiomarkerType, FormBiomarkerData, MoleculesSectionData, MoleculesTypeOfSelection } from './../../../types'
import './newBiomarkerFormStyles.css'
import { ButtonsForTypeOfInsert } from './ButtonsForTypeOfInsert'
import { SelectDropDownSingleMolecule } from './SelectDropDownSingleMolecule'
import { InfoPopup } from '../../../../pipeline/experiment-result/gene-gem-details/InfoPopup'

/**
 * Component's props
 */
interface NewBiomarkerFormProps {
    biomarkerForm: FormBiomarkerData,
    isFormEmpty: () => boolean,
    cleanForm: () => void,
    handleChangeMoleculeSelected: (name: BiomarkerType) => void,
    handleChangeMoleculeInputSelected: (value: MoleculesTypeOfSelection) => void,
    handleAddMoleculeToSection: (value: MoleculesSectionData) => void,
    handleGenesSymbolsFinder: (query: string) => void,
    handleGenesSymbols: (genes: string[]) => void,
    handleChangeConfirmModalState: (setOption: boolean, headerText: string, contentText: string, onConfirm: Function) => void,
    handleValidateForm: () => { haveAmbiguous: boolean, haveInvalid: boolean },
    handleSendForm: () => void,
    handleChangeCheckBox: (value: boolean) => void,
    handleChangeInputForm: (value: string, name: 'biomarkerName' | 'biomarkerDescription') => void,
}

/**
 * Renders a form to add a CGDS Study
 * @param props Component's props
 * @returns Component
 */
export const NewBiomarkerForm = (props: NewBiomarkerFormProps) => {
    const { haveInvalid, haveAmbiguous } = props.handleValidateForm()
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

    return (
        <Segment className='biomarkers--side--bar--container table-bordered'>
            <Header textAlign="center" className='margin-top-0'>
                <Icon name='th' />
                <Header.Content>New Biomarker</Header.Content>
            </Header>

            <Input
                onChange={(e) => props.handleChangeInputForm(e.target.value, 'biomarkerName')}
                type='text'
                placeholder='Name'
                className='biomarkers--side--bar--container--item--margin'
                value={props.biomarkerForm.biomarkerName}
                icon='asterisk'
            />

            <TextArea
                style={{ maxWidth: '100%', minWidth: '100%' }}
                rows={3}
                onChange={(_, e) => props.handleChangeInputForm(e.value ? e.value.toString() : '', 'biomarkerDescription')}
                placeholder='Description'
                className='biomarkers--side--bar--container--item--margin'
                value={props.biomarkerForm.biomarkerDescription}
            />

            <Select
                selectOnBlur={false}
                className='biomarkers--side--bar--input--selection'
                placeholder='Select molecule'
                name='moleculeSelected'
                options={biomarkersOptions}
                value={props.biomarkerForm.moleculeSelected}
                onChange={(_, { value }) => props.handleChangeMoleculeSelected(Object.values(BiomarkerType).includes(value as BiomarkerType) ? value as BiomarkerType : BiomarkerType.MRNA)}
            />

            <ButtonsForTypeOfInsert
                handleChangeMoleculeInputSelected={props.handleChangeMoleculeInputSelected}
                moleculesTypeOfSelection={props.biomarkerForm.moleculesTypeOfSelection}
            />

            {props.biomarkerForm.moleculesTypeOfSelection === MoleculesTypeOfSelection.INPUT &&
                <SelectDropDownSingleMolecule
                    handleAddMoleculeToSection={props.handleAddMoleculeToSection}
                    handleSearchNewData={props.handleGenesSymbolsFinder}
                    options={props.biomarkerForm.moleculesSymbolsFinder} />
            }

            {props.biomarkerForm.moleculesTypeOfSelection === MoleculesTypeOfSelection.AREA &&
                <TextAreaMolecules handleGenesSymbols={props.handleGenesSymbols} />
            }

            <Container className='biomarkers--side--bar--buttons--box'>
                {haveInvalid &&
                    <div className='biomarkers--side--bar--validation--items'>
                        <Label color='orange' className='biomarkers--side--bar--validation--labels'>
                            Some molecules (in orange) from the molecule panels where not found in our database.
                        </Label>
                    </div>
                }

                {haveAmbiguous &&
                    <div className='biomarkers--side--bar--validation--items'>
                        <Label color='yellow' className='biomarkers--side--bar--validation--labels'>
                            There are some ambiguous molecules (in yellow). Please select the appropriate ones in the molecule panels.
                        </Label>
                    </div>
                }

                <Checkbox
                    className='biomarkers--side--bar--validation--items'
                    label={
                        <label>
                            Ignore molecules with warnings

                            <InfoPopup
                                content='This message does not indicate that there is an error in your data, but that these molecules were not found during our validation process. This may be due to outdated data or the use of different nomenclatures or standards. In case you are sure that there are no corrections to be made and you wish to continue with the Biomarker saving, check the following Checkbox to enable the form submission'
                                onTop={false}
                                onEvent='hover'
                                extraClassName='margin-left-5'
                            />
                        </label>
                    }
                    checked={props.biomarkerForm.validation.checkBox}
                    onChange={() => props.handleChangeCheckBox(!props.biomarkerForm.validation.checkBox)}
                />

                {/* Submit form button */}
                <Container className='biomarkers--side--bar--box'>
                    <Button
                        color='green'
                        content={props.biomarkerForm.id ? 'Save changes' : 'Send Form'}
                        fluid
                        onClick={props.handleSendForm}
                        loading={props.biomarkerForm.validation.isLoading}
                        disabled={props.biomarkerForm.validation.isLoading || (haveAmbiguous || haveInvalid) || !props.biomarkerForm.biomarkerName}
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
                        // TODO: chequear la opinion antes de borrar isFormEmpty
                        // disabled={props.isFormEmpty()}
                    />
                </Container>
            </Container>
        </Segment>
    )
}
