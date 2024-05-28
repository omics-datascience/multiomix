import React, { useEffect, useRef, useState } from 'react'
import { List, Placeholder, Segment } from 'semantic-ui-react'
import { ClusteringAlgorithmLabel } from '../labels/ClusteringAlgorithmLabel'
import { ClusteringScoringMethodLabel } from '../labels/ClusteringScoringMethodLabel'
import { FitnessFunctionLabel } from '../labels/FitnessFunctionLabel'
import { SVMKernelLabel } from '../labels/SVMKernelLabel'
import { SVMKernelTask } from '../labels/SVMKernelTask'
import { FitnessFunction, ClusteringModelDetails, SVMModelDetails, ModelDetails, RFModelDetails } from '../types'
import { Nullable } from '../../../utils/interfaces'
import ky from 'ky'
import { alertGeneralError } from '../../../utils/util_functions'

declare const urlStatisticalValidationModalDetails: string

/** GeneralMetrics props. */
type GeneralMetricsProps = { data: ModelDetails, fitness_function: FitnessFunction }

/**
 * Renders some general items in common for all the models.
 * @param props Component props.
 * @returns Component.
 */
const GeneralMetrics = (props: GeneralMetricsProps) => {
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
            <List.Item>
                <List.Icon name='random' size='large' verticalAlign='middle' />
                <List.Content>
                    <List.Header>
                        Random state: {props.data.random_state ?? '-'}
                    </List.Header>
                </List.Content>
            </List.Item>
        </>
    )
}

/** ClusteringModelDetailsPanel props. */
type ClusteringModelDetailsPanelProps = { data: ClusteringModelDetails, fitness_function: FitnessFunction }

/**
 * Renders a panel with all the data of a Clustering model.
 * @param props Component props.
 * @returns Component.
 */
const ClusteringModelDetailsPanel = (props: ClusteringModelDetailsPanelProps) => {
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

/** SVMModelDetailsPanel props. */
type SVMModelDetailsPanelProps = { data: SVMModelDetails, fitness_function: FitnessFunction }

/**
 * Renders a panel with all the data of a SVM model.
 * @param props Component props.
 * @returns Component.
 */
const SVMModelDetailsPanel = (props: SVMModelDetailsPanelProps) => {
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

/** RFModelDetailsPanel props. */
type RFModelDetailsPanelProps = { data: RFModelDetails, fitness_function: FitnessFunction }

/**
 * Renders a panel with all the data of a Random Forest model.
 * @param props Component props.
 * @returns Component.
 */
const RFModelDetailsPanel = (props: RFModelDetailsPanelProps) => {
    return (
        <List divided relaxed>
            <GeneralMetrics {...props} />

            <List.Item>
                <List.Icon name='tree' size='large' verticalAlign='middle' />
                <List.Content>
                    <List.Header>Number of estimators: {props.data.n_estimators}</List.Header>
                </List.Content>
            </List.Item>
            <List.Item>
                <List.Icon name='angle double down' size='large' verticalAlign='middle' />
                <List.Content>
                    <List.Header>Max. depth: {props.data.max_depth ?? '-'}</List.Header>
                </List.Content>
            </List.Item>
        </List>
    )
}

/** ModelDetailsPanel props. */
interface ModelDetailsModelDetailsPanelProps {
    /** Selected TrainedModel's pk */
    trainedModelPk: number,
}

/**
 * Renders a panel with all the data of a Trained model.
 * @param props Component props.
 * @returns Component.
 */
export const ModelDetailsPanel = (props: ModelDetailsModelDetailsPanelProps) => {
    const abortController = useRef(new AbortController())
    const [modelDetails, setModelDetails] = useState<Nullable<ModelDetails>>(null)
    const [loadingModelDetails, setLoadingModelDetails] = useState(false)

    useEffect(() => {
        getModelDetails()

        return () => {
            // Cleanup: cancel the ongoing request when component unmounts
            abortController.current.abort()
        }
    }, [props.trainedModelPk])

    /** Retrieve all the details of the selected StatisticalValidation's Trained model. */
    const getModelDetails = () => {
        setLoadingModelDetails(true)

        const searchParams = { trained_model_pk: props.trainedModelPk }
        ky.get(urlStatisticalValidationModalDetails, { searchParams, signal: abortController.current.signal }).then((response) => {
            response.json().then((modelDetails: ModelDetails) => {
                setModelDetails(modelDetails)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            if (!abortController.current.signal.aborted) {
                alertGeneralError()
            }

            console.log('Error getting model details data', err)
        }).finally(() => {
            setLoadingModelDetails(false)
        })
    }

    /**
     * Gets the corresponding component to show models details.
     * @returns Corresponding component.
     */
    const getModelDetailsPanel = (): Nullable<JSX.Element> => {
        if (loadingModelDetails) {
            return (
                <Segment>
                    <Placeholder className='full-width'>
                        <Placeholder.Header image>
                            <Placeholder.Line />
                            <Placeholder.Line />
                        </Placeholder.Header>
                        <Placeholder.Paragraph>
                            <Placeholder.Line length='medium' />
                            <Placeholder.Line length='short' />
                        </Placeholder.Paragraph>
                    </Placeholder>
                </Segment>
            )
        }

        if (modelDetails === null) {
            return null
        }

        const { model } = modelDetails

        switch (model) {
            case FitnessFunction.CLUSTERING:
                return (
                    <ClusteringModelDetailsPanel
                        data={modelDetails as ClusteringModelDetails}
                        fitness_function={model}
                    />
                )
            case FitnessFunction.SVM:
                return (
                    <SVMModelDetailsPanel
                        data={modelDetails as SVMModelDetails}
                        fitness_function={model}
                    />
                )
            case FitnessFunction.RF:
                return (
                    <RFModelDetailsPanel
                        data={modelDetails as RFModelDetails}
                        fitness_function={model}
                    />
                )
        }
    }

    return getModelDetailsPanel()
}
