import React from 'react'
import { Table } from 'semantic-ui-react'
import { useIntl } from 'react-intl'

/** NoDataRow props */
interface NoDataRowProps {
    colspan: number
}

/**
 * Renders a table row with a colspan indicating that there's no data in table
 * @param props Component's props
 * @returns Component
 */
export const NoDataRow = (props: NoDataRowProps) => {
    const intl = useIntl()

    return (
        <Table.Row>
            <Table.Cell colSpan={props.colspan} textAlign='center'>
                <strong>
                    {intl.formatMessage({ id: 'noDataRow.noDataFound' })}
                </strong>
            </Table.Cell>
        </Table.Row>
    )
}
