import React from 'react'
import { Header, Modal, Button, Form, DropdownItemProps } from 'semantic-ui-react'
import { DjangoUserFile } from '../../../utils/django_interfaces'
import { FileType, DatasetModalUserFileTableControl, Nullable } from '../../../utils/interfaces'
import { DatasetType } from '../SourceForm'
import { UserDatasetsTable } from './UserDatasetsTable'
import { getDefaultPageSizeOption, getFileTypeName } from '../../../utils/util_functions'

/**
 * Component's props
 */
interface UserDatasetsModalProps {
    /** List of datasets to display in modal */
    datasets: DjangoUserFile[],
    /** TableControl for filter, sorting and pagination */
    tableControl: DatasetModalUserFileTableControl,
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
    /** Select File callback */
    selectFile: (file: Nullable<DjangoUserFile>) => void,
    /** Modal close callback */
    handleClose: () => void,
    /** Callback to mark as select a specific User's file */
    markFileAsSelected: (file: DjangoUserFile) => void,
    /** Callback to handle TableControl changes */
    handleTableControlChanges: (field: string, value, resetPagination?: boolean) => void
    /** Callback to handle TableControl changes */
    handleSort: (headerServerCodeToSort: string, datasetType: DatasetType) => void
}

/**
 * Generates a modal with the User's datasets
 *
 * @returns React Modal component
 * @param props Component's props
 */
const UserDatasetsModal = (props: UserDatasetsModalProps) => {
    if (!props.showUserDatasetsModal) {
        return null
    }

    const fileType = getFileTypeName(props.selectingFileType)

    const selectPageSizeOptions = getDefaultPageSizeOption()

    return (
        <Modal size='fullscreen' open={props.showUserDatasetsModal} onClose={props.handleClose} centered={false}>
            <Header icon='database' content={`Select ${fileType} dataset`}/>
            <Modal.Content className='align-center'>
                {/* Search Form */}
                <Form>
                    <Form.Group>
                        {/* Name/Description search */}
                        <Form.Input
                            width={5}
                            icon='search' iconPosition='left'
                            label='Name/Description'
                            placeholder='Search by name/description'
                            name='textFilter'
                            value={props.tableControl.textFilter}
                            onChange={(_, { name, value }) => props.handleTableControlChanges(name, value)}
                        />

                        {/* Tag filter */}
                        <Form.Dropdown
                            fluid
                            width={4}
                            search
                            label='Tag'
                            selection
                            options={props.tagOptions}
                            name='tagId'
                            clearable
                            value={props.tableControl.tagId as number}
                            onChange={(_, { name, value }) => props.handleTableControlChanges(name, value)}
                            placeholder='Select an existing Tag'
                        />

                        {/* Visibility filter */}
                        <Form.Select
                            fluid
                            width={6}
                            label='Visibility'
                            options={props.institutionsOptions}
                            name='visibility'
                            value={props.tableControl.visibility}
                            onChange={(_, { name, value }) => props.handleTableControlChanges(name, value)}
                        />

                        {/* Page size */}
                        <Form.Select
                            fluid
                            width={2}
                            label='Entries'
                            options={selectPageSizeOptions}
                            name='pageSize'
                            value={props.tableControl.pageSize}
                            onChange={(_, { name, value }) => props.handleTableControlChanges(name, value)}
                        />
                    </Form.Group>
                </Form>

                {/* Datasets table */}
                <UserDatasetsTable
                    datasets={props.datasets}
                    fileType={props.selectingFileType}
                    selectedFile={props.selectedFile}
                    tableControl={props.tableControl}
                    handleSort={props.handleSort}
                    markFileAsSelected={props.markFileAsSelected}
                    handleTableControlChanges={props.handleTableControlChanges}
                    selectFile={props.selectFile}
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
