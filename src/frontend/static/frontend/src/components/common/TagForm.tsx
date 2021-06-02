import React from 'react'
import { Input } from 'semantic-ui-react'
import { DjangoTag } from '../../utils/django_interfaces'
import { checkedValidityCallback } from '../../utils/util_functions'

/**
 * Component's props
 */
interface TagFormProps {
    tag: DjangoTag,
    disableInputs: boolean,
    loading: boolean,
    handleKeyDown: (any) => void,
    handleAddTagInputsChange: (name: string, value: any) => void
}

/**
 * Render a Form to add/edit a Tag (model: api_service.models.Tag)
 * @param props Component's props
 * @returns Component
 */
export const TagForm = (props: TagFormProps) => {
    const checkedHandleFormChanges = checkedValidityCallback(props.handleAddTagInputsChange)

    return (
        <div>
            <Input
                icon={props.tag.id ? 'pencil' : 'add'}
                fluid
                name='name'
                className="no-margin-right"
                value={props.tag.name}
                onChange={checkedHandleFormChanges}
                onKeyDown={props.handleKeyDown}
                loading={props.loading}
                disabled={props.disableInputs}
                placeholder='New tag'
                maxLength={20}
            />

            <Input
                fluid
                className="margin-top-2"
                name='description'
                value={props.tag.description}
                onChange={checkedHandleFormChanges}
                onKeyDown={props.handleKeyDown}
                disabled={props.disableInputs}
                placeholder='Description (optional)'
                maxLength={60}
            />
        </div>
    )
}
