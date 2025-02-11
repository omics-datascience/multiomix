import React, { useContext } from 'react'
import { Icon } from 'semantic-ui-react'
import { CurrentUserContext } from '../../Base'

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
    onClick: () => void,
    /** Owner id to check security */
    ownerId?: number,
}

/**
 * Renders a 'Stop' button
 * @param props Component's props
 * @returns Component
 */
export const StopExperimentButton = (props: StopExperimentButtonProps) => {
    const extraClassName = props.className ?? ''
    const currentUser = useContext(CurrentUserContext)

    if (props.ownerId !== undefined && currentUser?.id !== props.ownerId) {
        return <></>
    }

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
