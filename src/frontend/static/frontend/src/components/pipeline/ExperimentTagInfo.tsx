import React from 'react'
import { Card, Label, Icon, Dropdown, DropdownMenuProps } from 'semantic-ui-react'
import { DjangoTag } from '../../utils/django_interfaces'
import { TagForm } from '../common/TagForm'
import { NewExperiment } from '../../utils/interfaces'

/**
 * Component's props
 */
interface ExperimentTagInfoProps {
    /** Experiment to show current Tag's info */
    experiment: NewExperiment,
    /** Flag to display the form */
    isSelectingTag: boolean,
    /** Already existing User's Tags list to select */
    tagOptions: DropdownMenuProps[],
    /** DjangoTag object to add a new tag */
    newTag: DjangoTag,
    /** Flag to show loading icon when create a Tag */
    addingTag: boolean,
    /** Function to show/hide Tag form */
    toggleDisplayTagForm: () => void,
    /** Select an existing Tag */
    selectTagForNewExperiment: (selectedTagId: any) => void,
    /** Handle function to updates the new Tag state in NewExperiment object */
    handleAddTagInputsChange: (name: string, value: any) => void
    /** To submit the new Tag form */
    handleKeyDown: (any) => void
}

/**
 * Renders an Experiment's tag info, with buttons to add, edit or remove it.
 * Displays a form (to add and choose) and a select (to choose).
 * NOTE: is similar to LastExperimentTagInfo component, but it has some differences that
 * it doesn't deserve to generalize that last component
 * @param props Component's props
 * @returns Component
 */
export const ExperimentTagInfo = (props: ExperimentTagInfoProps) => {
    // To enable/disable some functions
    const isTagSelected = props.experiment.tag.id && props.experiment.tag.id

    const dropdownTags = props.isSelectingTag ? (
        <Dropdown
            fluid
            search
            selection
            className="margin-top-2"
            options={props.tagOptions}
            clearable
            onChange={(_e, { value }) => props.selectTagForNewExperiment(value)}
            placeholder='Select an existing Tag'
        />
    ) : null

    const tagForm = props.isSelectingTag ? (
        <TagForm
            tag={props.newTag}
            disableInputs={props.addingTag}
            loading={props.addingTag}
            handleAddTagInputsChange={props.handleAddTagInputsChange}
            handleKeyDown={props.handleKeyDown}
        />
    ) : null

    const buttonRemoveTag = isTagSelected ? (
        <Icon
            className="clickable margin-left-2"
            name='trash'
            color='red'
            title='Remove Tag'
            onClick={() => props.selectTagForNewExperiment(null)}
        />
    ) : null

    return (
        <Card.Meta className="margin-top-10 align-left">
            <Label
                id='label-new-experiment-selected-tag'
                color={isTagSelected ? 'yellow' : 'grey'}
                className="margin-bottom-2 align-center"
                title={isTagSelected ? props.experiment.tag.description : ''}
            >
                {isTagSelected ? props.experiment.tag.name : 'No tag assigned'}
            </Label>

            <Icon
                className="clickable margin-left-2"
                name={props.isSelectingTag ? 'times' : 'pencil'}
                color={props.isSelectingTag ? 'red' : 'yellow'}
                title={props.isSelectingTag ? 'Cancel' : 'Edit'}
                onClick={() => props.toggleDisplayTagForm()}
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
