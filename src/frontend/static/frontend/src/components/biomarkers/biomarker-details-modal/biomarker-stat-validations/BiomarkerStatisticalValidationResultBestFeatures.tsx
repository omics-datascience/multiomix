
import React, { useEffect, useState } from 'react'
import { MoleculeWithCoefficient, StatisticalValidationForTable } from '../../types'
import { Nullable } from '../../../../utils/interfaces'
import ky from 'ky'
import { alertGeneralError } from '../../../../utils/util_functions'
import { Card, Placeholder } from 'semantic-ui-react'

declare const urlStatisticalValidationBestFeatures: string

/** BiomarkerStatisticalValidationResultBestFeatures props. */
interface BiomarkerStatisticalValidationResultMetricsProps {
    /** Selected StatisticalValidationForTable instance to retrieve all its data. */
    selectedStatisticalValidation: StatisticalValidationForTable,
}

/**
 * Renders a panel with all the best features with their coefficient for a StatisticalValidation.
 * @param props Component's props
 * @returns Component
 */
export const BiomarkerStatisticalValidationResultMetrics = (props: BiomarkerStatisticalValidationResultMetricsProps) => {
    const [loading, setLoading] = useState(false)
    const [statValidationData, setStatValidationData] = useState<Nullable<MoleculeWithCoefficient[]>>(null)

    /**
     * Every time the StatisticalValidation changes retrieves
     * its data from the backend
     */
    useEffect(() => {
        if (props.selectedStatisticalValidation.id) {
            getStatValidationBestFeatures()
        }
    }, [props.selectedStatisticalValidation.id])

    /** Retrieve all the data of the selected StatisticalValidation instance. */
    const getStatValidationBestFeatures = () => {
        setLoading(true)

        ky.get(urlStatisticalValidationBestFeatures).then((response) => {
            response.json().then((statValidation: MoleculeWithCoefficient[]) => {
                setStatValidationData(statValidation)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            alertGeneralError()
            console.log('Error getting StatisticalValidation best features', err)
        }).finally(() => {
            setLoading(false)
        })
    }

    return (
        <>
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

            {(!loading && statValidationData !== null) &&
                <React.Fragment>
                    <div className='align-center margin-top-5'>
                        {/* TODO: add ApexChart https://apexcharts.com/react-chart-demos/bar-charts/bar-with-negative-values/ */}
                    </div>
                </React.Fragment>
            }
        </>
    )
}
