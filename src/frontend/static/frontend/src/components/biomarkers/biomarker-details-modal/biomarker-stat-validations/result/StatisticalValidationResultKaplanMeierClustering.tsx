import React, { useEffect, useState } from 'react'
import ky from 'ky'
import { Button, Grid, Header, Icon, Modal, Statistic } from 'semantic-ui-react'
import { alertGeneralError } from '../../../../../utils/util_functions'
import { StatisticalValidationForTable, KaplanMeierResultData } from '../../../types'
import { KaplanMeier } from '../../../../pipeline/experiment-result/gene-gem-details/survival-analysis/KaplanMeierUtils'
import { Nullable } from '../../../../../utils/interfaces'
import { InfoPopup } from '../../../../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { ResultPlaceholder } from './ResultPlaceholder'
import { SamplesAndGroupsTable } from './SamplesAndGroupsTable'

declare const urlStatisticalValidationKaplanMeierClustering: string

/** StatisticalValidationResultKaplanMeierClustering props. */
interface StatisticalValidationResultKaplanMeierClusteringProps {
    /** Selected StatisticalValidationForTable instance to retrieve all its data. */
    selectedStatisticalValidation: StatisticalValidationForTable,
}

/**
 * Renders a panel with a HeatMap to visualize all the samples and their expressions for all the molecules of a Biomarker.
 * This panel only is used when the trained model is for a clustering task (i.e. not regression).
 * @param props Component's props
 * @returns Component
 */
export const StatisticalValidationResultKaplanMeierClustering = (props: StatisticalValidationResultKaplanMeierClusteringProps) => {
    const [loading, setLoading] = useState(false)
    const [showSamplesAndClusters, setShowSamplesAndClusters] = useState(false)
    const [kaplanMeierData, setKaplanMeierData] = useState<Nullable<KaplanMeierResultData>>(null)

    /**
     * Every time the StatisticalValidation changes retrieves
     * its data from the backend
     */
    useEffect(() => {
        if (props.selectedStatisticalValidation.id) {
            getStatValidationKaplanMeier()
        }
    }, [props.selectedStatisticalValidation.id])

    /** Retrieve all the data of the selected StatisticalValidation instance. */
    const getStatValidationKaplanMeier = () => {
        setLoading(true)

        const searchParams = { statistical_validation_pk: props.selectedStatisticalValidation.id }
        ky.get(urlStatisticalValidationKaplanMeierClustering, { searchParams }).then((response) => {
            response.json().then((statValidation: KaplanMeierResultData) => {
                setKaplanMeierData(statValidation)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            alertGeneralError()
            console.log('Error getting StatisticalValidation KaplanMeier data', err)
        }).finally(() => {
            setLoading(false)
        })
    }

    return (
        <>
            {loading &&
                <ResultPlaceholder />
            }

            {(!loading && kaplanMeierData !== null) &&
                <Grid>
                    <Grid.Row columns={2} divided textAlign='center'>
                        <Grid.Column>
                            <KaplanMeier
                                data={kaplanMeierData.groups}
                                height={480}
                                width={600}
                                xAxisLabel='Time'
                                yAxisLabel='Probability'
                            />
                        </Grid.Column>
                        <Grid.Column textAlign='center'>
                            {/* Clustering metrics. */}
                            <InfoPopup
                                content='This metrics are computed using Cox-Regression'
                                onTop
                                onEvent='click'
                                extraClassName='margin-left-5'
                            />

                            <Header as='h2' dividing>Clustering metrics</Header>

                            {/* TODO: add InfoPopups for every metric and their interpretation. */}
                            <Statistic>
                                <Statistic.Value>{kaplanMeierData.concordance_index.toFixed(3)}</Statistic.Value>
                                <Statistic.Label>C-Index</Statistic.Label>
                            </Statistic>
                            <Statistic>
                                <Statistic.Value>{kaplanMeierData.log_likelihood.toFixed(3)}</Statistic.Value>
                                <Statistic.Label>Partial Log-Likelihood</Statistic.Label>
                            </Statistic>

                            {/* Samples and clusters modal. */}
                            <Modal
                                onClose={() => setShowSamplesAndClusters(false)}
                                onOpen={() => setShowSamplesAndClusters(true)}
                                closeIcon={<Icon name='close' size='large' />}
                                open={showSamplesAndClusters}
                                trigger={<Button primary fluid>See samples and clusters</Button>}
                            >
                                <Modal.Header>
                                    <Icon name='users' />
                                    Samples and clusters
                                </Modal.Header>
                                <Modal.Content>
                                    <SamplesAndGroupsTable selectedStatisticalValidation={props.selectedStatisticalValidation} />
                                </Modal.Content>
                                <Modal.Actions>
                                    <Button onClick={() => setShowSamplesAndClusters(false)}>Close</Button>
                                </Modal.Actions>
                            </Modal>
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            }
        </>
    )
}
