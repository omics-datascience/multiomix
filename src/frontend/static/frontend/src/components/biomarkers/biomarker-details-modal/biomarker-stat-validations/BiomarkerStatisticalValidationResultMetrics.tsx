
import React, { useEffect, useState } from 'react'
import { StatisticalValidation, StatisticalValidationForTable } from '../../types'
import { Nullable } from '../../../../utils/interfaces'
import ky from 'ky'
import { alertGeneralError } from '../../../../utils/util_functions'
import { Card, Header, Placeholder } from 'semantic-ui-react'

declare const urlStatisticalValidationData: string

/** BiomarkerNewStatisticalValidationModal props. */
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
        getStatValidationData()
    }, [props.selectedStatisticalValidation.id])

    /** Retrieve all the data of the selected StatisticalValidation instance. */
    const getStatValidationData = () => {
        setLoading(true)
        const url = `${urlStatisticalValidationData}/${props.selectedStatisticalValidation.id}/`
        ky.get(url).then((response) => {
            response.json().then((statValidation: StatisticalValidation) => {
                setStatValidationData(statValidation)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            alertGeneralError()
            console.log('Error getting StatisticalValidation', err)
        }).finally(() => {
            setLoading(false)
        })
    }

    return (
        <div className='selection-main-container'>
            {loading &&
                <Card>
                    <Placeholder>
                        <Placeholder.Image square />
                    </Placeholder>

                    <Card.Content>
                        <Placeholder>
                            <Placeholder.Header>
                                <Placeholder.Line length='very short' />
                                <Placeholder.Line length='medium' />
                            </Placeholder.Header>
                            <Placeholder.Paragraph>
                                <Placeholder.Line length='short' />
                            </Placeholder.Paragraph>
                        </Placeholder>
                    </Card.Content>
                </Card>
            }

            {!loading &&
            <React.Fragment>
                {/* <Header className='stats-header' dividing style={{ color: props.titleColor }}>{props.title}</Header> */}


              {/*   <Statistic size='tiny'>
                    <Statistic.Value>{props.normality.statistic}</Statistic.Value>
                    <Statistic.Label>Shapiro test</Statistic.Label>
                </Statistic>
                <Statistic size='tiny'>
                    <Statistic.Value>{props.normality.p_value}</Statistic.Value>
                    <Statistic.Label>P-Value</Statistic.Label>
                </Statistic> */}
            </React.Fragment>
            }
        </div>
    )
}
