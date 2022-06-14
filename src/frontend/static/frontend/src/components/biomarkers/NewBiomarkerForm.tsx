import React from 'react'
import { Input, Segment, Header, Icon, Button } from 'semantic-ui-react'
import { NameOfCGDSDataset } from '../../utils/interfaces'
import { checkedValidityCallback } from '../../utils/util_functions'
import { Biomarker } from './types'

/**
 * Component's props
 */
interface NewBiomarkerFormProps {
    newCGDSStudy: Biomarker,
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
    cleanForm: () => void
}

/**
 * Renders a form to add a CGDS Study
 * @param props Component's props
 * @returns Component
 */
export const NewBiomarkerForm = (props: NewBiomarkerFormProps) => {
    const checkedHandleFormChanges = checkedValidityCallback(props.handleFormChanges)

    return (
        <Segment>
            <Header textAlign="center">
                <Icon name='database' />
                <Header.Content>Add specification of CGDS Study</Header.Content>
            </Header>

            {/* Name */}
            <Input
                icon='asterisk'
                fluid
                name='name'
                className="no-margin-right"
                value={props.newCGDSStudy.name}
                onChange={checkedHandleFormChanges}
                onKeyDown={props.handleKeyDown}
                disabled={props.addingOrEditingCGDSStudy}
                placeholder='Name'
                maxLength={150}
            />

            {/* Submit form button */}
            <Button
                color='green'
                content={`${props.newCGDSStudy && props.newCGDSStudy.id ? 'Edit' : 'Add'} study`}
                className="margin-top-2"
                fluid
                onClick={props.addOrEditStudy}
                disabled={!props.canAddCGDSStudy()}
            />

            {/* Cancel button */}
            <Button
                color='red'
                content='Cancel'
                className="margin-top-2"
                fluid
                onClick={props.cleanForm}
                disabled={props.isFormEmpty()}
            />
        </Segment>
    )
}
