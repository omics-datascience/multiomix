import React from 'react'
import { Input, Segment, Header, Icon, Select } from 'semantic-ui-react'
import { DjangoCGDSDataset, DjangoCGDSStudy } from '../../utils/django_interfaces'
import { NameOfCGDSDataset, CGDSDatasetSeparator, Nullable } from '../../utils/interfaces'
import { checkedValidityCallback } from '../../utils/util_functions'
import { SurvivalTuplesForm } from '../survival/SurvivalTuplesForm'

/** For reusability */
type HandleSurvivalChangesCallback = (datasetName: NameOfCGDSDataset, idx: number, name: string, value: any) => void
type AddSurvivalTuplesCallback = (datasetName: NameOfCGDSDataset) => void
type RemoveSurvivalTupleCallback = (datasetName: NameOfCGDSDataset, idxSurvivalTuple: number) => void

/**
 * Component's props
 */
interface NewCGDSDatasetFormProps {
    newCGDSStudy: DjangoCGDSStudy,
    newCGDSDataset: Nullable<DjangoCGDSDataset>,
    nameToShow: string,
    datasetName: NameOfCGDSDataset,
    addingOrEditingCGDSStudy: boolean,
    showSurvivalTuplesForm: boolean,
    handleFormDatasetChanges: (datasetName: NameOfCGDSDataset, name: string, value: any) => void,
    /** Callback to edit a Survival tuple, only needed when showSurvivalTuplesForm is true */
    handleSurvivalFormDatasetChanges?: HandleSurvivalChangesCallback,
    addSurvivalFormTuple?: AddSurvivalTuplesCallback,
    removeSurvivalFormTuple?: RemoveSurvivalTupleCallback,
    addCGDSDataset: (datasetName: NameOfCGDSDataset) => void,
    removeCGDSDataset: (datasetName: NameOfCGDSDataset) => void
}

/**
 * Renders a form to add a CGDS Dataset to a CGDS Study
 * @param props Component's props
 * @returns Component
 *
 * Generates a MongoDB collection name in the format: "name_description_datasetType_version_versionNumber".
 * Removes unwanted characters, limits the description to three words, and trims extra spaces and underscores.
 */
export const NewCGDSDatasetForm = (props: NewCGDSDatasetFormProps) => {
    const checkedHandleFormChanges = checkedValidityCallback(
        (name, value) => props.handleFormDatasetChanges(props.datasetName, name, value)
    )

    const generateMongoCollectionName = (): string => {
        const name = props.newCGDSStudy.name.split(' ')[0]
            .replace(/[(),]/g, '') || ''
        const description = props.newCGDSStudy.description
            .replace(/[(),]/g, '')
            .trim()
            .replace(/\s+/g, ' ')
            .split(/\s+/)
            .slice(0, 3)
            .join('_') || ''
        const datasetType = props.datasetName || ''
        const version = props.newCGDSStudy.version || 1

        return `${name}_${description}_${datasetType}_version_${version}`.replace(/^_+|_+$/g, '')
    }

    const formContent = (props.newCGDSDataset !== null)
        ? (
            <div>
                {/* File Path */}
                <Input
                    icon='asterisk'
                    fluid
                    name='file_path'
                    className="no-margin-right"
                    value={props.newCGDSDataset.file_path}
                    onChange={checkedHandleFormChanges}
                    loading={props.addingOrEditingCGDSStudy}
                    disabled={props.addingOrEditingCGDSStudy}
                    placeholder='File Path'
                    maxLength={150}
                />

                <Select
                    button
                    fluid
                    selectOnBlur={false}
                    floating
                    name='separator'
                    className="margin-top-2"
                    value={props.newCGDSDataset.separator}
                    options={[
                        { key: 'select_separator', text: 'Separator' },
                        { key: 'comma', text: 'Comma', value: CGDSDatasetSeparator.COMMA },
                        { key: 'semicolon', text: 'Semicolon', value: CGDSDatasetSeparator.SEMICOLON },
                        { key: 'tab', text: 'Tab', value: CGDSDatasetSeparator.TAB },
                        { key: 'colon', text: 'Colon', value: CGDSDatasetSeparator.COLON },
                        { key: 'white_space', text: 'White space', value: CGDSDatasetSeparator.WHITE_SPACE }
                    ]}
                    placeholder='Select separator'
                    onChange={(_, { name, value }) => props.handleFormDatasetChanges(props.datasetName, name, value)}
                />

                {/* Observation */}
                <Input
                    fluid
                    name='observation'
                    className="margin-top-2"
                    value={props.newCGDSDataset.observation}
                    onChange={checkedHandleFormChanges}
                    loading={props.addingOrEditingCGDSStudy}
                    disabled={props.addingOrEditingCGDSStudy}
                    placeholder='Observation'
                    maxLength={300}
                />

                {/* Header Row Index */}
                <Input
                    fluid
                    name='header_row_index'
                    type='number'
                    className="margin-top-2"
                    value={props.newCGDSDataset.header_row_index}
                    onChange={checkedHandleFormChanges}
                    loading={props.addingOrEditingCGDSStudy}
                    disabled={props.addingOrEditingCGDSStudy}
                    placeholder='Header Row Index (0 indexed)'
                    min={0}

                />
                <small style={{ color: 'gray', display: 'block', marginTop: '0px', marginLeft: '2px', fontSize: '12px' }}>
                    Row indexes are 0-indexed
                </small>
                {/* Mongo Collection's name */}
                <Input
                    icon='asterisk'
                    fluid
                    name='mongo_collection_name'
                    className={`margin-top-2 ${props.showSurvivalTuplesForm ? 'margin-bottom-5' : ''}`}
                    value={generateMongoCollectionName()}
                    onChange={checkedHandleFormChanges}
                    loading={props.addingOrEditingCGDSStudy}
                    disabled={props.addingOrEditingCGDSStudy}
                    placeholder="Mongo Collection's name"
                    pattern="^[a-zA-Z]([a-zA-Z0-9]|_)*" // Starts with a letter, the letters, numbers or '_' only
                    maxLength={100}
                />

                {props.showSurvivalTuplesForm &&
                <SurvivalTuplesForm
                    survivalColumns={props.newCGDSDataset.survival_columns ?? []}
                    disabled={props.addingOrEditingCGDSStudy}
                    handleSurvivalFormDatasetChanges={(idx: number, name: string, value) => {
                        const handleSurvivalFormDatasetChanges = props.handleSurvivalFormDatasetChanges as HandleSurvivalChangesCallback
                        handleSurvivalFormDatasetChanges(props.datasetName, idx, name, value)
                    }}
                    addSurvivalFormTuple={() => {
                        const addSurvivalFormTuple = props.addSurvivalFormTuple as AddSurvivalTuplesCallback
                        addSurvivalFormTuple(props.datasetName)
                    }}
                    removeSurvivalFormTuple={(idx) => {
                        const removeSurvivalFormTuple = props.removeSurvivalFormTuple as RemoveSurvivalTupleCallback
                        removeSurvivalFormTuple(props.datasetName, idx)
                    }}
                />
                }
            </div>
        )
        : null

    // Button to remove this CGDS Dataset
    const buttonToAddOrRemove = (props.newCGDSDataset === null)
        ? (
            <Icon
                name='add'
                color='green'
                className='clickable pull-right'
                title='Add dataset'
                disabled={props.addingOrEditingCGDSStudy}
                onClick={() => props.addCGDSDataset(props.datasetName)}
            />
        )
        : (
            <Icon
                name='trash'
                color='red'
                className='clickable pull-right'
                title='Remove dataset'
                disabled={props.addingOrEditingCGDSStudy}
                onClick={() => props.removeCGDSDataset(props.datasetName)}
            />
        )

    return (
        <Segment className="margin-top-5">
            <Header as='h4'>
                {props.nameToShow} Dataset {buttonToAddOrRemove}
            </Header>

            {/* Button to add or form */}
            {formContent}
        </Segment>
    )
}
