import React from 'react'
import { Table } from 'semantic-ui-react'
import { Nullable } from '../../utils/interfaces'

/**
 * Components props
 */
interface TableCellWithTitleProps {
    /** Value to show in cell and title */
    value: Nullable<string>,
    /** Optional className prop */
    className?: string
}

/**
 * Renders a Table.Cell with the same shown value in the cell as title
 * @param props Components props
 * @returns Component
 */
export const TableCellWithTitle = (props: TableCellWithTitleProps) => (
    <Table.Cell title={props.value} className={props.className}>{props.value}</Table.Cell>
)
