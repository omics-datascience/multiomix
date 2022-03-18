import React from 'react'
import { DjangoExperiment } from '../../../utils/django_interfaces'
import { Icon } from 'semantic-ui-react'

/**
 * Component's props
 */
interface StopExperimentButtonProps {
    /** Experiment to stop in case of click */
    experiment: DjangoExperiment,
    /** className property */
    className?: string,
    /** Callback to execute on click event */
    onClick: (experiment: DjangoExperiment) => void
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
            title='Stop experiment'
            onClick={() => props.onClick(props.experiment)}
        />
    )
}
