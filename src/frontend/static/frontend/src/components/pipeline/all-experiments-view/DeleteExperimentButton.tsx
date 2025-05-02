import React, { useContext } from 'react'
import { Icon } from 'semantic-ui-react'
import { CurrentUserContext } from '../../Base'
import { Nullable } from '../../../utils/interfaces'

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
    /** Owner  */
    ownerId: Nullable<number>
}

/**
 * Renders a 'Delete' button
 * @param props Component's props
 * @returns Component
 */
export const DeleteExperimentButton = (props: DeleteExperimentButtonProps) => {

    const currentUser = useContext(CurrentUserContext)

    if (props.ownerId !== currentUser?.id && props.ownerId !== null) {
        return <></>
    }

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
