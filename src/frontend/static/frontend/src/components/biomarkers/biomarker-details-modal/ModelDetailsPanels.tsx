import React, { useEffect, useRef, useState } from 'react'
import { List, Placeholder, Segment } from 'semantic-ui-react'
import { ClusteringAlgorithmLabel } from '../labels/ClusteringAlgorithmLabel'
import { ClusteringScoringMethodLabel } from '../labels/ClusteringScoringMethodLabel'
import { FitnessFunctionLabel } from '../labels/FitnessFunctionLabel'
import { SVMKernelLabel } from '../labels/SVMKernelLabel'
import { SVMKernelTask } from '../labels/SVMKernelTask'
import { FitnessFunction, ClusteringModelDetails, SVMModelDetails, ModelDetails, RFModelDetails, ClusteringScoringMethod } from '../types'
import { Nullable } from '../../../utils/interfaces'
import ky from 'ky'
import { alertGeneralError } from '../../../utils/util_functions'
import { useIntl } from 'react-intl'
import { InfoPopup } from '../../pipeline/experiment-result/gene-gem-details/InfoPopup'

declare const urlStatisticalValidationModalDetails: string

/** GeneralMetrics props. */
type GeneralMetricsProps = { data: ModelDetails, fitness_function: FitnessFunction }

/**
 * Renders some general items in common for all the models.
 * @param props Component props.
 * @returns Component.
 */
const GeneralMetrics = (props: GeneralMetricsProps) => {
    const intl = useIntl()
    const bestScoreInfoId = props.fitness_function === FitnessFunction.CLUSTERING
        ? (props.data as ClusteringModelDetails).scoring_method === ClusteringScoringMethod.LOG_LIKELIHOOD
            ? 'modelDetails.info.bestLogLikelihood'
            : 'modelDetails.info.bestClusteringCIndex'
        : 'modelDetails.info.bestCIndex'
    return (
        <>
            <List.Item>
                <List.Icon name='cogs' size='large' verticalAlign='middle' />
                <List.Content>
                    <List.Header>
                        {intl.formatMessage({ id: 'common.model' })}
                        <InfoPopup content={intl.formatMessage({ id: 'modelDetails.info.model' })} onTop={false} onEvent='hover' noBorder extraClassName='margin-left-5' />

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
                        {intl.formatMessage({ id: 'modelDetails.general.bestFitnessValue' })} {props.data.best_fitness != null ? props.data.best_fitness.toFixed(4) : '-'}
                        <InfoPopup content={intl.formatMessage({ id: bestScoreInfoId })} onTop={false} onEvent='hover' noBorder extraClassName='margin-left-5' />
                    </List.Header>
                </List.Content>
            </List.Item>
            <List.Item>
                <List.Icon name='random' size='large' verticalAlign='middle' />
                <List.Content>
                    <List.Header>
                        {intl.formatMessage({ id: 'common.randomState' })} {props.data.random_state ?? '-'}
                        <InfoPopup content={intl.formatMessage({ id: 'modelDetails.info.randomState' })} onTop={false} onEvent='hover' noBorder extraClassName='margin-left-5' />
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
    const intl = useIntl()
    return (
        <List divided relaxed>
            <GeneralMetrics {...props} />

            <List.Item>
                <List.Icon name='lab' size='large' verticalAlign='middle' />
                <List.Content>
                    <List.Header>
                        {intl.formatMessage({ id: 'common.algorithm' })}
                        <InfoPopup content={intl.formatMessage({ id: 'modelDetails.info.algorithm' })} onTop={false} onEvent='hover' noBorder extraClassName='margin-left-5' />

                        <ClusteringAlgorithmLabel clusteringAlgorithm={props.data.algorithm} className='margin-left-2' />
                    </List.Header>
                </List.Content>
            </List.Item>
            <List.Item>
                <List.Icon name='lightning' size='large' verticalAlign='middle' />
                <List.Content>
                    <List.Header>
                        {intl.formatMessage({ id: 'common.scoringMethod' })}
                        <InfoPopup content={intl.formatMessage({ id: 'modelDetails.info.scoringMethod' })} onTop={false} onEvent='hover' noBorder extraClassName='margin-left-5' />

                        <ClusteringScoringMethodLabel scoreMethod={props.data.scoring_method} className='margin-left-2' />
                    </List.Header>
                </List.Content>
            </List.Item>
            <List.Item>
                <List.Icon name='grid layout' size='large' verticalAlign='middle' />
                <List.Content>
                    <List.Header>
                        {intl.formatMessage({ id: 'common.nClusters' })} {props.data.n_clusters}
                        <InfoPopup content={intl.formatMessage({ id: 'modelDetails.info.nClusters' })} onTop={false} onEvent='hover' noBorder extraClassName='margin-left-5' />
                    </List.Header>
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
    const intl = useIntl()
    return (
        <List divided relaxed>
            <GeneralMetrics {...props} />

            <List.Item>
                <List.Icon name='microchip' size='large' verticalAlign='middle' />
                <List.Content>
                    <List.Header>
                        Kernel:
                        <InfoPopup content={intl.formatMessage({ id: 'modelDetails.info.kernel' })} onTop={false} onEvent='hover' noBorder extraClassName='margin-left-5' />

                        <SVMKernelLabel kernel={props.data.kernel} className='margin-left-2' />
                    </List.Header>
                </List.Content>
            </List.Item>
            <List.Item>
                <List.Icon name='tasks' size='large' verticalAlign='middle' />
                <List.Content>
                    <List.Header>
                        {intl.formatMessage({ id: 'modelDetails.svm.task' })}
                        <InfoPopup content={intl.formatMessage({ id: 'modelDetails.info.task' })} onTop={false} onEvent='hover' noBorder extraClassName='margin-left-5' />

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
    const intl = useIntl()
    return (
        <List divided relaxed>
            <GeneralMetrics {...props} />

            <List.Item>
                <List.Icon name='tree' size='large' verticalAlign='middle' />
                <List.Content>
                    <List.Header>
                        {intl.formatMessage({ id: 'modelDetails.rf.numberOfEstimators' })} {props.data.n_estimators}
                        <InfoPopup content={intl.formatMessage({ id: 'modelDetails.info.nEstimators' })} onTop={false} onEvent='hover' noBorder extraClassName='margin-left-5' />
                    </List.Header>
                </List.Content>
            </List.Item>
            <List.Item>
                <List.Icon name='angle double down' size='large' verticalAlign='middle' />
                <List.Content>
                    <List.Header>
                        {intl.formatMessage({ id: 'modelDetails.rf.maxDepth' })} {props.data.max_depth ?? '-'}
                        <InfoPopup content={intl.formatMessage({ id: 'modelDetails.info.maxDepth' })} onTop={false} onEvent='hover' noBorder extraClassName='margin-left-5' />
                    </List.Header>
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
            response.json<ModelDetails>().then((modelDetails) => {
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
