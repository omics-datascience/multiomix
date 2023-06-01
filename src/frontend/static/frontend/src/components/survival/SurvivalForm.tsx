import React from 'react'
import { Segment, Grid, Header, Select } from 'semantic-ui-react'
import { getFileTypeSelectOptions } from '../../utils/util_functions'
import { SourceForm } from '../pipeline/SourceForm'
import { FileType, SourceType } from '../../utils/interfaces'
import { DjangoCGDSStudy, DjangoUserFile } from '../../utils/django_interfaces'
import { SurvivalAnalysisPanelState, SourceStateName, ColumnStateName } from './SurvivalAnalysisPanel'

/**
 * Component's props
 */
interface SurvivalFormProps extends SurvivalAnalysisPanelState {
    selectStudy: (selectedStudy: DjangoCGDSStudy, sourceName: SourceStateName) => void,
    handleChangeSourceType: (sourceSelected: SourceType, sourceName: SourceStateName) => void,
    selectUploadedFile: (selectedFile: DjangoUserFile, sourceName: SourceStateName) => void,
    selectSurvivalColumn: (name: ColumnStateName, value) => void,
    selectNewFile: (sourceName: SourceStateName) => void,
    changeFileType: (value) => void
}

/**
 * Renders a form to select the datasets for Survival Analysis
 * @param props Component's props
 * @returns Component
 */
export const SurvivalForm = (props: SurvivalFormProps) => {
    // Gets Select options without the 'Clinical' one
    const fileTypeOptions = getFileTypeSelectOptions(false).filter((option) => option.key !== 'clinical')
    const optionsArrayIsEmpty = props.columnEventOptions.length === 0

    return (
        <div>
            <Segment>
                <Grid className="padded-left-10 padded-right-10">
                    {/* File type for expression dataset */}
                    <Grid.Row>
                        <Header textAlign="center">
                            <Header.Content>Expression file type</Header.Content>
                        </Header>

                        <Select
                            fluid
                            selectOnBlur={false}
                            value={props.expressionFileType}
                            options={fileTypeOptions}
                            name="fileType"
                            onChange={(_, { value }) => props.changeFileType(value)}
                        />
                    </Grid.Row>

                    {/* Expression profile SourceForm */}
                    <SourceForm
                        source={props.expressionSource}
                        headerTitle='Expression profile'
                        headerIcon={{
                            type: 'icon',
                            src: 'dna'
                        }}
                        fileType={props.expressionFileType}
                        tagOptions={[]}
                        handleChangeSourceType={(selectedSourceType) => {
                            props.handleChangeSourceType(selectedSourceType, 'expressionSource')
                        }}
                        selectNewFile={() => {
                            props.selectNewFile('expressionSource')
                        }}
                        selectUploadedFile={(selectedFile) => {
                            props.selectUploadedFile(selectedFile, 'expressionSource')
                        }}
                        selectStudy={(selectedStudy) => {
                            props.selectStudy(selectedStudy, 'expressionSource')
                        }}
                    />

                    {/* Clinical SourceForm */}
                    <SourceForm
                        source={props.survivalSource}
                        headerTitle='Survival profile'
                        headerIcon={{
                            type: 'icon',
                            src: 'user'
                        }}
                        fileType={FileType.CLINICAL}
                        tagOptions={[]}
                        handleChangeSourceType={(selectedSourceType) => {
                            props.handleChangeSourceType(selectedSourceType, 'survivalSource')
                        }}
                        selectNewFile={() => {
                            props.selectNewFile('survivalSource')
                        }}
                        selectUploadedFile={(selectedFile) => {
                            props.selectUploadedFile(selectedFile, 'survivalSource')
                        }}
                        selectStudy={(selectedStudy) => {
                            props.selectStudy(selectedStudy, 'survivalSource')
                        }}
                    />
                </Grid>
            </Segment>

            {/* Survival columns of interest */ }
            <Segment>
                {/* Event time */}
                <div className='full-width'>
                    <Select
                        button
                        fluid
                        selectOnBlur={false}
                        floating
                        className="margin-bottom-5"
                        disabled={optionsArrayIsEmpty}
                        name='columnEventTime'
                        value={props.columnEventTime}
                        options={props.columnEventOptions}
                        placeholder='Event Time column'
                        onChange={(_e, { name, value }) => props.selectSurvivalColumn(name, value)}
                    />
                </div>

                {/* Event status */}
                <div className='full-width'>
                    <Select
                        button
                        fluid
                        selectOnBlur={false}
                        floating
                        disabled={optionsArrayIsEmpty}
                        name='columnEventStatus'
                        value={props.columnEventStatus}
                        options={props.columnEventOptions}
                        placeholder='Event Status column'
                        onChange={(_e, { name, value }) => props.selectSurvivalColumn(name, value)}
                    />
                </div>
            </Segment>
        </div>
    )
}
