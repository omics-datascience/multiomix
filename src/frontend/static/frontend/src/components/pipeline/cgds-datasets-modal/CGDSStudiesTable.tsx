import React from 'react'
import { Table, Pagination, Button, Icon } from 'semantic-ui-react'
import { RowHeader, DjangoCGDSStudy } from '../../../utils/django_interfaces'
import { GeneralTableControl } from '../../../utils/interfaces'
import { DatasetType } from '../SourceForm'
import { formatDateLocale } from '../../../utils/util_functions'

/**
 * Component's props
 */
interface CGDSStudiesTableProps {
    /** List of datasets to display in modal */
    studies: DjangoCGDSStudy[],
    /** Selected CGDSStudy */
    selectedStudy: DjangoCGDSStudy,
    /** TableControl for filter, sorting and pagination */
    tableControl: GeneralTableControl,
    /** Callback to handle TableControl changes */
    handleSort: (headerServerCodeToSort: string, datasetType: DatasetType) => void,
    /** Callback to mark as select a specific User's file */
    markStudyAsSelected: (study: DjangoCGDSStudy) => void,
    /** Callback to handle TableControl changes */
    handleTableControlChanges: (field: string, value, resetPagination?: boolean) => void,
    /** Select CGDSStudy callback */
    selectStudy: (study: DjangoCGDSStudy) => void,
}

/**
 * Renders a table with the CGDSDataset data
 * TODO: refactor component with paginated table!
 * @param props Component's props
 * @returns Component
 */
export const CGDSStudiesTable = (props: CGDSStudiesTableProps) => {
    const selectedFileId = props.selectedStudy ? props.selectedStudy.id : null

    const headersList: RowHeader<DjangoCGDSStudy>[] = [
        { name: 'Name', serverCodeToSort: 'name' },
        { name: 'Description', serverCodeToSort: 'description' },
        { name: 'Sync. Date', serverCodeToSort: 'date_last_synchronization' },
        { name: 'Study info' }
    ]

    // Sets the order icon in Table's header
    const columnSorted = props.tableControl.sortField
    const sortOrder = props.tableControl.sortOrderAscendant ? 'ascending' : 'descending'

    const headers = headersList.map((header) => {
        const sorted = columnSorted === header.serverCodeToSort ? sortOrder : undefined

        // If the column is not sortable the there's not callback
        // Uses '!==' as it could be 'undefined' and that would mean that is sortable
        const onClickCallback = (header.serverCodeToSort)
            ? () => props.handleSort(header.serverCodeToSort as string, DatasetType.CGDS)
            : null

        return (
            <Table.HeaderCell
                key={header.name}
                sorted={sorted}
                onClick={onClickCallback}
            >
                {header.name}
            </Table.HeaderCell>
        )
    })

    const rows = props.studies.map((CGDSStudy) => {
        const studySyncDate = CGDSStudy.date_last_synchronization
            ? formatDateLocale(CGDSStudy.date_last_synchronization)
            : '-'

        return (
            <Table.Row
                key={CGDSStudy.id}
                className="clickable"
                active={CGDSStudy.id === selectedFileId}
                onClick={() => props.markStudyAsSelected(CGDSStudy)}
                onDoubleClick={() => props.selectStudy(CGDSStudy)}
            >
                <Table.Cell>{CGDSStudy.name}</Table.Cell>
                <Table.Cell>{CGDSStudy.description}</Table.Cell>
                <Table.Cell collapsing>{studySyncDate}</Table.Cell>
                <Table.Cell collapsing textAlign='center'>
                    <Button
                        basic
                        color="blue"
                        icon
                        title="See more info"
                        className="borderless-button"
                        as='a' href={CGDSStudy.url_study_info} target="_blank"
                        disabled={!CGDSStudy.url_study_info}
                    >
                        <Icon name='info circle' />
                    </Button>
                </Table.Cell>
            </Table.Row>
        )
    })

    const totalPages = Math.max(1, Math.ceil(props.tableControl.totalRowCount as number / props.tableControl.pageSize))

    return (
        <div>
            <Table sortable celled striped className='margin-top-2 table-bordered'>
                {/* Header */}
                <Table.Header id='user-datasets-table-header'>
                    <Table.Row>
                        {headers}
                    </Table.Row>
                </Table.Header>

                {/* Body */}
                <Table.Body>
                    {rows}
                </Table.Body>
            </Table>

            {/* Pagination control */ }
            <Pagination
                className='margin-top-5'
                activePage={props.tableControl.pageNumber}
                onPageChange={(_, { activePage }) => props.handleTableControlChanges('pageNumber', activePage, false)}
                size='mini'
                totalPages={totalPages}
            />
        </div>
    )
}
