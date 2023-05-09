import React from 'react'
import { SampleAndCluster, StatisticalValidationForTable } from '../../../types'
import { Table } from 'semantic-ui-react'
import { PaginatedTable } from '../../../../common/PaginatedTable'
import { TableCellWithTitle } from '../../../../common/TableCellWithTitle'

declare const urlStatisticalValidationSamplesAndClusters: string

interface SamplesAndGroupsTableProps {
    /** Selected StatisticalValidationForTable instance to retrieve all its data. */
    selectedStatisticalValidation: StatisticalValidationForTable,
}

/**
 * Renders a Table with the samples and the cluster where they belong.
 * @param props Component props.
 * @returns Component.
 */
export const SamplesAndGroupsTable = (props: SamplesAndGroupsTableProps) => {
    return (
        <PaginatedTable<SampleAndCluster>
            headers={[
                { name: 'Sample', serverCodeToSort: 'sample', width: 3 },
                { name: 'Cluster', serverCodeToSort: 'cluster', width: 2 }
            ]}
            queryParams={{ statistical_validation_pk: props.selectedStatisticalValidation.id }}
            customFilters={[
                { label: 'Cluster', keyForServer: 'cluster', defaultValue: '', placeholder: 'Filter by cluster' }
            ]}
            defaultSortProp={{ sortField: 'sample', sortOrderAscendant: false }}
            showSearchInput
            defaultPageSize={25}
            searchLabel='Sample'
            searchPlaceholder='Search by sample'
            urlToRetrieveData={urlStatisticalValidationSamplesAndClusters}
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
