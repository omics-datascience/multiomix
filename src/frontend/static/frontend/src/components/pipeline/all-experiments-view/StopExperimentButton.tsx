import React from 'react'
import { Icon } from 'semantic-ui-react'

/**
 * Component's props
 */
interface StopExperimentButtonProps {
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
 * Renders a 'Stop' button
 * @param props Component's props
 * @returns Component
 */
export const StopExperimentButton = (props: StopExperimentButtonProps) => {
    const extraClassName = props.className ?? ''
    return (
        <Icon
            name='stop'
            className={`clickable margin-left-5 ${extraClassName}`}
            color='red'
            disabled={props.disabled}
            title={props.title}
            onClick={props.onClick}
        />
    )
}
