import React from 'react'
import { Form, InputOnChangeData } from 'semantic-ui-react'
import { clusteringAlgorithmOptions, clusteringMetricOptions, clusteringScoringMethodOptions } from '../../utils'
import { ClusteringMetric, ClusteringParameters } from '../../types'

interface NewClusteringModelFormProps {
    /** Getter of the selected params to handle in the form. */
    parameters: ClusteringParameters,
    /** Setter of the selected params to handle in the form. */
    handleChangeParams: (event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => void
}

export const NewClusteringModelForm = (props: NewClusteringModelFormProps) => {
    // TODO: add an InfoPopup for all the inputs
    return (
        <>
            <Form.Select
                fluid
                label='Algorithm'
                options={clusteringAlgorithmOptions}
                placeholder='Select an algorithm'
                name='algorithm'
                value={props.parameters.algorithm}
                onChange={props.handleChangeParams}
            />

            <Form.Select
                fluid
                label='Metric'
                options={clusteringMetricOptions}
                placeholder='Select a metric'
                name='metric'
                value={props.parameters.metric}
                onChange={props.handleChangeParams}
            />

            {/* Scoring method */}
            {props.parameters.metric === ClusteringMetric.COX_REGRESSION &&
                <Form.Select
                    fluid
                    label='Scoring method'
                    options={clusteringScoringMethodOptions}
                    placeholder='Select a method'
                    name='scoringMethod'
                    value={props.parameters.scoringMethod}
                    onChange={props.handleChangeParams}
                />
            }
        </>
    )
}
