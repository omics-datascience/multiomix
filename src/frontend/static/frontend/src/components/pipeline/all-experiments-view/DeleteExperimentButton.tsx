import React from 'react'
import { DjangoExperiment } from '../../../utils/django_interfaces'
import { Icon } from 'semantic-ui-react'

/**
 * Component's props
 */
interface DeleteExperimentButtonProps {
    /** Experiment to delete in case of click */
    experiment: DjangoExperiment,
    /** className property */
    className?: string,
    /** Callback to execute on click event */
    onClick: (experiment: DjangoExperiment) => void
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
            title='Delete experiment'
            onClick={() => props.onClick(props.experiment)}
        />
    )
}
