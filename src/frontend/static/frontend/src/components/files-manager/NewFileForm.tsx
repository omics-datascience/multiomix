import React from 'react'
import { DropdownItemProps, Form, Header, Label, List, Segment } from 'semantic-ui-react'
import { ACCEPTED_FILE_TYPES } from '../../utils/constants'
import { DjangoMethylationPlatform } from '../../utils/django_interfaces'
import { FileType } from '../../utils/interfaces'
import { checkedValidityCallback } from '../../utils/util_functions'
import { InfoPopup } from '../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { SurvivalTuplesForm } from '../survival/SurvivalTuplesForm'
import { NewFile } from './FilesManager'
import { InstitutionsDropdown } from './InstitutionsDropdown'

/**
 * Component's props
 */
interface NewFileFormProps {
    newFileInputRef: any,
    newFile: NewFile,
    fileTypeOptions: any[],
    tagOptions: DropdownItemProps[],
    institutionsOptions: DropdownItemProps[],
    uploadingFile: boolean,
    newFileIsValid: boolean,
    isEditing: boolean,
    uploadFile: () => void,
    fileChange: (e: any) => void,
    handleAddFileInputsChange: (name: string, value: any) => void,
    resetNewFileForm: () => void,
    handleSurvivalFormDatasetChanges: (idx: number, name: string, value) => void,
    addSurvivalFormTuple: () => void,
    removeSurvivalFormTuple: (idx: number) => void
}

/**
 * Renders a form to submit a new UserFile
 * @param props Component's props
 * @returns Component
 */
export const NewFileForm = (props: NewFileFormProps) => {
    const checkedHandleFormChanges = checkedValidityCallback(props.handleAddFileInputsChange)

    return (
        <Segment>
            <Form loading={props.uploadingFile}>
                <Form.Group>
                    <InfoPopup
                        content={
                            <React.Fragment>
                                <Header>Datasets</Header>

                                <p>In this form you can submit your own datasets. It will be pre-processed and will be available to launch new experiments or share with colleagues from the institutions to which you belong</p>

                                <Header as='h2'>Important considerations</Header>

                                <List bulleted>
                                    <List.Item>First row <strong>must be a header</strong></List.Item>
                                    <List.Item>First column <strong>must be the index</strong>, the rest the samples expression data</List.Item>
                                    <List.Item>CSV, TSV or TXT files are accepted. Excel files will be supported in a near future</List.Item>
                                    <List.Item>The column and decimal delimiters will be inferred from the data</List.Item>
                                </List>

                                <img
                                    src='static/frontend/img/datasets/DatasetFormat.jpg'
                                    className='margin-top-5'
                                    alt="Dataset format"
                                />
                            </React.Fragment>
                        }
                        onTop={false}
                    />

                    {/* New file button */}
                    <Form.Button
                        fluid
                        className='ellipsis'
                        content={props.isEditing ? 'Editing...' : props.newFile.newFileName}
                        color='blue'
                        onClick={() => props.newFileInputRef.current.click()}
                        width={2}
                        disabled={props.isEditing}
                    />
                    <input
                        ref={props.newFileInputRef}
                        type="file"
                        accept={ACCEPTED_FILE_TYPES}
                        hidden
                        onChange={props.fileChange}
                    />

                    {/* Filename input */}
                    <Form.Input
                        placeholder='Filename'
                        name='newFileNameUser'
                        value={props.newFile.newFileNameUser}
                        onChange={checkedHandleFormChanges}
                        width={3}
                        maxLength={150}
                    />

                    {/* File type */}
                    <Form.Select
                        fluid
                        options={props.fileTypeOptions}
                        name='newFileType'
                        value={props.newFile.newFileType}
                        onChange={(_, { name, value }) => props.handleAddFileInputsChange(name, value)}
                        placeholder='File type'
                        width={2}
                    />

                    {/* File description input */}
                    <Form.Input
                        placeholder='Description (optional)'
                        name='newFileDescription'
                        value={props.newFile.newFileDescription}
                        onChange={checkedHandleFormChanges}
                        width={3}
                        maxLength={300}
                    />

                    <Form.Dropdown
                        fluid
                        width={3}
                        options={props.tagOptions}
                        search
                        selection
                        clearable
                        name='newTag'
                        value={props.newFile.newTag as number}
                        onChange={(_, { name, value }) => props.handleAddFileInputsChange(name, value)}
                        placeholder='Tag (optional)'
                    />

                    {/* Submit button */}
                    <Form.Button
                        fluid
                        content={props.isEditing ? 'Save' : 'Upload'}
                        color='green'
                        disabled={!props.newFileIsValid}
                        onClick={props.uploadFile}
                        width={2}
                    />

                    {/* Reset form button */}
                    <Form.Button
                        width={1}
                        icon='trash'
                        color="red"
                        onClick={props.resetNewFileForm}
                        disabled={!props.newFileIsValid}
                        title="Clear the form"
                    />
                </Form.Group>

                {/* Institution options */}
                <Form.Group>
                    <InstitutionsDropdown
                        value={props.newFile.institutions}
                        name='institutions'
                        institutionsOptions={props.institutionsOptions}
                        handleChange={props.handleAddFileInputsChange}
                    />

                    {props.newFile.newFileType === FileType.METHYLATION &&
                        <React.Fragment>
                            <Form.Select
                                fluid
                                options={[
                                    { key: 'gene', value: false, text: 'Gene ID' },
                                    { key: 'cg', value: true, text: 'CpG site ID' }
                                ]}
                                name='isCpGSiteId'
                                value={props.newFile.isCpGSiteId}
                                onChange={(_, { name, value }) => props.handleAddFileInputsChange(name, value)}
                                placeholder='File type'
                                width={2}
                            />

                            {props.newFile.isCpGSiteId &&
                                <Form.Select
                                    fluid
                                    options={[
                                        { key: '450', value: DjangoMethylationPlatform.PLATFORM_450, text: 'Platform 450' },
                                        /* TODO: implement platform 27 when dictionary is available */
                                        { key: '27', value: DjangoMethylationPlatform.PLATFORM_450, text: 'Platform 27', disabled: true }
                                    ]}
                                    name='platform'
                                    value={props.newFile.platform}
                                    onChange={(_, { name, value }) => props.handleAddFileInputsChange(name, value)}
                                    placeholder='File type'
                                    width={2}
                                />
                            }
                        </React.Fragment>
                    }

                    {/* Warning about upload time */}
                    <Label color='yellow' size='large'>
                        Note: the upload time is subject to the size of the file
                    </Label>
                </Form.Group>

                {props.newFile.newFileType === FileType.CLINICAL &&
                    <SurvivalTuplesForm
                        survivalColumns={props.newFile.survivalColumns}
                        inline={true}
                        handleSurvivalFormDatasetChanges={props.handleSurvivalFormDatasetChanges}
                        addSurvivalFormTuple={props.addSurvivalFormTuple}
                        removeSurvivalFormTuple={props.removeSurvivalFormTuple}
                    />
                }
            </Form>
        </Segment>
    )
}
