import React from 'react'
import { DropdownItemProps, Input, Segment, Header, Icon, Divider, Button, Label, Form } from 'semantic-ui-react'
import { DjangoCGDSStudy } from '../../utils/django_interfaces'
import { NameOfCGDSDataset } from '../../utils/interfaces'
import { NewCGDSDatasetForm } from './NewCGDSDatasetForm'
import { parseValue, checkedValidityCallback } from '../../utils/util_functions'
import { useIntl } from 'react-intl'
import { normalizeTissues } from '../common/TissueLabels'

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
    cleanForm: () => void
    tissueOptions: DropdownItemProps[]
}

/**
 * Renders a form to add a CGDS Study
 * @param props Component's props
 * @returns Component
 */
export const NewCGDSStudyForm = (props: NewCGDSStudyFormProps) => {
    const intl = useIntl()
    const checkedHandleFormChanges = checkedValidityCallback(props.handleFormChanges)
    const tissues = normalizeTissues(props.newCGDSStudy.tissue)
    const isDisabled = props.newCGDSStudy.name.trim().length === 0 &&
                    props.newCGDSStudy.description.trim().length === 0 &&
                    props.newCGDSStudy.url.trim().length === 0 &&
                    props.newCGDSStudy.url_study_info.trim().length === 0 &&
                    props.newCGDSStudy.mrna_dataset === null &&
                    props.newCGDSStudy.mirna_dataset === null &&
                    props.newCGDSStudy.cna_dataset === null &&
                    props.newCGDSStudy.methylation_dataset === null &&
                    props.newCGDSStudy.clinical_patient_dataset === null &&
                    props.newCGDSStudy.clinical_sample_dataset === null &&
                    tissues.length === 0
    return (
        <Segment>
            <Header textAlign='center'>
                <Icon name='database' />
                <Header.Content>{intl.formatMessage({ id: 'cgdsStudyForm.header' })}</Header.Content>
            </Header>

            {/* Name */}
            <Input
                icon='asterisk'
                fluid
                name='name'
                className='no-margin-right'
                value={props.newCGDSStudy.name}
                onChange={checkedHandleFormChanges}
                onKeyDown={props.handleKeyDown}
                disabled={props.addingOrEditingCGDSStudy}
                placeholder={intl.formatMessage({ id: 'common.name' })}
                maxLength={150}
            />

            {/* Description */}
            <Input
                fluid
                name='description'
                className='margin-top-2'
                value={parseValue(props.newCGDSStudy.description)}
                onChange={(_, { name, value }) => props.handleFormChanges(name, value)}
                onKeyDown={props.handleKeyDown}
                disabled={props.addingOrEditingCGDSStudy}
                placeholder={intl.formatMessage({ id: 'common.description' })}
            />

            {/* URL */}
            <Input
                icon='asterisk'
                fluid
                name='url'
                className='margin-top-2'
                value={props.newCGDSStudy.url}
                onChange={checkedHandleFormChanges}
                onKeyDown={props.handleKeyDown}
                disabled={props.addingOrEditingCGDSStudy}
                placeholder={intl.formatMessage({ id: 'cgdsStudyForm.url.placeholder' })}
                maxLength={300}
            />

            {/* URL of study's extra info */}
            <Input
                fluid
                name='url_study_info'
                className='margin-top-2'
                value={parseValue(props.newCGDSStudy.url_study_info)}
                onChange={checkedHandleFormChanges}
                onKeyDown={props.handleKeyDown}
                disabled={props.addingOrEditingCGDSStudy}
                placeholder={intl.formatMessage({ id: 'cgdsStudyForm.urlInfo.placeholder' })}
                maxLength={300}
            />

            <Divider />

            <Form.Dropdown
                fluid
                className='margin-top-2'
                options={props.tissueOptions}
                search
                selection
                clearable
                name='tissue'
                value={typeof tissues[0] === 'number'
                    ? tissues[0]
                    : tissues[0]?.id ?? ''}
                onChange={(_, { name, value }) => props.handleFormChanges(name, value || null)}
                placeholder='Tissue (optional)'
                disabled={props.addingOrEditingCGDSStudy}
            />

            {/* Dataset */}
            <Header textAlign='center'>
                <Icon name='file archive' />
                <Header.Content>{intl.formatMessage({ id: 'cgdsStudyForm.datasets.header' })}</Header.Content>
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
                newCGDSStudy={props.newCGDSStudy}
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
                newCGDSStudy={props.newCGDSStudy}
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
                newCGDSStudy={props.newCGDSStudy}
            />

            {/* Methylation Dataset */}
            <NewCGDSDatasetForm
                newCGDSDataset={props.newCGDSStudy.methylation_dataset}
                nameToShow={intl.formatMessage({ id: 'cgdsStudyForm.dataset.methylation' })}
                datasetName='methylation_dataset'
                showSurvivalTuplesForm={false}
                addingOrEditingCGDSStudy={props.addingOrEditingCGDSStudy}
                handleFormDatasetChanges={props.handleFormDatasetChanges}
                addCGDSDataset={props.addCGDSDataset}
                removeCGDSDataset={props.removeCGDSDataset}
                newCGDSStudy={props.newCGDSStudy}
            />

            {/* Clinical Patients Dataset */}
            <NewCGDSDatasetForm
                newCGDSDataset={props.newCGDSStudy.clinical_patient_dataset}
                nameToShow={intl.formatMessage({ id: 'cgdsStudyForm.dataset.clinicalPatients' })}
                datasetName='clinical_patient_dataset'
                showSurvivalTuplesForm
                addingOrEditingCGDSStudy={props.addingOrEditingCGDSStudy}
                handleFormDatasetChanges={props.handleFormDatasetChanges}
                addSurvivalFormTuple={props.addSurvivalFormTuple}
                removeSurvivalFormTuple={props.removeSurvivalFormTuple}
                handleSurvivalFormDatasetChanges={props.handleSurvivalFormDatasetChanges}
                addCGDSDataset={props.addCGDSDataset}
                removeCGDSDataset={props.removeCGDSDataset}
                newCGDSStudy={props.newCGDSStudy}
            />

            {/* Clinical Samples Dataset */}
            <NewCGDSDatasetForm
                newCGDSDataset={props.newCGDSStudy.clinical_sample_dataset}
                nameToShow={intl.formatMessage({ id: 'cgdsStudyForm.dataset.clinicalSamples' })}
                datasetName='clinical_sample_dataset'
                showSurvivalTuplesForm={false}
                addingOrEditingCGDSStudy={props.addingOrEditingCGDSStudy}
                handleFormDatasetChanges={props.handleFormDatasetChanges}
                addCGDSDataset={props.addCGDSDataset}
                removeCGDSDataset={props.removeCGDSDataset}
                newCGDSStudy={props.newCGDSStudy}
            />

            <div className='margin-top-5'>
                <Icon name='asterisk' /> {intl.formatMessage({ id: 'cgdsStudyForm.requiredField' })}

                <Label color='yellow' className='align-center' size='large'>
                    {intl.formatMessage({ id: 'cgdsStudyForm.syncWarning' })}
                </Label>
            </div>

            {/* Submit form button */}
            <Button
                color='green'
                content={`${props.newCGDSStudy && props.newCGDSStudy.id ? intl.formatMessage({ id: 'cgdsStudyForm.editStudy' }) : intl.formatMessage({ id: 'cgdsStudyForm.addStudy' })}`}
                className='margin-top-2'
                fluid
                onClick={props.addOrEditStudy}
                disabled={!props.canAddCGDSStudy()}
            />

            {/* Cancel button */}
            <Button
                color='red'
                content={intl.formatMessage({ id: 'common.cancel' })}
                className='margin-top-2'
                fluid
                onClick={props.cleanForm}
                disabled={isDisabled}
            />
        </Segment>
    )
}
