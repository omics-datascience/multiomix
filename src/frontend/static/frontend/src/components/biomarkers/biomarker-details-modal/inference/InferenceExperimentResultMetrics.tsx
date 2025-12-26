import React from 'react'
import { Header, Segment } from 'semantic-ui-react'
import { InferenceExperimentForTable } from '../../types'
import { ModelDetailsPanel } from '../ModelDetailsPanels'
import { useIntl } from 'react-intl'

// declare const urlInferenceExperimentMetrics: string

/** InferenceExperimentResultMetrics props. */
interface InferenceExperimentResultMetricsProps {
    /** Selected InferenceExperimentForTable instance to retrieve all its data. */
    selectedInferenceExperiment: InferenceExperimentForTable,
}

/**
 * Renders a panel with all the resulting metrics for a InferenceExperiment.
 * @param props Component's props
 * @returns Component
 */
export const InferenceExperimentResultMetrics = (props: InferenceExperimentResultMetricsProps) => {
    const intl = useIntl()
    return (
        <>
            <Header textAlign='center' dividing as='h1'>
                {intl.formatMessage({ id: 'inference.metrics.title' }, { name: props.selectedInferenceExperiment.name })}
            </Header>

            {/* Model details. */}
            <Segment>
                <Header as='h2' dividing>{intl.formatMessage({ id: 'inference.model.details' })}</Header>

                {props.selectedInferenceExperiment.trained_model !== null &&
                    <ModelDetailsPanel trainedModelPk={props.selectedInferenceExperiment.trained_model} />}
            </Segment>
        </>
    )
}
