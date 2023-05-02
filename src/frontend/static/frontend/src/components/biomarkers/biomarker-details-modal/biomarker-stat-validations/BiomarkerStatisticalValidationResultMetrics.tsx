
import React, { useEffect, useState } from 'react'
import { FitnessFunction, StatisticalValidation, StatisticalValidationForTable } from '../../types'
import { Nullable } from '../../../../utils/interfaces'
import ky from 'ky'
import { alertGeneralError } from '../../../../utils/util_functions'
import { Card, Header, Placeholder, Segment, Statistic } from 'semantic-ui-react'
import { FitnessFunctionLabel } from '../../FitnessFunctionLabel'

declare const urlStatisticalValidationMetrics: string

/** BiomarkerStatisticalValidationResultMetrics props. */
interface BiomarkerStatisticalValidationResultMetricsProps {
    /** Selected StatisticalValidationForTable instance to retrieve all its data. */
    selectedStatisticalValidation: StatisticalValidationForTable,
}

/**
 * Renders a panel with all the resulting metrics for a StatisticalValidation.
 * @param props Component's props
 * @returns Component
 */
export const BiomarkerStatisticalValidationResultMetrics = (props: BiomarkerStatisticalValidationResultMetricsProps) => {
    const [loading, setLoading] = useState(false)
    const [statValidationData, setStatValidationData] = useState<Nullable<StatisticalValidation>>(null)

    /**
     * Every time the StatisticalValidation changes retrieves
     * its data from the backend
     */
    useEffect(() => {
        if (props.selectedStatisticalValidation.id) {
            getStatValidationData()
        }
    }, [props.selectedStatisticalValidation.id])

    /** Retrieve all the data of the selected StatisticalValidation instance. */
    const getStatValidationData = () => {
        // NOTE: clustering cannot compute MSE or C-Index as clinical data has not data about the cluster where samples fall
        if (props.selectedStatisticalValidation.fitness_function === FitnessFunction.CLUSTERING) {
            return
        }

        setLoading(true)

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
            setLoading(false)
        })
    }

    return (
        <>
            {loading &&
                <>
                    <Card className='full-width'>
                        <Placeholder>
                            <Placeholder.Image square />
                        </Placeholder>
                    </Card>

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
                </>
            }

            <Header textAlign='center' dividing as='h1'>
                "{props.selectedStatisticalValidation.name}" metrics

                <FitnessFunctionLabel fluid={false} fitnessFunction={props.selectedStatisticalValidation.fitness_function} />
            </Header>

            {(!loading && statValidationData !== null) &&
                <div className='align-center margin-top-5'>
                    {/* TODO: add information about model parameters */}

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
                </div>
            }
        </>
    )
}
