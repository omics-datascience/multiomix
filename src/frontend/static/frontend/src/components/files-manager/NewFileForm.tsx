import React from 'react'
import { DropdownItemProps, Form, Grid, Header, Label, List, Progress, Segment } from 'semantic-ui-react'
import { ACCEPTED_FILE_TYPES } from '../../utils/constants'
import { DjangoMethylationPlatform } from '../../utils/django_interfaces'
import { UploadState } from '../../utils/file_uploader'
import { FileType, Nullable } from '../../utils/interfaces'
import { checkedValidityCallback } from '../../utils/util_functions'
import { InfoPopup } from '../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { SurvivalTuplesForm } from '../survival/SurvivalTuplesForm'
import { NewFile } from './FilesManager'
import { InstitutionsDropdown } from './InstitutionsDropdown'

/** UploadLabel props. */
interface UploadLabelProps {
    uploadState: Nullable<UploadState>
}

/**
 * Renders a label component with a help popup.
 * @param props Component props.
 * @returns Component
 */
const UploadLabel = (props: UploadLabelProps) => {
    const isUploading = props.uploadState === null || props.uploadState === UploadState.UPLOADING_CHUNKS
    const [header, description]: [string, string] = isUploading
        ? ['Uploading file', 'The file is being uploaded in chunks']
        : ['Ensuring file quality', 'We perform a serie of checks to ensure that the data received on our server is correct']

    return (
        <span>
            {isUploading ? 'Uploading file' : 'Checking file'}

            <InfoPopup
                content={
                    <React.Fragment>
                        <Header>{header}</Header>

                        <p>{description}. Please note that <strong>this process may take a few minutes depending on the size of the file. You can still use Multiomix from another browser tab</strong>. Thanks for your patience.</p>
                    </React.Fragment>
                }
                onTop={false}
                extraClassName='margin-left-5'
            />
        </span>
    )
}

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
    uploadPercentage: number,
    newFileIsValid: boolean,
    isEditing: boolean,
    uploadState: Nullable<UploadState>
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

    let progressOrButton
    if (props.uploadingFile) {
        progressOrButton = (
            <Form.Field width={14}>
                <Progress
                    percent={props.uploadPercentage}
                    indicating
                >
                    <UploadLabel uploadState={props.uploadState}/>
                </Progress>
            </Form.Field>
        )
    } else {
        progressOrButton = (
            <Form.Button
                fluid
                className='ellipsis'
                content={props.isEditing ? 'Editing...' : props.newFile.newFileName}
                color='blue'
                onClick={() => props.newFileInputRef.current.click()}
                width={14}
                disabled={props.isEditing || props.uploadingFile}
            />
        )
    }

    return (
        <Segment>
            <Form>
                <Form.Group>
                    <Grid className='padded-left-10 full-width'>
                        <Grid.Row>
                            {/* New file button */}
                            {progressOrButton}

                            {/* This hidden input must be present in DOM to prevent issues with React ref */}
                            <input
                                ref={props.newFileInputRef}
                                type="file"
                                accept={ACCEPTED_FILE_TYPES}
                                hidden
                                onChange={props.fileChange}
                            />

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
                        </Grid.Row>

                        <Grid.Row>
                            {/* Filename input */}
                            <Form.Input
                                placeholder='Filename'
                                name='newFileNameUser'
                                value={props.newFile.newFileNameUser}
                                onChange={checkedHandleFormChanges}
                                width={16}
                                maxLength={150}
                                disabled={props.uploadingFile}
                            />
                        </Grid.Row>

                        <Grid.Row>
                            {/* File type */}
                            <Form.Select
                                fluid
                                options={props.fileTypeOptions}
                                name='newFileType'
                                value={props.newFile.newFileType}
                                onChange={(_, { name, value }) => props.handleAddFileInputsChange(name, value)}
                                placeholder='File type'
                                width={16}
                                disabled={props.uploadingFile}
                            />
                        </Grid.Row>

                        {props.newFile.newFileType === FileType.METHYLATION && <React.Fragment>
                            <Grid.Row>
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
                                    width={16}
                                    disabled={props.uploadingFile}
                                />
                            </Grid.Row>

                            {props.newFile.isCpGSiteId && <Grid.Row>
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
                                    width={16}
                                    disabled={props.uploadingFile}
                                />
                            </Grid.Row>}
                        </React.Fragment>}

                        <Grid.Row>
                            {/* File description input */}
                            <Form.Input
                                placeholder='Description (optional)'
                                name='newFileDescription'
                                value={props.newFile.newFileDescription}
                                onChange={checkedHandleFormChanges}
                                width={16}
                                maxLength={300}
                                disabled={props.uploadingFile}
                            />
                        </Grid.Row>

                        <Grid.Row>
                            <Form.Dropdown
                                fluid
                                width={16}
                                options={props.tagOptions}
                                search
                                selection
                                clearable
                                name='newTag'
                                value={props.newFile.newTag as number}
                                onChange={(_, { name, value }) => props.handleAddFileInputsChange(name, value)}
                                placeholder='Tag (optional)'
                                disabled={props.uploadingFile}
                            />
                        </Grid.Row>

                        {/* Institution options */}
                        <Grid.Row>
                            <InstitutionsDropdown
                                value={props.newFile.institutions}
                                name='institutions'
                                institutionsOptions={props.institutionsOptions}
                                handleChange={props.handleAddFileInputsChange}
                                disabled={props.uploadingFile}
                            />
                        </Grid.Row>

                        <Grid.Row>
                            {/* Warning about upload time */}
                            <Label color='yellow' size='large'>
                                Note: the upload time is subject to the size of the file
                            </Label>
                        </Grid.Row>

                        <Grid.Row>
                            {/* Submit button */}
                            <Form.Button
                                className='no-padding-left'
                                fluid
                                content={props.isEditing ? 'Save' : 'Upload'}
                                color='green'
                                disabled={!props.newFileIsValid || props.uploadingFile}
                                onClick={props.uploadFile}
                                width={10}
                            />

                            {/* Reset form button */}
                            <Form.Button
                                className='no-padding-right'
                                fluid
                                width={6}
                                icon='trash'
                                color="red"
                                onClick={props.resetNewFileForm}
                                disabled={!props.newFileIsValid || props.uploadingFile}
                                title="Clear the form"
                            />
                        </Grid.Row>

                        {props.newFile.newFileType === FileType.CLINICAL &&
                            <SurvivalTuplesForm
                                noPadding
                                survivalColumns={props.newFile.survivalColumns}
                                handleSurvivalFormDatasetChanges={props.handleSurvivalFormDatasetChanges}
                                addSurvivalFormTuple={props.addSurvivalFormTuple}
                                removeSurvivalFormTuple={props.removeSurvivalFormTuple}
                                disabled={props.uploadingFile}
                            />
                        }
                    </Grid>
                </Form.Group>
            </Form>
        </Segment>
    )
}
