import React, { useContext } from 'react'
import { Table, Pagination } from 'semantic-ui-react'
import { RowHeader, DjangoUserFile } from '../../../utils/django_interfaces'
import { DatasetModalUserFileTableControl, FileType, Nullable } from '../../../utils/interfaces'
import { DatasetType } from '../SourceForm'
import { formatDateLocale } from '../../../utils/util_functions'
import { TagLabel } from '../../common/TagLabel'
import { UserFileTypeLabel } from './UserFileTypeLabel'
import { CurrentUserContext } from '../../Base'

/**
 * Component's props
 */
interface UserDatasetsTableProps {
    /** List of datasets to display in modal */
    datasets: DjangoUserFile[],
    /** File type to check if some columns should be shown */
    fileType: FileType,
    /** Selected UserFile */
    selectedFile: Nullable<DjangoUserFile>,
    /** TableControl for filter, sorting and pagination */
    tableControl: DatasetModalUserFileTableControl,
    /** Callback to handle TableControl changes */
    handleSort: (headerServerCodeToSort: string, datasetType: DatasetType) => void,
    /** Callback to mark as select a specific User's file */
    markFileAsSelected: (file: DjangoUserFile) => void,
    /** Callback to handle TableControl changes */
    handleTableControlChanges: (field: string, value, resetPagination?: boolean) => void,
    /** Select File callback */
    selectFile: (file: DjangoUserFile) => void,
}

/**
 * Renders a table with the UserFile's data
 * TODO: refactor component with paginated table!
 * @param props Component's props
 * @returns Component
 */
export const UserDatasetsTable = (props: UserDatasetsTableProps) => {
    const currentUser = useContext(CurrentUserContext)
    const selectedFileId = props.selectedFile ? props.selectedFile.id : null

    let headersList: RowHeader<DjangoUserFile>[] = [
        { name: 'Name', serverCodeToSort: 'name', width: 4 },
        { name: 'Description', serverCodeToSort: 'description', width: 6 }
    ]

    const isClinical = props.fileType === FileType.CLINICAL
    if (isClinical) {
        headersList.push({ name: 'Number of survival tuples', width: 1 })
    }

    const restOfHeaders: RowHeader<DjangoUserFile>[] = [
        { name: 'Tag', serverCodeToSort: 'tag' },
        { name: 'Upload Date', serverCodeToSort: 'upload_date' },
        { name: 'Visibility', serverCodeToSort: 'institutions' },
        { name: 'Uploaded by', serverCodeToSort: 'user' }
    ]

    headersList = headersList.concat(restOfHeaders)

    // Sets the order icon in Table's header
    const columnSorted = props.tableControl.sortField
    const sortOrder = props.tableControl.sortOrderAscendant ? 'ascending' : 'descending'

    const headers = headersList.map((header) => {
        const sorted = columnSorted === header.serverCodeToSort ? sortOrder : undefined

        // If the column is not sortable the there's not callback
        // Uses '!==' as it could be 'undefined' and that would mean that is sortable
        const onClickCallback = (header.serverCodeToSort)
            ? () => props.handleSort(header.serverCodeToSort as string, DatasetType.USER_FILE)
            : null

        return (
            <Table.HeaderCell
                key={header.name}
                sorted={sorted}
                onClick={onClickCallback}
                width={header.width}
            >
                {header.name}
            </Table.HeaderCell>
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
                    {props.datasets.map((dataset) => {
                        const studySyncDate = dataset.upload_date
                            ? formatDateLocale(dataset.upload_date)
                            : '-'

                        const survivalColumnsTuplesCount = dataset.survival_columns ? dataset.survival_columns.length : 0

                        return (
                            <Table.Row
                                key={dataset.id}
                                className="clickable"
                                active={dataset.id === selectedFileId}
                                onClick={() => props.markFileAsSelected(dataset)}
                                onDoubleClick={() => props.selectFile(dataset)}
                            >
                                <Table.Cell>{dataset.name}</Table.Cell>
                                <Table.Cell>{dataset.description}</Table.Cell>
                                {isClinical &&
                                    <Table.Cell textAlign='center'>{survivalColumnsTuplesCount}</Table.Cell>
                                }
                                <Table.Cell collapsing textAlign='center'>
                                    <TagLabel tag={dataset.tag} fluid />
                                </Table.Cell>
                                <Table.Cell collapsing>{studySyncDate}</Table.Cell>
                                <Table.Cell collapsing textAlign='center'>
                                    <UserFileTypeLabel dataset={dataset} />
                                </Table.Cell>
                                <Table.Cell collapsing textAlign='center'>
                                    {dataset.user.id === currentUser?.id ? 'You' : dataset.user.username}
                                </Table.Cell>
                            </Table.Row>
                        )
                    })}
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
