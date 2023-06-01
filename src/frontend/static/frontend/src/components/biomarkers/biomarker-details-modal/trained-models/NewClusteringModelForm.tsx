import React from 'react'
import { Form, InputOnChangeData } from 'semantic-ui-react'
import { clusteringAlgorithmOptions, clusteringMetricOptions, clusteringScoringMethodOptions } from '../../utils'
import { ClusteringMetric, ClusteringParameters } from '../../types'

interface NewClusteringModelFormProps {
    /** Getter of the selected params to handle in the form. */
    parameters: ClusteringParameters,
    /** Setter of the selected params to handle in the form. */
    handleChangeParams: (event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => void,
    /** Setter of the lookForOptimalNClusters value. */
    handleChangeOptimalNClusters: (checked: boolean) => void
}

export const NewClusteringModelForm = (props: NewClusteringModelFormProps) => {
    // TODO: add an InfoPopup for all the inputs
    return (
        <>
            <Form.Select
                fluid
                selectOnBlur={false}
                label='Algorithm'
                options={clusteringAlgorithmOptions}
                placeholder='Select an algorithm'
                name='algorithm'
                value={props.parameters.algorithm}
                onChange={props.handleChangeParams}
            />

            {/* TODO: add InfoPopup */}
            <Form.Checkbox
                checked={props.parameters.lookForOptimalNClusters}
                onChange={(_e, { checked }) => { props.handleChangeOptimalNClusters(checked ?? false) }}
                label='Search for the optimal number of clusters'
            />

            {!props.parameters.lookForOptimalNClusters &&
                <Form.Input
                    type='number'
                    label='Number of clusters'
                    name='nClusters'
                    min={2}
                    max={10}
                    value={props.parameters.nClusters}
                    onChange={props.handleChangeParams}
                />
            }

            <Form.Select
                fluid
                selectOnBlur={false}
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
                    selectOnBlur={false}
                    label='Scoring method'
                    options={clusteringScoringMethodOptions}
                    placeholder='Select a method'
                    name='scoringMethod'
                    value={props.parameters.scoringMethod}
                    onChange={props.handleChangeParams}
                />
            }

            <Form.Input
                fluid
                label='Random state'
                placeholder='An integer number'
                type='number'
                step={1}
                min={0}
                name='randomState'
                value={props.parameters.randomState}
                onChange={props.handleChangeParams}
            />
        </>
    )
}
