import React from 'react'
import { Icon } from 'semantic-ui-react'

/**
 * Component's props
 */
interface DeleteExperimentButtonProps {
    /** className property */
    className?: string,
    /** `title` property */
    title?: string,
    /** Whether the button is disabled */
    disabled?: boolean,
    /** Callback to execute on click event */
    onClick: () => void
}

/**
 * Renders a 'Delete' button
 * @param props Component's props
 * @returns Component
 */
export const DeleteExperimentButton = (props: DeleteExperimentButtonProps) => {
    const extraClassName = props.className ?? ''
    return (
        <Icon
            name='trash'
            className={`clickable margin-left-5 ${extraClassName}`}
            color='red'
            disabled={props.disabled}
            title={props.title}
            onClick={props.onClick}
        />
    )
}
