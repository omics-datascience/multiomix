import React from 'react'
import { SampleAndCluster, StatisticalValidationForTable } from '../../../types'
import { Table } from 'semantic-ui-react'
import { PaginatedTable } from '../../../../common/PaginatedTable'
import { TableCellWithTitle } from '../../../../common/TableCellWithTitle'
import { useIntl } from 'react-intl'

declare const urlStatisticalValidationSamplesAndClusters: string
declare const urlClustersUniqueStatValidation: string

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
    /* TODO: implement here the colors for background too */
    const intl = useIntl()
    return (
        <PaginatedTable<SampleAndCluster>
            headers={[
                { name: intl.formatMessage({ id: 'common.sample' }), serverCodeToSort: 'sample', width: 3 },
                { name: intl.formatMessage({ id: 'common.cluster' }), serverCodeToSort: 'cluster', width: 2 }
            ]}
            queryParams={{ statistical_validation_pk: props.selectedStatisticalValidation.id }}
            customFilters={[
                {
                    label: intl.formatMessage({ id: 'common.cluster' }),
                    keyForServer: 'cluster',
                    defaultValue: '',
                    placeholder: intl.formatMessage({ id: 'samplesAndGroupsTable.filter.cluster.placeholder' }),
                    allowZero: true,
                    urlToRetrieveOptions: `${urlClustersUniqueStatValidation}/${props.selectedStatisticalValidation.id}/`
                }
            ]}
            defaultSortProp={{ sortField: 'sample', sortOrderAscendant: false }}
            showSearchInput
            defaultPageSize={25}
            searchLabel={intl.formatMessage({ id: 'common.sample' })}
            searchPlaceholder={intl.formatMessage({ id: 'common.search' }) + ' ' + intl.formatMessage({ id: 'common.sample' })}
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
