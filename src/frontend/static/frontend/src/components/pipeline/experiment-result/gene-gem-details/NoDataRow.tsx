import React from 'react'
import { Table } from 'semantic-ui-react'

/**
 * Renders a table row with a colspan indicating that there's no data in table
 * @param props Component's props
 * @returns Component
 */
export const NoDataRow = (props: { colspan: number }) => (
    <Table.Row>
        <Table.Cell colSpan={props.colspan} textAlign='center'>
            <strong>No data found</strong>
        </Table.Cell>
    </Table.Row>
)
