import React from 'react'
import { List } from 'semantic-ui-react'
import { ClusteringAlgorithmLabel } from '../labels/ClusteringAlgorithmLabel'
import { ClusteringScoringMethodLabel } from '../labels/ClusteringScoringMethodLabel'
import { FitnessFunctionLabel } from '../labels/FitnessFunctionLabel'
import { SVMKernelLabel } from '../labels/SVMKernelLabel'
import { SVMKernelTask } from '../labels/SVMKernelTask'
import { FitnessFunction, ClusteringModelDetails, SVMModelDetails, ModelDetails } from '../types'

/**
 * Renders some general items in common for all the models.
 * @param props Component props.
 * @returns Component.
 */
const GeneralMetrics = (props: { data: ModelDetails, fitness_function: FitnessFunction }) => {
    return (
        <>
            <List.Item>
                <List.Icon name='cogs' size='large' verticalAlign='middle' />
                <List.Content>
                    <List.Header>
                        Model:

                        <FitnessFunctionLabel
                            fluid={false}
                            fitnessFunction={props.fitness_function}
                            className='margin-left-2'
                        />
                    </List.Header>
                </List.Content>
            </List.Item>
            <List.Item>
                <List.Icon name='star outline' size='large' verticalAlign='middle' />
                <List.Content>
                    <List.Header>
                        Best fitness value: {props.data.best_fitness.toFixed(4)}
                    </List.Header>
                </List.Content>
            </List.Item>
        </>
    )
}

/**
 * Renders a panel with all the data of a Clustering model.
 * @param props Component props.
 * @returns Component.
 */
const ClusteringModelDetailsPanel = (props: { data: ClusteringModelDetails, fitness_function: FitnessFunction }) => {
    return (
        <List divided relaxed>
            <GeneralMetrics {...props} />

            <List.Item>
                <List.Icon name='lab' size='large' verticalAlign='middle' />
                <List.Content>
                    <List.Header>
                        Algorithm:

                        <ClusteringAlgorithmLabel clusteringAlgorithm={props.data.algorithm} className='margin-left-2' />
                    </List.Header>
                </List.Content>
            </List.Item>
            <List.Item>
                <List.Icon name='lightning' size='large' verticalAlign='middle' />
                <List.Content>
                    <List.Header>
                        Scoring method:

                        <ClusteringScoringMethodLabel scoreMethod={props.data.scoring_method} className='margin-left-2' />
                    </List.Header>
                </List.Content>
            </List.Item>
            <List.Item>
                <List.Icon name='grid layout' size='large' verticalAlign='middle' />
                <List.Content>
                    <List.Header>Number of clusters: {props.data.n_clusters}</List.Header>
                </List.Content>
            </List.Item>
        </List>
    )
}

/**
 * Renders a panel with all the data of a Clustering model.
 * @param props Component props.
 * @returns Component.
 */
const SVMModelDetailsPanel = (props: { data: SVMModelDetails, fitness_function: FitnessFunction }) => {
    return (
        <List divided relaxed>
            <GeneralMetrics {...props} />

            <List.Item>
                <List.Icon name='chart line' size='large' verticalAlign='middle' />
                <List.Content>
                    <List.Header>
                        Kernel:

                        <SVMKernelLabel kernel={props.data.kernel} className='margin-left-2' />
                    </List.Header>
                </List.Content>
            </List.Item>
            <List.Item>
                <List.Icon name='tasks' size='large' verticalAlign='middle' />
                <List.Content>
                    <List.Header>
                        Task:

                        <SVMKernelTask task={props.data.task} className='margin-left-2' />
                    </List.Header>
                </List.Content>
            </List.Item>
        </List>
    )
}

export { ClusteringModelDetailsPanel, SVMModelDetailsPanel }
