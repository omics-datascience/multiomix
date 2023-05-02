import React, { useEffect, useState } from 'react'
import ky from 'ky'
import { Card, Grid, Placeholder } from 'semantic-ui-react'
import { alertGeneralError } from '../../../../../utils/util_functions'
import { StatisticalValidationForTable } from '../../../types'
import { KaplanMeier, KaplanMeierData } from '../../../../pipeline/experiment-result/gene-gem-details/survival-analysis/KaplanMeierUtils'

declare const urlStatisticalValidationKaplanMeier: string

/** StatisticalValidationResultKaplanMeier props. */
interface StatisticalValidationResultKaplanMeierProps {
    /** Selected StatisticalValidationForTable instance to retrieve all its data. */
    selectedStatisticalValidation: StatisticalValidationForTable,
}

/**
 * Renders a panel with a HeatMap to visualize all the samples and their expressions for all the molecules of a Biomarker.
 * @param props Component's props
 * @returns Component
 */
export const StatisticalValidationResultKaplanMeier = (props: StatisticalValidationResultKaplanMeierProps) => {
    const [loading, setLoading] = useState(false)
    const [kaplanMeierData, setKaplanMeierData] = useState<KaplanMeierData>(null)

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

        const searchParams = { statistical_validation_pk: props.selectedStatisticalValidation.id }
        ky.get(urlStatisticalValidationKaplanMeier, { searchParams }).then((response) => {
            response.json().then((statValidation: KaplanMeierData) => {
                setKaplanMeierData(statValidation)
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
            {/* TODO: refactor this Placeholder as is the same for HeatMap and BestFeatures */}
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

            {(!loading && kaplanMeierData !== null) &&
                <Grid>
                    <Grid.Row columns={2} divided textAlign='center'>
                        <Grid.Column>
                            <KaplanMeier
                                data={kaplanMeierData}
                                height={480}
                                width={600}
                                xAxisLabel='Time'
                                yAxisLabel='Probability'
                            />
                        </Grid.Column>
                        <Grid.Column>
                            <h1>Metricas</h1>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            }
        </>
    )
}
