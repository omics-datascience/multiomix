import React, { useCallback, useEffect, useRef, useState } from 'react'
import ky from 'ky'
import { Button, Form, Grid, Header, Icon, Modal, Statistic } from 'semantic-ui-react'
import { alertGeneralError, listToDropdownOptions } from '../../../../../utils/util_functions'
import { StatisticalValidationForTable, KaplanMeierResultData, FitnessFunction } from '../../../types'
import { KaplanMeier } from '../../../../pipeline/experiment-result/gene-gem-details/survival-analysis/KaplanMeierUtils'
import { Nullable } from '../../../../../utils/interfaces'
import { InfoPopup } from '../../../../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { ResultPlaceholder } from './ResultPlaceholder'
import { SamplesAndGroupsTable } from './SamplesAndGroupsTable'
import { debounce } from 'lodash'

declare const urlStatisticalValidationKaplanMeierClustering: string
declare const urlStatisticalValidationKaplanMeierByAttr: string
declare const urlStatisticalValidationClinicalAttrs: string

/** StatisticalValidationResultKaplanMeier props. */
interface StatisticalValidationResultKaplanMeierProps {
    /** Selected StatisticalValidationForTable instance to retrieve all its data. */
    selectedStatisticalValidation: StatisticalValidationForTable,
}

/** Available options to get a KaplanMeier survival function. */
type KaplanMeierStrategy = 'clustering' | 'clinical_attribute'

/**
 * Renders a panel with a KaplanMeier chart. Allows to select a clustering model or use a clinical attribute
 * to group the samples and get the survival function.
 * @param props Component's props
 * @returns Component
 */
export const StatisticalValidationResultKaplanMeier = (props: StatisticalValidationResultKaplanMeierProps) => {
    const abortController = useRef(new AbortController())
    const hasClusteringModel = props.selectedStatisticalValidation.fitness_function === FitnessFunction.CLUSTERING
    const [loadingKaplanMeier, setLoadingKaplanMeier] = useState(false)
    const [showSamplesAndClusters, setShowSamplesAndClusters] = useState(false)
    const [kaplanMeierStrategy, setKaplanMeierStrategy] = useState<KaplanMeierStrategy>(hasClusteringModel ? 'clustering' : 'clinical_attribute')
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

            if (hasClusteringModel) {
                getStatValidationKaplanMeierByClusteringModel()
            }
        }

        return () => {
            // Cleanup: cancel the ongoing request when component unmounts
            abortController.current.abort()
        }
    }, [props.selectedStatisticalValidation.id])

    /** Makes the query to get KaplanMeierData with delay. */
    const makeKaplanMeierRequestByAttrs = useCallback(
        debounce((selectedClinicalAttribute: string) => {
            getStatValidationKaplanMeierByAttr(selectedClinicalAttribute)
        }, 1000),
        []
    )

    /**
     * Every time the clinical attribute changes retrieves
     * KaplanMeier data from the backend with debounce
     */
    useEffect(() => {
        if (selectedClinicalAttribute !== undefined) {
            makeKaplanMeierRequestByAttrs(selectedClinicalAttribute)
        }

        return () => {
            // Cleanup: cancel the ongoing request when component unmounts
            abortController.current.abort()
        }
    }, [selectedClinicalAttribute])

    /** Retrieve all the clinical attributes of the selected StatisticalValidation instance. */
    const getStatValidationClinicalAttrs = () => {
        setLoadingClinicalAttributes(true)

        const searchParams = { statistical_validation_pk: props.selectedStatisticalValidation.id }
        ky.get(urlStatisticalValidationClinicalAttrs, { searchParams, timeout: 60000, signal: abortController.current.signal }).then((response) => {
            response.json().then((clinicalAttributes: string[]) => {
                setClinicalAttributes(clinicalAttributes)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            if (!abortController.current.signal.aborted) {
                alertGeneralError()
            }

            console.log('Error getting StatisticalValidation clinical attributes data', err)
        }).finally(() => {
            setLoadingClinicalAttributes(false)
        })
    }

    /** Retrieve all the data of the selected StatisticalValidation instance using the clustering model. */
    const getStatValidationKaplanMeierByClusteringModel = () => {
        setLoadingKaplanMeier(true)
        setKaplanMeierData(null) // Resets some data in the right panel

        const searchParams = { statistical_validation_pk: props.selectedStatisticalValidation.id }
        ky.get(urlStatisticalValidationKaplanMeierClustering, { searchParams, timeout: 60000, signal: abortController.current.signal }).then((response) => {
            response.json().then((statValidation: KaplanMeierResultData) => {
                setKaplanMeierData(statValidation)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            if (!abortController.current.signal.aborted) {
                alertGeneralError()
            }

            console.log('Error getting StatisticalValidation KaplanMeier by clustering model', err)
        }).finally(() => {
            setLoadingKaplanMeier(false)
        })
    }

    /**
     * Retrieve KaplanMeier function of the selected StatisticalValidation instance grouping by clinical attribute.
     * @param clinicalAttribute Selected clinical attribute to group by.
     */
    const getStatValidationKaplanMeierByAttr = (clinicalAttribute: string) => {
        setLoadingKaplanMeier(true)
        setKaplanMeierData(null) // Resets some data in the right panel

        const searchParams = {
            statistical_validation_pk: props.selectedStatisticalValidation.id,
            clinical_attribute: clinicalAttribute
        }
        ky.get(urlStatisticalValidationKaplanMeierByAttr, { searchParams, timeout: 60000, signal: abortController.current.signal }).then((response) => {
            response.json().then((kaplanMeierResult: KaplanMeierResultData) => {
                setKaplanMeierData(kaplanMeierResult)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            if (!abortController.current.signal.aborted) {
                alertGeneralError()
            }

            console.log('Error getting StatisticalValidation KaplanMeier by clinical attribute', err)
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
            return (
                <KaplanMeier
                    data={kaplanMeierData.groups}
                    height={480}
                    width={600}
                    xAxisLabel='Time'
                    yAxisLabel='Probability'
                />
            )
        }

        return null
    }

    const clinicalAttributesOptions = listToDropdownOptions(clinicalAttributes)

    return (
        <Grid>
            <Grid.Row columns={2} divided textAlign='center'>
                <Grid.Column textAlign='center' width={11}>
                    {getKaplanMeierPanel()}
                </Grid.Column>
                <Grid.Column textAlign='center' width={5}>
                    {/* Clustering metrics. */}
                    <InfoPopup
                        content='This metrics are computed using Cox-Regression'
                        onTop
                        onEvent='click'
                        extraClassName='margin-left-5'
                    />

                    <Header as='h2' dividing>Clustering metrics</Header>

                    <Form>
                        {hasClusteringModel &&
                            <Form.Field>
                                <Button.Group
                                    compact
                                    className='biomarkers--side--bar--buttons-group'
                                >
                                    <Button
                                        onClick={() => setKaplanMeierStrategy('clustering')}
                                        active={kaplanMeierStrategy === 'clustering'}
                                    >
                                        Clustering model
                                    </Button>

                                    <Button
                                        onClick={() => setKaplanMeierStrategy('clinical_attribute')}
                                        active={kaplanMeierStrategy === 'clinical_attribute'}
                                    >
                                        Group by clinical
                                    </Button>
                                </Button.Group>
                            </Form.Field>
                        }

                        {/* Clinical attribute select */}
                        {(!hasClusteringModel || kaplanMeierStrategy === 'clinical_attribute') &&
                            <Form.Select
                                fluid
                                selectOnBlur={false}
                                options={clinicalAttributesOptions}
                                loading={loadingClinicalAttributes}
                                search
                                value={selectedClinicalAttribute}
                                onChange={(_, { value }) => { setSelectedClinicalAttribute(value as string) }}
                                placeholder='Clinical attribute to group by'
                                disabled={clinicalAttributesOptions.length === 0}
                            />
                        }
                    </Form>

                    {/* TODO: add InfoPopups for every metric and their interpretation. */}
                    <Statistic className='margin-top-5 margin-bottom-5'>
                        <Statistic.Value>{kaplanMeierData ? kaplanMeierData.concordance_index.toFixed(3) : '-'}</Statistic.Value>
                        <Statistic.Label>C-Index</Statistic.Label>
                    </Statistic>
                    <Statistic>
                        <Statistic.Value>{kaplanMeierData ? kaplanMeierData.log_likelihood.toFixed(3) : '-'}</Statistic.Value>
                        <Statistic.Label>Partial Log-Likelihood</Statistic.Label>
                    </Statistic>

                    {/* Samples and clusters modal. */}
                    {(hasClusteringModel && kaplanMeierStrategy === 'clustering' && kaplanMeierData !== null) &&
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
                    }
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}
