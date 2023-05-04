import React, { useCallback, useEffect, useState } from 'react'
import ky from 'ky'
import { Button, DropdownItemProps, Form, Grid, Header, Icon, Modal, Statistic } from 'semantic-ui-react'
import { alertGeneralError } from '../../../../../utils/util_functions'
import { StatisticalValidationForTable, KaplanMeierResultData } from '../../../types'
import { KaplanMeier } from '../../../../pipeline/experiment-result/gene-gem-details/survival-analysis/KaplanMeierUtils'
import { Nullable } from '../../../../../utils/interfaces'
import { InfoPopup } from '../../../../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { ResultPlaceholder } from './ResultPlaceholder'
import { debounce } from 'lodash'

declare const urlStatisticalValidationKaplanMeierRegression: string
declare const urlStatisticalValidationClinicalAttrs: string

/** StatisticalValidationResultKaplanMeierRegression props. */
interface StatisticalValidationResultKaplanMeierRegressionProps {
    /** Selected StatisticalValidationForTable instance to retrieve all its data. */
    selectedStatisticalValidation: StatisticalValidationForTable,
}

/**
 * Renders a panel with a HeatMap to visualize all the samples and their expressions for all the molecules of a Biomarker.
 * This panel only is used when the trained model is for a regression task (i.e. not clustering).
 * @param props Component's props
 * @returns Component
 */
export const StatisticalValidationResultKaplanMeierRegression = (props: StatisticalValidationResultKaplanMeierRegressionProps) => {
    const [showSamplesAndClusters, setShowSamplesAndClusters] = useState(false)

    // Data
    const [loadingKaplanMeier, setLoadingKaplanMeier] = useState(false)
    const [kaplanMeierData, setKaplanMeierData] = useState<Nullable<KaplanMeierResultData>>(null)
    const [loadingClinicalAttributes, setLoadingClinicalAttributes] = useState(false)
    const [clinicalAttributes, setClinicalAttributes] = useState<string[]>([])
    const [selectedClinicalAttribute, setSelectedClinicalAttribute] = useState<string | undefined>(undefined)

    /**
     * Every time the StatisticalValidation changes retrieves
     * its data from the backend
     */
    useEffect(() => {
        if (props.selectedStatisticalValidation.id) {
            getStatValidationClinicalAttrs()
        }
    }, [props.selectedStatisticalValidation.id])

    /** Makes the query to get KaplanMeierData with delay. */
    const makeKaplanMeierRequest = useCallback(
        debounce((selectedClinicalAttribute: string) => {
            getStatValidationKaplanMeier(selectedClinicalAttribute)
        }, 1000),
        []
    )

    /**
     * Every time the StatisticalValidation changes retrieves
     * its data from the backend
     */
    useEffect(() => {
        if (selectedClinicalAttribute !== undefined) {
            makeKaplanMeierRequest(selectedClinicalAttribute)
        }
    }, [selectedClinicalAttribute])

    /** Retrieve all the clinical attributes of the selected StatisticalValidation instance. */
    const getStatValidationClinicalAttrs = () => {
        setLoadingClinicalAttributes(true)

        const searchParams = { statistical_validation_pk: props.selectedStatisticalValidation.id }
        ky.get(urlStatisticalValidationClinicalAttrs, { searchParams }).then((response) => {
            response.json().then((clinicalAttributes: string[]) => {
                setClinicalAttributes(clinicalAttributes)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            alertGeneralError()
            console.log('Error getting StatisticalValidation KaplanMeier data', err)
        }).finally(() => {
            setLoadingClinicalAttributes(false)
        })
    }

    /**
     * Retrieve KaplanMeier function of the selected StatisticalValidation instance.
     * @param clinicalAttribute Selected clinical attribute to group by.
     */
    const getStatValidationKaplanMeier = (clinicalAttribute: string) => {
        setLoadingKaplanMeier(true)

        const searchParams = {
            statistical_validation_pk: props.selectedStatisticalValidation.id,
            clinical_attribute: clinicalAttribute
        }
        ky.get(urlStatisticalValidationKaplanMeierRegression, { searchParams }).then((response) => {
            response.json().then((kaplanMeierResult: KaplanMeierResultData) => {
                setKaplanMeierData(kaplanMeierResult)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            alertGeneralError()
            console.log('Error getting StatisticalValidation KaplanMeier data', err)
        }).finally(() => {
            setLoadingKaplanMeier(false)
        })
    }

    /**
     * Gets the corresponding panel to show in the KaplanMeier Grid.Column.
     * @returns Component.
     */
    const getKaplanMeierPanel = (): Nullable<JSX.Element> => {
        if (loadingKaplanMeier) {
            return <ResultPlaceholder numberOfCards={1} fluid rectangular />
        }

        if (kaplanMeierData !== null) {
            return <KaplanMeier
                data={kaplanMeierData.groups}
                height={480}
                width={600}
                xAxisLabel='Time'
                yAxisLabel='Probability'
            />
        }

        return null
    }

    const clinicalAttributesOptions: DropdownItemProps[] = clinicalAttributes.map((elem) => ({ key: elem, value: elem, text: elem }))

    return (
        <Grid>
            <Grid.Row columns={2} divided textAlign='center'>
                <Grid.Column textAlign='center'>
                    {getKaplanMeierPanel()}
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

                    <Form.Select
                        fluid
                        options={clinicalAttributesOptions}
                        loading={loadingClinicalAttributes}
                        value={selectedClinicalAttribute}
                        onChange={(_, { value }) => { setSelectedClinicalAttribute(value as string) }}
                        placeholder='Clinical attribute to group by'
                        disabled={clinicalAttributesOptions.length === 0}
                    />

                    {/* TODO: add InfoPopups for every metric and their interpretation. */}
                    <Statistic>
                        <Statistic.Value>{kaplanMeierData ? kaplanMeierData.concordance_index.toFixed(3) : '-'}</Statistic.Value>
                        <Statistic.Label>C-Index</Statistic.Label>
                    </Statistic>
                    <Statistic>
                        <Statistic.Value>{kaplanMeierData ? kaplanMeierData.log_likelihood.toFixed(3) : '-'}</Statistic.Value>
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
                        <Modal.Header>Samples and clusters</Modal.Header>
                        <Modal.Content>
                            {/* TODO: implement */}
                            {/* <SamplesAndGroupsTable selectedStatisticalValidation={props.selectedStatisticalValidation} /> */}
                        </Modal.Content>
                        <Modal.Actions>
                            <Button onClick={() => setShowSamplesAndClusters(false)}>Close</Button>
                        </Modal.Actions>
                    </Modal>
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}
