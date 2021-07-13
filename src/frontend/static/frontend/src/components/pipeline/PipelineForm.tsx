import React from 'react'
import { Segment, Grid, Icon, Header, Button, Form, Label, DropdownMenuProps, Progress } from 'semantic-ui-react'
import { FileType, SourceType, NewExperiment } from '../../utils/interfaces'
import { checkedValidityCallback, experimentSourceIsValid, getExperimentTypeObj } from '../../utils/util_functions'
import { ExperimentTagInfo } from './ExperimentTagInfo'
import { DjangoTag, DjangoUserFile, DjangoCGDSStudy } from '../../utils/django_interfaces'
import { SourceForm } from './SourceForm'
import { NewExperimentSourceStateName } from './Pipeline'
import { PipelineAdvancedForm } from './PipelineAdvancedForm'
import { InfoPopup } from './experiment-result/gene-gem-details/InfoPopup'
import { PipelineSourcePopupContent } from './PipelineSourcePopupContent'

/**
 * Component's props
 */
interface PipelineFormProps {
    newExperiment: NewExperiment,
    gemFileType: FileType
    /** Upload percentage to show progress */
    uploadPercentage: number,
    // New Tag
    isSelectingTagForNewExperiment: boolean,
    tagOptions: DropdownMenuProps[],
    newTagForNewExperiment: DjangoTag
    addingTagForNewExperiment: boolean,
    gettingCommonSamples: boolean,
    numberOfSamplesMRNA: number,
    numberOfSamplesMiRNA: number,
    numberOfSamplesInCommon: number,
    selectTagForNewExperiment: (selectedTagId: any) => void,
    handleKeyDownForNewExperiment: (e) => void,
    handleAddTagInputsChangeForNewExperiment: (name: string, value: any) => void,
    toggleDisplayTagForm: () => void,
    // Rest of parameters
    sendingRequest: boolean,
    runPipeline: () => void,
    makeEditExperimentRequest: () => void,
    handleFormInputsChange: (name: string, value) => void,
    resetExperimentForm: () => void,
    noDataEntered: () => boolean,
    /** An optional callback to handle changes in source select types */
    handleChangeSourceType: (sourceType: SourceType, sourceStateName: NewExperimentSourceStateName) => void,
    /** Function callback when a new file is selected from OS browser window */
    selectNewFile: (e: Event) => void,
    /** Function callback when a file is selected from Dataset Modal */
    selectUploadedFile: (selectedFile: DjangoUserFile, sourceStateName: NewExperimentSourceStateName) => void,
    /** Function callback when a study is selected from CGDS Modal */
    selectStudy: (selectedStudy: DjangoCGDSStudy, sourceStateName: NewExperimentSourceStateName) => void,
    /** Function callback to handle GEM FileType changes */
    selectGEMFileType: (fileType: FileType) => void
}
/**
 * Renders a form to submit an experiment/pipeline
 * @param props Component's props
 */
export class PipelineForm extends React.Component<PipelineFormProps, {}> {
    /**
     * Checks if user can submit the files to run a pipeline
     * @returns True if can submit, false otherwise
     */
    canRunPipeline (): boolean {
        // For short...
        const newExperiment = this.props.newExperiment

        return !this.props.sendingRequest &&
            newExperiment.name.trim().length > 0 &&
            experimentSourceIsValid(newExperiment.mRNASource) &&
            experimentSourceIsValid(newExperiment.gemSource)
    }

    /**
     * Checks if user is editing an experiment
     * @returns True if is editing. False otherwise
     */
    isEditing () { return this.props.newExperiment.id !== undefined && this.props.newExperiment.id !== null }

    /**
     * Checks if user can save an experiment changes
     * @returns True if all the required fields are filled. False otherwise
     */
    canEdit = (): boolean => this.isEditing() && this.props.newExperiment.name.trim().length > 0

    render () {
        // For short...
        const newExperiment = this.props.newExperiment

        // Gets the 'isEditing' flag
        const isEditing = this.isEditing()

        let numberSamplesInCommon, numberSamplesMRNA, numberSamplesGEM
        if (this.props.gettingCommonSamples) {
            numberSamplesInCommon = numberSamplesMRNA = numberSamplesGEM = <Icon name='sync alternate' loading />
        } else {
            numberSamplesMRNA = this.props.numberOfSamplesMRNA
            numberSamplesGEM = this.props.numberOfSamplesMiRNA
            numberSamplesInCommon = this.props.numberOfSamplesInCommon
        }

        const selectedGEMFileType = this.props.gemFileType

        const gemData = getExperimentTypeObj(this.props.gemFileType, 'FileType')

        // Prevents showing a red progress bar which was a minor change in journal revision
        const uploadPercentage = Math.max(30, this.props.uploadPercentage)
        const progressOrButton = this.props.sendingRequest
            ? (
                <Progress
                    id='analysis-progress-bar'
                    className='margin-top-2'
                    percent={uploadPercentage}
                    indicating
                    label='Preparing analysis'
                />
            ) : (
                <Button
                    color='green'
                    content={isEditing ? 'Save changes' : 'Run analysis'}
                    className="margin-top-2"
                    fluid
                    onClick={isEditing ? this.props.makeEditExperimentRequest : this.props.runPipeline}
                    loading={this.props.sendingRequest}
                    disabled={isEditing ? !this.canEdit() : !this.canRunPipeline()}
                />
            )

        return (
            <div>
                <div className='full-width margin-bottom-5'>
                    <Button.Group size='tiny'>
                        <Button
                            active={selectedGEMFileType === FileType.MIRNA}
                            onClick={() => this.props.selectGEMFileType(FileType.MIRNA)}
                        >
                            miRNA
                        </Button>
                        <Button
                            active={selectedGEMFileType === FileType.CNA}
                            onClick={() => this.props.selectGEMFileType(FileType.CNA)}
                        >
                            CNA
                        </Button>
                        <Button
                            active={selectedGEMFileType === FileType.METHYLATION}
                            onClick={() => this.props.selectGEMFileType(FileType.METHYLATION)}
                        >
                            Met.
                        </Button>
                    </Button.Group>
                </div>

                {/* Files Panel */}
                <Segment>
                    <Grid className="padded-left-10 padded-right-10">
                        <InfoPopup content={<PipelineSourcePopupContent/>}/>

                        {/* mRNA SourceForm */}
                        <SourceForm
                            source={newExperiment.mRNASource}
                            headerTitle='mRNA profile'
                            headerIcon={{
                                type: 'img',
                                src: 'static/frontend/img/profiles/mRNA.svg'
                            }}
                            fileType={FileType.MRNA}
                            disabled={isEditing}
                            tagOptions={this.props.tagOptions}
                            handleChangeSourceType={(selectedSourceType) => {
                                this.props.handleChangeSourceType(selectedSourceType, 'mRNASource')
                            }}
                            selectNewFile={this.props.selectNewFile}
                            selectUploadedFile={(selectedFile) => {
                                this.props.selectUploadedFile(selectedFile, 'mRNASource')
                            }}
                            selectStudy={(selectedStudy) => {
                                this.props.selectStudy(selectedStudy, 'mRNASource')
                            }}
                        />

                        {/* GEM SourceForm */}
                        <SourceForm
                            source={newExperiment.gemSource}
                            headerTitle={`${gemData.description} profile`}
                            headerIcon={{
                                type: 'img',
                                src: `static/frontend/img/profiles/${gemData.image}`
                            }}
                            fileType={selectedGEMFileType}
                            disabled={isEditing}
                            tagOptions={this.props.tagOptions}
                            handleChangeSourceType={(selectedSourceType) => {
                                this.props.handleChangeSourceType(selectedSourceType, 'gemSource')
                            }}
                            selectNewFile={this.props.selectNewFile}
                            selectUploadedFile={(selectedFile) => {
                                this.props.selectUploadedFile(selectedFile, 'gemSource')
                            }}
                            selectStudy={(selectedStudy) => {
                                this.props.selectStudy(selectedStudy, 'gemSource')
                            }}
                        />

                        {/* Number of samples in common */}
                        <Grid.Row>
                            <Label className='full-width align-left'>
                                <p>Samples mRNA: {numberSamplesMRNA}</p>
                                <p>Samples {gemData.description}: {numberSamplesGEM}</p>
                                <p>Samples in common: {numberSamplesInCommon}</p>
                            </Label>
                        </Grid.Row>
                    </Grid>
                </Segment>

                {/* Name, description and tag panel */}
                <Segment>
                    <Header textAlign="left">
                        <Header.Content>Analysis info</Header.Content>
                    </Header>

                    <Form>
                        <Form.Input
                            icon='asterisk'
                            placeholder='Name'
                            name='name'
                            value={newExperiment.name}
                            onChange={checkedValidityCallback(this.props.handleFormInputsChange)}
                            maxLength={100}
                        />

                        <Form.TextArea
                            placeholder='Description (optional)'
                            name='description'
                            value={newExperiment.description}
                            onChange={(_, { name, value }) => this.props.handleFormInputsChange(name, value)}
                        />
                    </Form>

                    <ExperimentTagInfo
                        experiment={newExperiment}
                        isSelectingTag={this.props.isSelectingTagForNewExperiment}
                        toggleDisplayTagForm={this.props.toggleDisplayTagForm}
                        tagOptions={this.props.tagOptions}
                        selectTagForNewExperiment={this.props.selectTagForNewExperiment}
                        newTag={this.props.newTagForNewExperiment}
                        addingTag={this.props.addingTagForNewExperiment}
                        handleKeyDown={this.props.handleKeyDownForNewExperiment}
                        handleAddTagInputsChange={this.props.handleAddTagInputsChangeForNewExperiment}
                    />
                </Segment>

                {/* Control Panel */}
                <Segment textAlign = 'left'>
                    <PipelineAdvancedForm
                        newExperiment={this.props.newExperiment}
                        isEditing={isEditing}
                        gemDescription={gemData.description}
                        gemFileType={this.props.gemFileType}
                        handleFormInputsChange={this.props.handleFormInputsChange}
                    />

                    <Icon name='asterisk'/> Required field

                    <Form>
                        {/* Progress bar or submit analysis run/edition button */}
                        {progressOrButton}

                        {/* Warning about upload time */}
                        <Label className="margin-top-2 full-width no-margin-left align-center" color="yellow">
                            The upload time is subject to the size of the file
                        </Label>

                        {/* Cancel button */}
                        <Button
                            color='red'
                            content='Clear form'
                            className="margin-top-2"
                            fluid
                            onClick={this.props.resetExperimentForm}
                            disabled={this.props.noDataEntered()}
                        />
                    </Form>
                </Segment >
            </div>
        )
    }
}
