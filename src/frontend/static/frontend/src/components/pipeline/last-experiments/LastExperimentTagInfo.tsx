import React from 'react'
import { Card, Icon, Dropdown, DropdownMenuProps } from 'semantic-ui-react'
import { DjangoExperiment, DjangoTag } from '../../../utils/django_interfaces'
import { Nullable } from '../../../utils/interfaces'
import { TagForm } from '../../common/TagForm'
import { TagLabel } from '../../common/TagLabel'

/**
 * Component's props
 */
interface LastExperimentTagInfoProps {
    experiment: DjangoExperiment,
    experimentWhichIsSelectingTag: Nullable<DjangoExperiment>,
    tagOptions: DropdownMenuProps[],
    newTag: DjangoTag,
    addingTag: boolean,
    selectExperimentToAssignTag: (experiment: DjangoExperiment) => void,
    selectTag: (selectedTagId: any, selectedExperiment: DjangoExperiment) => void,
    onHandleAddTagInputsChange: (name: string, value: any) => void
    onHandleKeyDown: (any) => void
}

/**
 * Renders an Experiment's tag info, with buttons to add, edit or remove it.
 * Displays a form (to add and choose) and a select (to choose).
 * @param props Component's props
 * @returns Component
 */
export const LastExperimentTagInfo = (props: LastExperimentTagInfoProps) => {
    const isEditingTagInfo = props.experimentWhichIsSelectingTag && props.experimentWhichIsSelectingTag.id === props.experiment.id
    const dropdownTags = isEditingTagInfo
        ? (
            <Dropdown
                fluid
                search
                selection
                className='margin-top-2'
                options={props.tagOptions}
                clearable
                onChange={(_e, { value }) => props.selectTag(value, props.experiment)}
                placeholder='Select an existing Tag'
            />
        )
        : null

    const tagForm = isEditingTagInfo
        ? (
            <TagForm
                tag={props.newTag}
                disableInputs={props.addingTag}
                loading={props.addingTag}
                onHandleAddTagInputsChange={props.onHandleAddTagInputsChange}
                onHandleKeyDown={props.onHandleKeyDown}
            />
        )
        : null

    const buttonRemoveTag = props.experiment.tag
        ? (
            <Icon
                className='clickable margin-left-2'
                name='trash'
                color='red'
                title='Remove Tag'
                onClick={() => props.selectTag(null, props.experiment)}
            />
        )
        : null

    return (
        <Card.Meta className='margin-top-2'>
            <TagLabel tag={props.experiment.tag} className='margin-bottom-2' size='tiny' />

            <Icon
                className='clickable margin-left-2'
                name={isEditingTagInfo ? 'times' : 'pencil'}
                color={isEditingTagInfo ? 'red' : 'yellow'}
                title={isEditingTagInfo ? 'Cancel' : 'Edit'}
                onClick={() => props.selectExperimentToAssignTag(props.experiment)}
            />

            {/* Button for remove selected tag */}
            {buttonRemoveTag}

            {/* Form to add a Tag */}
            {tagForm}

            {/* Dropdown for selecting Tag */}
            {dropdownTags}
        </Card.Meta>
    )
}
