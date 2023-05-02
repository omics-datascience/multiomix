import React, { useState } from 'react'
import { SampleAndCluster } from '../../../types'
import { Table } from 'semantic-ui-react'
import { SortField } from '../../../../../utils/interfaces'

interface SamplesAndGroupsTableProps {
    data: SampleAndCluster[]
}

/**
 * Renders a Table with the samples and the cluster where they belong.
 * @param props Component props.
 * @returns Component.
 */
export const SamplesAndGroupsTable = (props: SamplesAndGroupsTableProps) => {
    const [sortOptions, setSortOptions] = useState<SortField<number>>({
        field: 0, // First sorts by sample,
        name: '',
        sortOrderAscendant: true
    })

    /**
     * Gets the data sorted.
     * @returns Sorted data.
     */
    const sortData = (): SampleAndCluster[] => {
        if (sortOptions === null) {
            return props.data
        }

        const field = sortOptions.field

        if (sortOptions.sortOrderAscendant) {
            return props.data.sort((a, b) => a[field].toString().localeCompare(b[field].toString()))
        }

        return props.data.sort((a, b) => b[field].toString().localeCompare(a[field].toString()))
    }

    /**
     * Handle changes in the table sort order.
     * @param field New field which the table is being sorted.
     */
    const handleChangeOrder = (field: number) => {
        let sortOrderAscendant: boolean
        if (field === sortOptions.field) {
            sortOrderAscendant = !sortOptions.sortOrderAscendant
        } else {
            sortOrderAscendant = true
        }

        setSortOptions({ ...sortOptions, field, sortOrderAscendant })
    }

    const sortedData = sortData()
    const sortDirection = sortOptions.sortOrderAscendant ? 'ascending' : 'descending'

    return (
        <Table sortable celled fixed>
            <Table.Header>
                <Table.Row>
                    <Table.HeaderCell
                        sorted={sortOptions.field === 0 ? sortDirection : undefined}
                        onClick={() => handleChangeOrder(0)}
                    >
                        Sample
                    </Table.HeaderCell>
                    <Table.HeaderCell
                        sorted={sortOptions.field === 1 ? sortDirection : undefined}
                        onClick={() => handleChangeOrder(1)}
                    >
                        Cluster
                    </Table.HeaderCell>
                </Table.Row>
            </Table.Header>
            <Table.Body>
                {sortedData.map(([sample, cluster]) => (
                    <Table.Row key={sample}>
                        <Table.Cell>{sample}</Table.Cell>
                        <Table.Cell>{cluster}</Table.Cell>
                    </Table.Row>
                ))}
            </Table.Body>
        </Table>
    )
}
