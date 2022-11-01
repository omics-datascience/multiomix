import React from 'react'
import { Label } from 'semantic-ui-react'
import { DjangoTag } from '../../utils/django_interfaces'
import { SemanticSIZES } from 'semantic-ui-react/dist/commonjs/generic'
import { Nullable } from '../../utils/interfaces'

/**
 * Component's props
 */
interface TagLabelProps {
    tag: Nullable<DjangoTag>,
    id?: string,
    className?: string,
    fluid?: boolean,
    size?: SemanticSIZES
}

/**
 * Renders a Label with Tag information
 * @param props Component's props
 * @returns Component
 */
export const TagLabel = (props: TagLabelProps) => (
    <Label
        id={props.id}
        color={props.tag ? 'yellow' : 'grey'}
        className={`${props.fluid ? 'fluid' : ''} ${props.className}`}
        title={props.tag ? props.tag.description : ''}
        size={props.size}
    >
        {props.tag ? props.tag.name : 'No tag assigned'}
    </Label>
)
