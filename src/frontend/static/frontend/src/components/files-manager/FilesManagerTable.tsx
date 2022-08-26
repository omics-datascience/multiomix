import React from 'react'
import { Table, Form, DropdownItemProps, Pagination } from 'semantic-ui-react'
import { DjangoInstitution, DjangoMethylationPlatform, DjangoSurvivalColumnsTupleSimple, DjangoUserFile, RowHeader, DjangoTag } from '../../utils/django_interfaces'
import { FileType, Nullable } from '../../utils/interfaces'
import { FilesManagerTableControl } from './FilesManager'
import { getFileTypeSelectOptions, getDefaultNewTag } from '../../utils/util_functions'
import { UploadState } from '../../utils/file_uploader'
import { FilesManagerRow } from './FilesManagerRow'
import { InstitutionsDropdown } from './InstitutionsDropdown'

const FILE_INPUT_LABEL = 'Add a new file'

/**
 * New File Form fields
 */
 interface NewFile {
    id?: number,
    newFileName: string,
    newFileNameUser: string, // Filename input for user customization
    newFileDescription: string,
    newFileType: FileType,
    isCpGSiteId: boolean,
    platform: DjangoMethylationPlatform,
    newTag: Nullable<number>,
    institutions: number[],
    survivalColumns: DjangoSurvivalColumnsTupleSimple[]
}

/**
 * Component's props
 */
interface FilesManagerTableProps {
    files: DjangoUserFile[],
    filesManagerTableControl: FilesManagerTableControl,
    valueInstitutionDropDown: number[],
    institutionsOptions: DropdownItemProps[],
    tagOptions: DropdownItemProps[],
    confirmFileDeletion: (file: DjangoUserFile) => void,
    editFile: (fileToEdit: DjangoUserFile) => void,
    handleFilterChanges : (name: string, value: any) => void,
    handleFilterTagChanges : (value: any) => void
}

/**
 * Component's state
 */
interface FilesManagerTableState {
    headers: RowHeader<DjangoUserFile>[],
    tags: DjangoTag[],
    userInstitutions: DjangoInstitution[],
    newTag: DjangoTag,
    showDeleteTagModal: boolean,
    showDeleteFileModal: boolean,
    selectedTagToDelete: Nullable<DjangoTag>,
    selectedFileToDelete: Nullable<DjangoUserFile>,
    deletingTag: boolean,
    deletingFile: boolean,
    uploadingFile: boolean,
    newFile: NewFile,
    addingTag: boolean,
    uploadPercentage: number,
    uploadState: Nullable<UploadState>
}

class FilesManagerTable extends React.Component<FilesManagerTableProps, FilesManagerTableState> {
    constructor (props) {
        super(props)

        this.state = {
            headers: this.getDefaultHeaders(),
            tags: [],
            userInstitutions: [],
            newTag: getDefaultNewTag(),
            showDeleteTagModal: false,
            showDeleteFileModal: false,
            selectedTagToDelete: null,
            selectedFileToDelete: null,
            deletingTag: false,
            deletingFile: false,
            uploadingFile: false,
            newFile: this.getDefaultNewFile(),
            addingTag: false,
            uploadPercentage: 0,
            uploadState: null
        }
    }

    /**
     * Generates a default new file form
     * @returns An object with all the field with default values
     */
    getDefaultNewFile (): NewFile {
        return {
            newFileName: FILE_INPUT_LABEL,
            newFileNameUser: '',
            newFileDescription: '',
            newFileType: FileType.MRNA,
            newTag: null,
            institutions: [],
            isCpGSiteId: false,
            platform: DjangoMethylationPlatform.PLATFORM_450,
            survivalColumns: []
        }
    }

    /**
     * Generates default table's headers
     * @returns Default object for table's headers
     */
    getDefaultHeaders (): RowHeader<DjangoUserFile>[] {
        return [
            { name: 'Name', serverCodeToSort: 'name' },
            { name: 'Description', serverCodeToSort: 'description', width: 3 },
            { name: 'Type', serverCodeToSort: 'file_type' },
            { name: 'Date', serverCodeToSort: 'upload_date' },
            { name: 'Institutions', width: 2 },
            { name: 'Tag', serverCodeToSort: 'tag', width: 2 },
            { name: 'Actions' }
        ]
    }

    render () {
        // Sets the order icon in Table's header
        const columnSorted = this.props.filesManagerTableControl.sortField
        const sortOrder = this.props.filesManagerTableControl.sortOrderAscendant ? 'ascending' : 'descending'
        const headers = this.state.headers.map((header) => {
            const sorted = columnSorted === header.serverCodeToSort ? sortOrder : undefined

            // If the column is not sortable the there's not callback
            // Uses '!==' as it could be 'undefined' and that would mean that is sortable
            // const onClickCallback = (header.serverCodeToSort)
            //     ? () => this.props.handleSortUserFile(header.serverCodeToSort as string)
            //     : null

            return (
                <Table.HeaderCell
                    key={header.name}
                    title={header.name}
                    width={header.width}
                    sorted={sorted}
                >
                    {header.name}
                </Table.HeaderCell>
            )
        })

        const selectPageSizeOptions = [
            { key: '10', text: '10', value: 10 },
            { key: '25', text: '25', value: 25 },
            { key: '50', text: '50', value: 50 },
            { key: '100', text: '100', value: 100 }
        ]

        const selectVisibilityOptions = [
            { key: 'all', text: 'All', value: 'all' },
            { key: 'private', text: 'Private', value: 'private' }
        ]

        // Calculates total pages
        const totalPages = Math.max(1, Math.ceil(this.props.filesManagerTableControl.totalRowCount as number / this.props.filesManagerTableControl.pageSize))

        // Get Select options, with 'All' option included
        const allFileTypeOptions = getFileTypeSelectOptions()

        return (
            <div>
                {/* Table filters */}
                <Form>
                    <Form.Group>
                        {/* Name/Description search */}
                        <Form.Input
                            width={5}
                            icon='search' iconPosition='left'
                            label='Name/Description'
                            placeholder='Search by name/description'
                            name='textFilter'
                            value={this.props.filesManagerTableControl.textFilter}
                            onChange={(_, { name, value }) => this.props.handleFilterChanges(name, value)}
                        />

                        {/* Tag filter */}
                        <Form.Dropdown
                            fluid
                            width={3}
                            search
                            label='Tag'
                            selection
                            options={this.props.tagOptions}
                            clearable
                            value={this.props.filesManagerTableControl.tag?.id ?? undefined}
                            onChange={(_, { value }) => this.props.handleFilterTagChanges(value)}
                            placeholder='Select Tag'
                        />

                        {/* Visibility filter */}
                        <Form.Select
                            fluid
                            width={2}
                            options={selectVisibilityOptions}
                            label='Visibility'
                            name="visibility"
                            value={this.props.filesManagerTableControl.visibility}
                            onChange={(_, { name, value }) => this.props.handleFilterChanges(name, value)}
                        />

                        {/* Institutions filter */}
                        <InstitutionsDropdown
                            value={this.props.valueInstitutionDropDown}
                            showLabel
                            name="Institutions"
                            institutionsOptions={this.props.institutionsOptions}
                            disabled={this.props.filesManagerTableControl.visibility === 'private'}
                            handleChange={this.props.handleFilterChanges}
                        />

                        {/* File Type filter */}
                        <Form.Select
                            fluid
                            width={2}
                            label='File type'
                            value={this.props.filesManagerTableControl.fileType}
                            options={allFileTypeOptions}
                            name="fileType"
                            onChange={(_, { name, value }) => this.props.handleFilterChanges(name, value)}
                        />

                        {/* Page size */}
                        <Form.Select
                            fluid
                            width={2}
                            label='Entries'
                            value={this.props.filesManagerTableControl.pageSize}
                            options={selectPageSizeOptions}
                            name='pageSize'
                            onChange={(_, { name, value }) => this.props.handleFilterChanges(name, value)}
                        />
                    </Form.Group>
                </Form>

                {/* Table */}
                <Table sortable celled textAlign="center" fixed singleLine>
                    {/* Header */}
                    <Table.Header>
                        <Table.Row>
                            { headers }
                        </Table.Row>
                    </Table.Header>

                    {/* Body */}
                    <Table.Body>
                        {this.props.files.map((file) => (
                            <FilesManagerRow
                                key={file.id}
                                file={file}
                                confirmFileDeletion={this.props.confirmFileDeletion}
                                editCallback={this.props.editFile}
                            />
                        ))}
                    </Table.Body>
                </Table>

                {/* Pagination control */}
                <Pagination
                    activePage={this.props.filesManagerTableControl.pageNumber}
                    onPageChange={(_, { activePage }) => this.props.handleFilterChanges('pageNumber', activePage)}
                    size='mini'
                    totalPages={totalPages}
                />
            </div>
        )
    }
}

export { FilesManagerTable }
