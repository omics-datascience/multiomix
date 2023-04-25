import React, { useContext } from 'react'
import { Header, Modal, Button, DropdownItemProps, Table } from 'semantic-ui-react'
import { DjangoUserFile, RowHeader } from '../../../utils/django_interfaces'
import { FileType, Nullable } from '../../../utils/interfaces'
import { formatDateLocale, getFileTypeName } from '../../../utils/util_functions'
import { PaginatedTable, PaginationCustomFilter } from '../../common/PaginatedTable'
import { TagLabel } from '../../common/TagLabel'
import { UserFileTypeLabel } from './UserFileTypeLabel'
import { CurrentUserContext } from '../../Base'

declare const urlUserFilesCRUD: string

/**
 * Component's props
 */
interface UserDatasetsModalProps {
    /** If true, opens the modal */
    showUserDatasetsModal: boolean,
    /** Object of selected file to mark it in the modal and enable the confirmation button */
    selectedFile: Nullable<DjangoUserFile>,
    /** Type of FileType being selected to show a little label (mRNA, miRNA, CNA, etc) */
    selectingFileType: FileType,
    /** List of Tags to filter */
    tagOptions: DropdownItemProps[],
    /** List of Institutions to filter */
    institutionsOptions: DropdownItemProps[],
    /** Flag to retrieve only clinical datasets with at least one survival tuple (if the file type is other than clinical, this parameter is ignores). By default false */
    showOnlyClinicalDataWithSurvivalTuples: boolean,
    /** Select File callback */
    selectFile: (file: Nullable<DjangoUserFile>) => void,
    /** Modal close callback */
    handleClose: () => void,
    /** Callback to mark as select a specific User's file */
    markFileAsSelected: (file: DjangoUserFile) => void
}

/**
 * Generates a modal with the User's datasets
 *
 * @returns React Modal component
 * @param props Component's props
 */
const UserDatasetsModal = (props: UserDatasetsModalProps) => {
    const currentUser = useContext(CurrentUserContext)

    /**
     * Generates default table's headers
     * @returns Default object for table's headers
     */
    function getDefaultHeaders (): RowHeader<DjangoUserFile>[] {
        var headersList: RowHeader<DjangoUserFile>[] = [
            { name: 'Name', serverCodeToSort: 'name', width: 4 },
            { name: 'Description', serverCodeToSort: 'description', width: 6 }
        ]

        const isClinical = props.selectingFileType === FileType.CLINICAL
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

        return headersList
    }

    /**
     * Generates default table's Filters
     * @returns Default object for table's Filters
     */
    function getDefaultFilters (): PaginationCustomFilter[] {
        return [
            { label: 'Tag', keyForServer: 'tag', defaultValue: '', placeholder: 'Select an existing Tag', options: props.tagOptions },
            { label: 'Visibility', keyForServer: 'visibility', defaultValue: 'all', placeholder: 'Select an existing Tag', options: props.institutionsOptions }
        ]
    }

    if (!props.showUserDatasetsModal) {
        return null
    }

    const fileType = getFileTypeName(props.selectingFileType)

    const isClinical = props.selectingFileType === FileType.CLINICAL

    return (
        <Modal size='fullscreen' open={props.showUserDatasetsModal} onClose={props.handleClose} centered={false}>
            <Header icon='database' content={`Select ${fileType} dataset`}/>
            <Modal.Content className='align-center'>
                <PaginatedTable<DjangoUserFile>
                    headers={getDefaultHeaders()}
                    customFilters={getDefaultFilters()}
                    showSearchInput
                    urlToRetrieveData={urlUserFilesCRUD}
                    queryParams={ { file_type: props.selectingFileType, with_survival_only: props.showOnlyClinicalDataWithSurvivalTuples } }
                    mapFunction={(userFile: DjangoUserFile) => {
                        return (
                            <Table.Row
                                key={userFile.id as number}
                                className="clickable"
                                active={userFile.id === props.selectedFile?.id}
                                onClick={() => props.markFileAsSelected(userFile)}
                                onDoubleClick={() => props.selectFile(userFile)}
                            >
                                <Table.Cell>{userFile.name}</Table.Cell>
                                <Table.Cell>{userFile.description}</Table.Cell>
                                {isClinical &&
                                    <Table.Cell textAlign='center'>{ userFile.survival_columns ? userFile.survival_columns.length : 0 }</Table.Cell>
                                }
                                <Table.Cell collapsing textAlign='center'>
                                    <TagLabel tag={userFile.tag} fluid />
                                </Table.Cell>
                                <Table.Cell collapsing>{ userFile.upload_date ? formatDateLocale(userFile.upload_date) : '-' }</Table.Cell>
                                <Table.Cell collapsing textAlign='center'>
                                    <UserFileTypeLabel dataset={userFile} />
                                </Table.Cell>
                                <Table.Cell collapsing textAlign='center'>
                                    {userFile.user.id === currentUser?.id ? 'You' : userFile.user.username}
                                </Table.Cell>
                            </Table.Row>
                        )
                    }}
                />
            </Modal.Content>

            {/* Cancel button */}
            <Modal.Actions>
                <Button onClick={props.handleClose}>
                    Cancel
                </Button>

                <Button
                    color="green"
                    onClick={() => props.selectFile(props.selectedFile)}
                    disabled={props.selectedFile === null}
                >
                    Confirm
                </Button>
            </Modal.Actions>
        </Modal>
    )
}

export { UserDatasetsModal }
