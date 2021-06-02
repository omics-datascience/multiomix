import React from 'react'
import { Input, Segment, Header, Icon, Divider, Button, Label } from 'semantic-ui-react'
import { DjangoCGDSStudy } from '../../utils/django_interfaces'
import { NameOfCGDSDataset } from '../../utils/interfaces'
import { NewCGDSDatasetForm } from './NewCGDSDatasetForm'
import { parseValue, checkedValidityCallback } from '../../utils/util_functions'

/**
 * Component's props
 */
interface NewCGDSStudyFormProps {
    newCGDSStudy: DjangoCGDSStudy,
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
export const NewCGDSStudyForm = (props: NewCGDSStudyFormProps) => {
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

            {/* Description */}
            <Input
                fluid
                name='description'
                className="margin-top-2"
                value={parseValue(props.newCGDSStudy.description)}
                onChange={(_, { name, value }) => props.handleFormChanges(name, value)}
                onKeyDown={props.handleKeyDown}
                disabled={props.addingOrEditingCGDSStudy}
                placeholder='Description'
            />

            {/* URL */}
            <Input
                icon='asterisk'
                fluid
                name='url'
                className="margin-top-2"
                value={props.newCGDSStudy.url}
                onChange={checkedHandleFormChanges}
                onKeyDown={props.handleKeyDown}
                disabled={props.addingOrEditingCGDSStudy}
                placeholder='URL (tar.gz/zip)'
                maxLength={300}
            />

            {/* URL of study's extra info */}
            <Input
                fluid
                name='url_study_info'
                className="margin-top-2"
                value={parseValue(props.newCGDSStudy.url_study_info)}
                onChange={checkedHandleFormChanges}
                onKeyDown={props.handleKeyDown}
                disabled={props.addingOrEditingCGDSStudy}
                placeholder='URL of extra info'
                maxLength={300}
            />

            <Divider/>

            {/* Dataset */}
            <Header textAlign="center">
                <Icon name='file archive' />
                <Header.Content>CGDS Datasets</Header.Content>
            </Header>

            {/* mRNA Dataset */}
            <NewCGDSDatasetForm
                newCGDSDataset={props.newCGDSStudy.mrna_dataset}
                nameToShow='mRNA'
                datasetName='mrna_dataset'
                showSurvivalTuplesForm={false}
                addingOrEditingCGDSStudy={props.addingOrEditingCGDSStudy}
                handleFormDatasetChanges={props.handleFormDatasetChanges}
                addCGDSDataset={props.addCGDSDataset}
                removeCGDSDataset={props.removeCGDSDataset}
            />

            {/* miRNA Dataset */}
            <NewCGDSDatasetForm
                newCGDSDataset={props.newCGDSStudy.mirna_dataset}
                nameToShow='miRNA'
                datasetName='mirna_dataset'
                showSurvivalTuplesForm={false}
                addingOrEditingCGDSStudy={props.addingOrEditingCGDSStudy}
                handleFormDatasetChanges={props.handleFormDatasetChanges}
                addCGDSDataset={props.addCGDSDataset}
                removeCGDSDataset={props.removeCGDSDataset}
            />

            {/* CNA Dataset */}
            <NewCGDSDatasetForm
                newCGDSDataset={props.newCGDSStudy.cna_dataset}
                nameToShow='CNA'
                datasetName='cna_dataset'
                showSurvivalTuplesForm={false}
                addingOrEditingCGDSStudy={props.addingOrEditingCGDSStudy}
                handleFormDatasetChanges={props.handleFormDatasetChanges}
                addCGDSDataset={props.addCGDSDataset}
                removeCGDSDataset={props.removeCGDSDataset}
            />

            {/* Methylation Dataset */}
            <NewCGDSDatasetForm
                newCGDSDataset={props.newCGDSStudy.methylation_dataset}
                nameToShow='Methylation'
                datasetName='methylation_dataset'
                showSurvivalTuplesForm={false}
                addingOrEditingCGDSStudy={props.addingOrEditingCGDSStudy}
                handleFormDatasetChanges={props.handleFormDatasetChanges}
                addCGDSDataset={props.addCGDSDataset}
                removeCGDSDataset={props.removeCGDSDataset}
            />

            {/* Clinical Patients Dataset */}
            <NewCGDSDatasetForm
                newCGDSDataset={props.newCGDSStudy.clinical_patient_dataset}
                nameToShow='Clinical Patients'
                datasetName='clinical_patient_dataset'
                showSurvivalTuplesForm={true}
                addingOrEditingCGDSStudy={props.addingOrEditingCGDSStudy}
                handleFormDatasetChanges={props.handleFormDatasetChanges}
                addSurvivalFormTuple={props.addSurvivalFormTuple}
                removeSurvivalFormTuple={props.removeSurvivalFormTuple}
                handleSurvivalFormDatasetChanges={props.handleSurvivalFormDatasetChanges}
                addCGDSDataset={props.addCGDSDataset}
                removeCGDSDataset={props.removeCGDSDataset}
            />

            {/* Clinical Samples Dataset */}
            <NewCGDSDatasetForm
                newCGDSDataset={props.newCGDSStudy.clinical_sample_dataset}
                nameToShow='Clinical Samples'
                datasetName='clinical_sample_dataset'
                showSurvivalTuplesForm={false}
                addingOrEditingCGDSStudy={props.addingOrEditingCGDSStudy}
                handleFormDatasetChanges={props.handleFormDatasetChanges}
                addCGDSDataset={props.addCGDSDataset}
                removeCGDSDataset={props.removeCGDSDataset}
            />

            <div className="margin-top-5">
                <Icon name='asterisk'/> Required field

                <Label color='yellow' className='align-center' size='large'>
                    In order to have the data available, you must perform the synchronization at least once
                </Label>
            </div>

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
