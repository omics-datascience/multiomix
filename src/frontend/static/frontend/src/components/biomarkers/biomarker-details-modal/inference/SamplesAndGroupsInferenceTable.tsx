import React, { useMemo, useState } from 'react'
import { Button, Form, Grid, Icon, Table } from 'semantic-ui-react'
import { InferenceExperimentForTable, SampleAndCluster } from '../../types'
import { PaginatedTable } from '../../../common/PaginatedTable'
import { TableCellWithTitle } from '../../../common/TableCellWithTitle'
import { ClusterLabelsSetSelect } from '../../../common/cluster-labels/ClusterLabelsSetSelect'
import { NewClusterLabelsSetModal } from '../../../common/cluster-labels/NewClusterLabelsSetModal'
import { useIntl } from 'react-intl'

declare const urlInferenceExperimentSamplesAndClusters: string
declare const urlInferenceExperimentSamplesAndClustersDownload: string
declare const urlClustersUniqueInferenceExperiment: string

/** SamplesAndGroupsInferenceTable props. */
interface SamplesAndGroupsInferenceTableProps {
    /** Selected InferenceExperimentForTable instance to retrieve all its data. */
    selectedInferenceExperiment: InferenceExperimentForTable,
}

/**
 * Renders a Table with the samples and the cluster where they belong.
 * @param props Component props.
 * @returns Component.
 */
export const SamplesAndGroupsInferenceTable = (props: SamplesAndGroupsInferenceTableProps) => {
    const intl = useIntl()
    const [selectedClusterSetPk, setSelectedClusterSetPk] = useState<number | undefined>(undefined)
    const [openClusterLabelsSetModal, setOpenClusterLabelsSetModal] = useState(false)

    const extraQueryParams = selectedClusterSetPk ? { cluster_labels_set_pk: selectedClusterSetPk } : {}

    const selectedTrainedModelPk = props.selectedInferenceExperiment.trained_model

    // Adds inference_experiment_pk and cluster_labels_set_pk as query params
    const downloadUrl = useMemo(() => {
        const searchParams = new URLSearchParams()
        searchParams.append('inference_experiment_pk', props.selectedInferenceExperiment.id.toString())

        if (selectedClusterSetPk) {
            searchParams.append('cluster_labels_set_pk', selectedClusterSetPk.toString())
        }

        return `${urlInferenceExperimentSamplesAndClustersDownload}?${searchParams.toString()}`
    }, [props.selectedInferenceExperiment.id, selectedClusterSetPk])

    return (
        <Grid>
            <Grid.Row columns={2} divided>
                <Grid.Column width={12}>
                    <PaginatedTable<SampleAndCluster>
                        headers={[
                            { name: intl.formatMessage({ id: 'inference.table.columns.sample' }), serverCodeToSort: 'sample', width: 3, textAlign: 'center' },
                            { name: intl.formatMessage({ id: 'inference.table.columns.cluster' }), serverCodeToSort: 'cluster', width: 2, textAlign: 'center' }

                        ]}
                        queryParams={{
                            inference_experiment_pk: props.selectedInferenceExperiment.id,
                            ...extraQueryParams
                        }}
                        customElements={[
                            <Form.Field key='download-csv-button' className='custom-table-field' title={intl.formatMessage({ id: 'inference.table.download.tooltip' })}>
                                <Button color='green' icon as='a' href={downloadUrl}>
                                    <Icon name='file excel' />
                                </Button>
                            </Form.Field>
                        ]}
                        customFilters={[
                            {
                                label: intl.formatMessage({ id: 'inference.table.filter.cluster.label' }),
                                keyForServer: 'cluster',
                                defaultValue: '',
                                placeholder: intl.formatMessage({ id: 'inference.table.filter.cluster.placeholder' }),
                                allowZero: true,
                                urlToRetrieveOptions: `${urlClustersUniqueInferenceExperiment}/${props.selectedInferenceExperiment.id}/`
                            }
                        ]}
                        defaultSortProp={{ sortField: 'sample', sortOrderAscendant: false }}
                        showSearchInput
                        defaultPageSize={25}
                        searchLabel={intl.formatMessage({ id: 'inference.table.search.label' })}
                        searchPlaceholder={intl.formatMessage({ id: 'inference.table.search.placeholder' })}
                        urlToRetrieveData={urlInferenceExperimentSamplesAndClusters}
                        mapFunction={(sampleAndCluster: SampleAndCluster) => {
                            return (
                                <Table.Row key={sampleAndCluster.sample} style={{ backgroundColor: sampleAndCluster.color ?? '' }}>
                                    <TableCellWithTitle className='align-center' value={sampleAndCluster.sample} />
                                    <Table.Cell textAlign='center'>{sampleAndCluster.cluster}</Table.Cell>
                                </Table.Row>
                            )
                        }}
                    />
                </Grid.Column>
                <Grid.Column width={4}>
                    {selectedTrainedModelPk !== null && (
                        <>
                            <NewClusterLabelsSetModal
                                showNewClusterLabelsSet={openClusterLabelsSetModal}
                                setShowNewClusterLabelsSet={setOpenClusterLabelsSetModal}
                                trainedModelPk={selectedTrainedModelPk}
                            />

                            <ClusterLabelsSetSelect
                                trainedModelPk={selectedTrainedModelPk}
                                selectedClusterSetPk={selectedClusterSetPk}
                                setSelectedClusterSetPk={setSelectedClusterSetPk}
                            />

                            <Button className='margin-top-2' primary fluid onClick={() => { setOpenClusterLabelsSetModal(true) }}>{intl.formatMessage({ id: 'inference.table.addClusterLabels' })}</Button>
                        </>
                    )}
                </Grid.Column>
            </Grid.Row>
        </Grid>

    )
}
