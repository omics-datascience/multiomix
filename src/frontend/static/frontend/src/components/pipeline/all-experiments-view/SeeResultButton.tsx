import React from 'react'
import { DjangoExperiment, ExperimentState } from '../../../utils/django_interfaces'
import { Icon } from 'semantic-ui-react'

/**
 * Component's props
 */
interface SeeResultButtonProps {
    /** Experiment get results */
    experiment: DjangoExperiment,
    /** className property */
    className?: string,
    /** Callback to execute on click event */
    seeResult: (experiment: DjangoExperiment) => void
}

/**
 * Renders a 'See result' button
 * @param props Component's props
 * @returns Component
 */
export const SeeResultButton = (props: SeeResultButtonProps) => {
    const extraClassName = props.className ?? ''
    return (
        <Icon
            name='th list'
            className={`clickable ${extraClassName}`}
            color='green'
            title={props.experiment.result_final_row_count ? 'See result' : 'No results to see. Try making the filters less restrictive'}
            onClick={() => props.seeResult(props.experiment)}
            disabled={props.experiment.state !== ExperimentState.COMPLETED || !props.experiment.result_final_row_count}
        />
    )
}
