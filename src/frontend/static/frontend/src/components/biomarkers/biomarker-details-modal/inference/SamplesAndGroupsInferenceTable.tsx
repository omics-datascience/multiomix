import React from 'react'
import { Table } from 'semantic-ui-react'
import { InferenceExperimentForTable, SampleAndCluster } from '../../types'
import { PaginatedTable } from '../../../common/PaginatedTable'
import { TableCellWithTitle } from '../../../common/TableCellWithTitle'

declare const urlInferenceExperimentSamplesAndClusters: string

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
    return (
        <PaginatedTable<SampleAndCluster>
            headers={[
                { name: 'Sample', serverCodeToSort: 'sample', width: 3 },
                { name: 'Cluster', serverCodeToSort: 'cluster', width: 2 }
            ]}
            queryParams={{ inference_experiment_pk: props.selectedInferenceExperiment.id }}
            customFilters={[
                { label: 'Cluster', keyForServer: 'cluster', defaultValue: '', placeholder: 'Filter by cluster' }
            ]}
            defaultSortProp={{ sortField: 'sample', sortOrderAscendant: false }}
            showSearchInput
            defaultPageSize={25}
            searchLabel='Sample'
            searchPlaceholder='Search by sample'
            urlToRetrieveData={urlInferenceExperimentSamplesAndClusters}
            mapFunction={(sampleAndCluster: SampleAndCluster) => {
                return (
                    <Table.Row key={sampleAndCluster.sample}>
                        <TableCellWithTitle className='align-center' value={sampleAndCluster.sample} />
                        <Table.Cell textAlign='center'>{sampleAndCluster.cluster}</Table.Cell>
                    </Table.Row>
                )
            }}
        />
    )
}
