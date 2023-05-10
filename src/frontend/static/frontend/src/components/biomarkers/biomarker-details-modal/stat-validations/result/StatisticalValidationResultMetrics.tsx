
import React, { useEffect, useState } from 'react'
import { ClusteringModelDetails, SVMModelDetails, FitnessFunction, StatisticalValidation, StatisticalValidationForTable, ModelDetails, RFModelDetails } from '../../../types'
import { Nullable } from '../../../../../utils/interfaces'
import ky from 'ky'
import { alertGeneralError } from '../../../../../utils/util_functions'
import { Header, Placeholder, Segment, Statistic } from 'semantic-ui-react'
import { ClusteringModelDetailsPanel, RFModelDetailsPanel, SVMModelDetailsPanel } from '../../ModelDetailsPanels'

declare const urlStatisticalValidationMetrics: string
declare const urlStatisticalValidationModalDetails: string

/** StatisticalValidationResultMetrics props. */
interface StatisticalValidationResultMetricsProps {
    /** Selected StatisticalValidationForTable instance to retrieve all its data. */
    selectedStatisticalValidation: StatisticalValidationForTable,
}

/**
 * Renders a panel with all the resulting metrics for a StatisticalValidation.
 * @param props Component's props
 * @returns Component
 */
export const StatisticalValidationResultMetrics = (props: StatisticalValidationResultMetricsProps) => {
    const [loadingMetrics, setLoadingMetrics] = useState(false)
    const [statValidationData, setStatValidationData] = useState<Nullable<StatisticalValidation>>(null)
    const [loadingModelDetails, setLoadingModelDetails] = useState(false)
    const [modelDetails, setModelDetails] = useState<Nullable<ModelDetails>>(null)

    const isClustering = props.selectedStatisticalValidation.fitness_function === FitnessFunction.CLUSTERING

    /**
     * Every time the StatisticalValidation changes retrieves
     * its data from the backend
     */
    useEffect(() => {
        if (props.selectedStatisticalValidation.id) {
            getStatValidationData()
            getModelDetails()
        }
    }, [props.selectedStatisticalValidation.id])

    /** Retrieve all the data of the selected StatisticalValidation instance. */
    const getStatValidationData = () => {
        // NOTE: clustering cannot compute MSE or C-Index as clinical data has not data about the cluster where samples fall
        if (isClustering) {
            return
        }

        setLoadingMetrics(true)

        const url = `${urlStatisticalValidationMetrics}/${props.selectedStatisticalValidation.id}/`
        ky.get(url).then((response) => {
            response.json().then((statValidation: StatisticalValidation) => {
                setStatValidationData(statValidation)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            alertGeneralError()
            console.log('Error getting StatisticalValidation data', err)
        }).finally(() => {
            setLoadingMetrics(false)
        })
    }

    /** Retrieve all the details of the selected StatisticalValidation's Trained model. */
    const getModelDetails = () => {
        setLoadingModelDetails(true)

        const searchParams = { statistical_validation_pk: props.selectedStatisticalValidation.id }
        ky.get(urlStatisticalValidationModalDetails, { searchParams }).then((response) => {
            response.json().then((modelDetails: ModelDetails) => {
                setModelDetails(modelDetails)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            alertGeneralError()
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

        switch (props.selectedStatisticalValidation.fitness_function) {
            case FitnessFunction.CLUSTERING:
                return <ClusteringModelDetailsPanel
                    data={modelDetails as ClusteringModelDetails}
                    fitness_function={props.selectedStatisticalValidation.fitness_function}
                />
            case FitnessFunction.SVM:
                return <SVMModelDetailsPanel
                    data={modelDetails as SVMModelDetails}
                    fitness_function={props.selectedStatisticalValidation.fitness_function}
                />
            case FitnessFunction.RF:
                return <RFModelDetailsPanel
                    data={modelDetails as RFModelDetails}
                    fitness_function={props.selectedStatisticalValidation.fitness_function}
                />
        }
    }

    return (
        <>
            <Header textAlign='center' dividing as='h1'>
                "{props.selectedStatisticalValidation.name}" metrics
            </Header>

            {/* Model details. */}
            <Segment>
                <Header as='h2' dividing>Model details</Header>

                {getModelDetailsPanel()}
            </Segment>

            {/* Result metrics data. */}
            {!isClustering &&
                <Segment className='align-center margin-top-5'>
                    {loadingMetrics &&
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
                    }

                    {(!loadingMetrics && statValidationData !== null) &&
                        <>
                            <Header as='h2' dividing textAlign='left'>Validation metrics</Header>

                            <Statistic size='tiny'>
                                <Statistic.Value>{statValidationData.mean_squared_error ? statValidationData.mean_squared_error.toFixed(3) : '-'}</Statistic.Value>
                                <Statistic.Label>MSE</Statistic.Label>
                            </Statistic>
                            <Statistic size='tiny'>
                                <Statistic.Value>{statValidationData.c_index ? statValidationData.c_index.toFixed(3) : '-'}</Statistic.Value>
                                <Statistic.Label>C-Index</Statistic.Label>
                            </Statistic>
                            <Statistic size='tiny'>
                                <Statistic.Value>{statValidationData.r2_score ? statValidationData.r2_score.toFixed(3) : '-'}</Statistic.Value>
                                <Statistic.Label>R2 score</Statistic.Label>
                            </Statistic>
                        </>
                    }
                </Segment>
            }
        </>
    )
}
