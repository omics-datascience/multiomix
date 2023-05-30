import React from 'react'
import { Table } from 'semantic-ui-react'

/** NoDataRow props */
interface NoDataRowProps {
    colspan: number
}

/**
 * Renders a table row with a colspan indicating that there's no data in table
 * @param props Component's props
 * @returns Component
 */
export const NoDataRow = (props: NoDataRowProps) => (
    <Table.Row>
        <Table.Cell colSpan={props.colspan} textAlign='center'>
            <strong>No data found</strong>
        </Table.Cell>
    </Table.Row>
)
