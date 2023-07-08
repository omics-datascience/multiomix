import React from 'react'
import { Base } from '../Base'
import { Grid, Header, Button, Modal, DropdownItemProps, Table, Icon } from 'semantic-ui-react'
import { DjangoTag, DjangoUserFile, TagType, DjangoInstitution, DjangoMethylationPlatform, DjangoResponseUploadUserFileError, DjangoUserFileUploadErrorInternalCode, DjangoSurvivalColumnsTupleSimple, RowHeader } from '../../utils/django_interfaces'
import ky from 'ky'
import { getDjangoHeader, alertGeneralError, getFileTypeSelectOptions, getDefaultNewTag, copyObject, formatDateLocale, getFileTypeName } from '../../utils/util_functions'
import { TagsPanel } from './TagsPanel'
import { FileType, Nullable } from '../../utils/interfaces'
import { NewFileForm } from './NewFileForm'
import { startUpload, UploadState } from '../../utils/file_uploader'
import { PaginatedTable, PaginationCustomFilter } from '../common/PaginatedTable'
import { TableCellWithTitle } from '../common/TableCellWithTitle'
import { TagLabel } from '../common/TagLabel'

/** Structure returned from the chunk upload service. */
type UploadResponse = {
    /** If the upload was successful. */
    ok: boolean,
    /** Error message to show (only set in case ok === false). */
    errorMsg?: string
}

const FILE_INPUT_LABEL = 'Add a new file'

// URLs defined in files.html
declare const urlTagsCRUD: string
declare const urlUserFilesCRUD: string
declare const urlUserInstitutions: string
declare const urlChunkUpload: string
declare const urlChunkUploadComplete: string
declare const downloadFileURL: string

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
 * Component's state
 */
interface FilesManagerState {
    tags: DjangoTag[],
    files: DjangoUserFile[],
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

/**
 * Renders a manager to list, add, download and remove source files (which are used to make experiments).
 * Also, this component renders a CRUD of Tags for files
 */
class FilesManager extends React.Component<{}, FilesManagerState> {
    private newFileInputRef: React.RefObject<any> = React.createRef()
    filterTimeout: number | undefined

    constructor (props) {
        super(props)

        this.state = {
            tags: [],
            files: [],
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
     * Handles file input changes to set data to show in form
     */
    fileChange = () => {
        const newFileForm = this.state.newFile

        // Get Filename if file was selected
        const newFile = this.newFileInputRef.current
        const newFileName = (newFile && newFile.files.length > 0) ? newFile.files[0].name : FILE_INPUT_LABEL

        // If there wasn't a File name written by the user, loads the filename in the input
        const newFileNameUser = (newFileForm.newFileNameUser.trim().length > 0) ? newFileForm.newFileNameUser : newFileName

        // Sets the new field values
        newFileForm.newFileName = newFileName
        newFileForm.newFileNameUser = newFileNameUser

        this.setState({ newFile: newFileForm })
    }

    /**
     * Handles input changes in the New File Form
     * @param name State field to change
     * @param value Value to assign to the specified field
     */
    handleAddFileInputsChange = (name: string, value: any) => {
        const newFileForm = this.state.newFile
        newFileForm[name] = value
        this.setState({ newFile: newFileForm })
    }

    /**
     * Prevents users from closing browser tag when upload is in process.
     *
     * @param e Event
     */
    onUnload = e => { // the method that will be used for both add and remove event
        if (this.state.uploadingFile) {
            e.preventDefault()
            e.returnValue = 'A file is being uploaded. If you close the tab the upload will be canceled.'
        }
    }

    /**
     * When the component has been mounted, It requests for
     * tags and files.
     */
    componentDidMount () {
        window.addEventListener('beforeunload', this.onUnload)
        this.getUserTags()
        this.getUserInstitutions()
    }

    /** Removes event on component unmount. */
    componentWillUnmount () {
        window.removeEventListener('beforeunload', this.onUnload)
    }

    /**
     * Fetches the Institutions of which the User is part of
     */
    getUserInstitutions () {
        ky.get(urlUserInstitutions).then((response) => {
            response.json().then((userInstitutions: DjangoInstitution[]) => {
                this.setState({ userInstitutions })
            }).catch((err) => {
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.log("Error getting user's tags ->", err)
        })
    }

    /**
     * Fetches the User's defined tags
     */
    getUserTags () {
        // Gets only File's Tags
        const searchParams = {
            type: TagType.FILE
        }

        ky.get(urlTagsCRUD, { searchParams }).then((response) => {
            response.json().then((tags: DjangoTag[]) => {
                this.setState({ tags })
            }).catch((err) => {
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.log("Error getting user's tags ->", err)
        })
    }

    /**
     * Selects a new Tag to edit
     * @param selectedTag Tag to edit
     */
    editTag = (selectedTag: DjangoTag) => { this.setState({ newTag: copyObject(selectedTag) }) }

    /**
     * Does a request to add a new Tag
     */
    addOrEditTag () {
        if (this.state.addingTag) {
            return
        }

        // Sets the Request's Headers
        const myHeaders = getDjangoHeader()

        // If exists an id then we are editing, otherwise It's a new Tag
        let addOrEditURL, requestMethod
        if (this.state.newTag.id !== null) {
            addOrEditURL = `${urlTagsCRUD}${this.state.newTag.id}/`
            requestMethod = ky.patch
        } else {
            addOrEditURL = urlTagsCRUD
            requestMethod = ky.post
        }

        this.setState({ addingTag: true }, () => {
            requestMethod(addOrEditURL, { headers: myHeaders, json: this.state.newTag }).then((response) => {
                this.setState({ addingTag: false })
                response.json().then((responseJSON: DjangoTag) => {
                    if (responseJSON && responseJSON.id) {
                        // If all is OK, resets the form and gets the User's tag to refresh the list
                        this.setState({ newTag: getDefaultNewTag() })
                        this.getUserTags()
                    }
                }).catch((err) => {
                    alertGeneralError()
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                this.setState({ addingTag: false })
                alertGeneralError()
                console.log('Error adding new Tag ->', err)
            })
        })
    }

    /**
     * Makes a request to delete a Tag
     */
    deleteTag = () => {
        if (this.state.selectedTagToDelete === null) {
            return
        }

        // Sets the Request's Headers
        const myHeaders = getDjangoHeader()
        const deleteURL = `${urlTagsCRUD}${this.state.selectedTagToDelete.id}`
        this.setState({ deletingTag: true }, () => {
            ky.delete(deleteURL, { headers: myHeaders }).then((response) => {
                // If OK is returned refresh the tags
                if (response.ok) {
                    this.setState({
                        deletingTag: false,
                        showDeleteTagModal: false
                    })
                    this.getUserTags()
                }
            }).catch((err) => {
                this.setState({ deletingTag: false })
                alertGeneralError()
                console.log('Error deleting Tag ->', err)
            })
        })
    }

    /**
     * Makes a request to delete a File
     */
    deleteFile = () => {
        if (this.state.selectedFileToDelete === null) {
            return
        }

        // Sets the Request's Headers
        const myHeaders = getDjangoHeader()
        const deleteURL = `${urlUserFilesCRUD}${this.state.selectedFileToDelete.id}`
        this.setState({ deletingFile: true }, () => {
            ky.delete(deleteURL, { headers: myHeaders }).then((response) => {
                // If OK is returned refresh the tags
                if (response.ok) {
                    this.setState({
                        deletingFile: false,
                        showDeleteFileModal: false
                    })

                    // If the file which was deleted is the same which is being edited, cleans the form
                    if (this.state.selectedFileToDelete?.id === this.state.newFile.id) {
                        this.resetNewFileForm()
                    }
                }
            }).catch((err) => {
                this.setState({ deletingFile: false })
                alertGeneralError()
                console.log('Error deleting new Tag ->', err)
            })
        })
    }

    /**
     * Handles New Tag Input changes
     * @param name State field to change
     * @param value Value to assign to the specified field
     */
    handleAddTagInputsChange = (name: string, value) => {
        const newTag = this.state.newTag
        newTag[name] = value
        this.setState({ newTag })
    }

    /**
     * Handles New Tag Input Key Press
     * @param e Event of change
     */
    handleKeyDown = (e) => {
        // If pressed Enter key submits the new Tag
        if (e.which === 13 || e.keyCode === 13) {
            this.addOrEditTag()
        } else {
            if (e.which === 27 || e.keyCode === 27) {
                this.setState({ newTag: getDefaultNewTag() })
            }
        }
    }

    /**
     * Show a modal to confirm a Tag deletion
     * @param tag Selected Tag to delete
     */
    confirmTagDeletion = (tag: DjangoTag) => {
        this.setState({
            selectedTagToDelete: tag,
            showDeleteTagModal: true
        })
    }

    /**
     * Show a modal to confirm a File deletion
     * @param file Selected Tag to delete
     */
    confirmFileDeletion = (file: DjangoUserFile) => {
        this.setState({
            selectedFileToDelete: file,
            showDeleteFileModal: true
        })
    }

    /**
     * Closes the deletion confirm modals
     */
    handleClose = () => {
        this.setState({
            showDeleteTagModal: false,
            showDeleteFileModal: false
        })
    }

    /**
     * Checks if survivals columns are valid
     * @returns True if are valid, false otherwise
     */
    survivalColumnsAreValid (): boolean {
        const survivalColumns = this.state.newFile.survivalColumns
        return survivalColumns.length === 0 ||
            (
                survivalColumns.length > 0 &&
                survivalColumns.find((survivalColumn) => {
                    return !survivalColumn.time_column.trim().length ||
                        !survivalColumn.event_column.trim().length
                }) === undefined
            )
    }

    /**
     * Check if user can upload a new file
     * @returns True if the new file is valid, false otherwise
     */
    newFileIsValid (): boolean {
        const isEditing = this.isEditing()
        return !this.state.uploadingFile &&
            (
                (!isEditing &&
                    this.newFileInputRef.current !== null &&
                    this.newFileInputRef.current.files.length > 0
                ) || isEditing
            ) && this.state.newFile.newFileNameUser.trim().length > 0 &&
            this.survivalColumnsAreValid()
    }

    /**
     * Resets the new file form
     */
    resetNewFileForm = () => {
        // Cleans the ref
        this.newFileInputRef.current.value = ''

        // Cleans the state
        this.setState({ newFile: this.getDefaultNewFile() })
    }

    /**
     * Checks if It's editing an existing file
     * @returns True if It's editing, false otherwise
     */
    isEditing = (): boolean => this.state.newFile.id !== null && this.state.newFile.id !== undefined

    /**
     * On success callback during file upload
     * @param responseJSON JSON response with uploaded UserFile data
     */
    uploadSuccess = (responseJSON: UploadResponse) => {
        if (responseJSON.ok) {
            // If everything gone OK, resets the New File Form...
            this.setState({ newFile: this.getDefaultNewFile() })
        } else {
            if (responseJSON.errorMsg) {
                alert(responseJSON.errorMsg)
            } else {
                alertGeneralError()
            }
        }
    }

    /**
     * On error callback during file upload
     * @param error Error object
     */
    uploadError = (error) => {
        error.response.json().then((errorBody: DjangoResponseUploadUserFileError) => {
            console.error(errorBody)
            // NOTE: Parses int as Django Rest Framework returns as string
            // Related issue https://github.com/encode/django-rest-framework/issues/7532
            const internalCode = errorBody && errorBody.file_obj
                ? parseInt(errorBody.file_obj.status.internal_code as unknown as string)
                : null
            if (internalCode === DjangoUserFileUploadErrorInternalCode.INVALID_FORMAT_NON_NUMERIC) {
                alert('The file has an incorrect format: all columns except the index must be numerical data')
            } else {
                alertGeneralError()
            }
        }).catch(alertGeneralError)
        console.log('Error uploading file ->', error)
    }

    /**
     * Uploads a file
     */
    uploadFile = () => {
        if (!this.newFileIsValid()) {
            return
        }

        const myHeaders = getDjangoHeader()
        const newFileForm = this.state.newFile

        const formData = new FormData()
        formData.append('name', newFileForm.newFileNameUser)
        formData.append('description', newFileForm.newFileDescription)

        formData.append('file_type', newFileForm.newFileType.toString())
        if (newFileForm.newTag) {
            formData.append('tag', newFileForm.newTag.toString())
        }

        // Adds the Institution's id, if selected
        newFileForm.institutions.forEach((institutionId) => {
            formData.append('institutions', institutionId.toString())
        })

        // Adds the survival columns tuples, if needed
        if (newFileForm.survivalColumns.length > 0) {
            formData.append('survival_columns', JSON.stringify(newFileForm.survivalColumns))
        }

        // CpG info
        formData.append('is_cpg_site_id', newFileForm.isCpGSiteId.toString())
        if (newFileForm.isCpGSiteId) {
            formData.append('platform', newFileForm.platform.toString())
        }

        // Checks if it is an edition or creation
        this.setState({ uploadingFile: true }, () => {
            if (this.isEditing()) {
                // In case of edition, just call Django REST API as no file upload is required
                const editUrl = `${urlUserFilesCRUD}${newFileForm.id}/`
                this.setState({ uploadingFile: true }, () => {
                    ky.patch(editUrl, { headers: myHeaders, body: formData, timeout: false })
                        .then((response) => {
                            response.json().then(() => {
                                this.setState({ newFile: this.getDefaultNewFile() })
                            }).catch((err) => {
                                console.log('Error parsing JSON ->', err)
                                alertGeneralError()
                            })
                        })
                        .catch(this.uploadError)
                        .finally(() => {
                            this.setState({ uploadingFile: false })
                        })
                })
            } else {
                // In case of creation, an upload in chunks is required
                startUpload({
                    url: urlChunkUpload,
                    urlComplete: urlChunkUploadComplete,
                    headers: myHeaders,
                    file: this.newFileInputRef.current.files[0],
                    completeData: formData,
                    onChunkUpload: (percentDone) => { this.setState({ uploadPercentage: percentDone }) },
                    onUploadStateChange: (currentState) => { this.setState({ uploadState: currentState }) }
                }).then(this.uploadSuccess)
                    .catch((err) => {
                        console.log('Error uploading file ->', err)
                        alertGeneralError()
                    })
                    .finally(() => {
                        this.setState({ uploadingFile: false, uploadPercentage: 0 })
                    })
            }
        })
    }

    /**
     * Generates the modal to confirm a Tag deletion
     * @returns Modal component. Null if no Tag was selected to delete
     */
    getTagDeletionConfirmModals () {
        if (!this.state.selectedTagToDelete) {
            return null
        }

        return (
            <Modal size='small' open={this.state.showDeleteTagModal} onClose={this.handleClose} centered={false}>
                <Header icon='trash' content='Delete tag' />
                <Modal.Content>
                    <p>Are you sure you want to delete the Tag "{this.state.selectedTagToDelete.name}"?</p>
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={this.handleClose}>
                        Cancel
                    </Button>
                    <Button color='red' onClick={this.deleteTag} loading={this.state.deletingTag} disabled={this.state.deletingTag}>
                        Delete
                    </Button>
                </Modal.Actions>
            </Modal>
        )
    }

    /**
     * Generates the modal to confirm a File deletion
     * @returns Modal component. Null if no File was selected to delete
     */
    getFileDeletionConfirmModals () {
        if (!this.state.selectedFileToDelete) {
            return null
        }

        const warningMessage = this.state.selectedFileToDelete.file_type === FileType.CLINICAL
            ? 'This file will be UNLINKED from all the associated experiments'
            : 'All the associated experiments to this file will be DELETED'

        return (
            <Modal size='small' open={this.state.showDeleteFileModal} onClose={this.handleClose} centered={false}>
                <Header icon='trash' content='Delete file' />
                <Modal.Content>
                    Are you sure you want to delete the file <strong>{this.state.selectedFileToDelete.name}</strong>? <strong>{warningMessage}</strong>
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={this.handleClose}>
                        Cancel
                    </Button>
                    <Button color='red' onClick={this.deleteFile} loading={this.state.deletingFile} disabled={this.state.deletingFile}>
                        Delete
                    </Button>
                </Modal.Actions>
            </Modal>
        )
    }

    /**
     * Loads an existing User's file to edit its data
     * @param fileToEdit Selected file to edit
     */
    editFile = (fileToEdit: DjangoUserFile) => {
        this.setState({
            newFile: {
                id: fileToEdit.id,
                newFileName: fileToEdit.name,
                newFileNameUser: fileToEdit.name,
                newFileType: fileToEdit.file_type,
                newFileDescription: fileToEdit.description ?? '',
                newTag: fileToEdit.tag ? fileToEdit.tag.id : null,
                isCpGSiteId: fileToEdit.is_cpg_site_id,
                platform: fileToEdit.platform ? fileToEdit.platform : DjangoMethylationPlatform.PLATFORM_450,
                // We only need the IDs
                institutions: fileToEdit.institutions.map((institution) => institution.id),
                survivalColumns: fileToEdit.survival_columns ?? []
            }
        })
    }

    /**
     * Adds a Survival data tuple
     */
    addSurvivalFormTuple = () => {
        const newFile = this.state.newFile
        const newElement: DjangoSurvivalColumnsTupleSimple = { event_column: '', time_column: '' }
        newFile.survivalColumns.push(newElement)
        this.setState({ newFile })
    }

    /**
     * Removes a Survival data tuple for a CGDSDataset
     * @param idxSurvivalTuple Index in survival tuple
     */
    removeSurvivalFormTuple = (idxSurvivalTuple: number) => {
        const newFile = this.state.newFile
        newFile.survivalColumns.splice(idxSurvivalTuple, 1)
        this.setState({ newFile })
    }

    /**
     * Handles CGDS Dataset form changes in fields of Survival data tuples
     * @param idxSurvivalTuple Index in survival tuple
     * @param name Field of the CGDS dataset to change
     * @param value Value to assign to the specified field
     */
    handleSurvivalFormDatasetChanges = (idxSurvivalTuple: number, name: string, value: any) => {
        const newFile = this.state.newFile
        newFile.survivalColumns[idxSurvivalTuple][name] = value
        this.setState({ newFile })
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
            { name: 'Actions', width: 2 }
        ]
    }

    /**
     * Generates default table's Filters
     * @returns Default object for table's Filters
     */
    getDefaultFilters (): PaginationCustomFilter[] {
        const tagOptions: DropdownItemProps[] = this.state.tags.map((tag) => {
            const id = tag.id as number
            return { key: id, value: id, text: tag.name }
        })

        tagOptions.unshift({ key: 'no_tag', text: 'No tag' })

        const selectVisibilityOptions = [
            { key: 'all', text: 'All', value: 'all' },
            { key: 'private', text: 'Private', value: 'private' }
        ]

        const instsOptions: DropdownItemProps[] = this.state.userInstitutions.map((institution) => {
            return { key: institution.id, value: institution.id, text: institution.name }
        })

        return [
            { label: 'Tag', keyForServer: 'tag', defaultValue: '', placeholder: 'Select an existing Tag', options: tagOptions },
            { label: 'Visibility', keyForServer: 'visibility', defaultValue: 'all', options: selectVisibilityOptions },
            {
                label: 'Institutions',
                keyForServer: 'institutions',
                defaultValue: '',
                options: instsOptions,
                disabledFunction: (actualValues) => actualValues.visibility === 'private'
            },
            { label: 'File type', keyForServer: 'file_type', defaultValue: FileType.ALL, options: getFileTypeSelectOptions() }
        ]
    }

    render () {
        // Tag and File deletion modals
        const tagDeletionConfirmModal = this.getTagDeletionConfirmModals()
        const fileDeletionConfirmModal = this.getFileDeletionConfirmModals()

        const fileTypeOptions = getFileTypeSelectOptions(false)

        const tagOptions: DropdownItemProps[] = this.state.tags.map((tag) => {
            const id = tag.id as number
            return { key: id, value: id, text: tag.name }
        })

        tagOptions.unshift({ key: 'no_tag', text: 'No tag' })

        const institutionsOptions: DropdownItemProps[] = this.state.userInstitutions.map((institution) => {
            return { key: institution.id, value: institution.id, text: institution.name }
        })

        return (
            <Base activeItem='files' wrapperClass='wrapper'>
                {/* Tag deletion modal */}
                {tagDeletionConfirmModal}

                {/* File deletion modal */}
                {fileDeletionConfirmModal}

                <Grid columns={2} padded stackable textAlign='center' divided>
                    <Grid.Column width={3} textAlign='left'>
                        <NewFileForm
                            newFileInputRef={this.newFileInputRef}
                            newFile={this.state.newFile}
                            isEditing={this.isEditing()}
                            fileTypeOptions={fileTypeOptions}
                            tagOptions={tagOptions}
                            institutionsOptions={institutionsOptions}
                            uploadingFile={this.state.uploadingFile}
                            uploadPercentage={this.state.uploadPercentage}
                            uploadState={this.state.uploadState}
                            fileChange={this.fileChange}
                            handleAddFileInputsChange={this.handleAddFileInputsChange}
                            uploadFile={this.uploadFile}
                            newFileIsValid={this.newFileIsValid()}
                            resetNewFileForm={this.resetNewFileForm}
                            handleSurvivalFormDatasetChanges={this.handleSurvivalFormDatasetChanges}
                            addSurvivalFormTuple={this.addSurvivalFormTuple}
                            removeSurvivalFormTuple={this.removeSurvivalFormTuple}
                        />

                        <TagsPanel
                            tags={this.state.tags}
                            newTag={this.state.newTag}
                            addingTag={this.state.addingTag}
                            handleAddTagInputsChange={this.handleAddTagInputsChange}
                            handleKeyDown={this.handleKeyDown}
                            confirmTagDeletion={this.confirmTagDeletion}
                            editTag={this.editTag}
                        />
                    </Grid.Column>

                    {/* Files overview panel */}
                    <Grid.Column
                        id="files-manager-result-column"
                        width={13}
                        textAlign='center'
                    >
                        <PaginatedTable<DjangoUserFile>
                            headerTitle='File Manager'
                            headers={this.getDefaultHeaders()}
                            customFilters={this.getDefaultFilters()}
                            showSearchInput
                            searchLabel='Name'
                            searchPlaceholder='Search by name'
                            urlToRetrieveData={urlUserFilesCRUD}
                            updateWSKey='update_user_files'
                            mapFunction={(userFileRow: DjangoUserFile) => (
                                <Table.Row key={userFileRow.id as number}>
                                    <TableCellWithTitle value={userFileRow.name} />
                                    <TableCellWithTitle value={userFileRow.description} />
                                    <Table.Cell>{getFileTypeName(userFileRow.file_type)}</Table.Cell>
                                    <TableCellWithTitle value={formatDateLocale(userFileRow.upload_date as string, 'L')} />
                                    <Table.Cell>
                                        {userFileRow.institutions.length > 0 &&
                                                <Icon
                                                    name='building'
                                                    size='large'
                                                    title={`This dataset is shared with ${userFileRow.institutions.map((institution) => institution.name).join(', ')}`}
                                                />
                                        }
                                    </Table.Cell>
                                    <Table.Cell><TagLabel tag={userFileRow.tag} /> </Table.Cell>
                                    <Table.Cell>
                                        {/* Shows a download button if specified */}
                                        <Icon
                                            name='cloud download'
                                            color='blue'
                                            className='clickable margin-left-5'
                                            title='Download file'
                                            onClick={() => window.open(`${downloadFileURL}${userFileRow.id}`, '_blank')}
                                        />

                                        {/* Users can modify or delete own files or the ones which belongs to an
                                        Institution which the user is admin of */}
                                        {userFileRow.is_private_or_institution_admin &&
                                            <React.Fragment>
                                                {/* Shows a edit button if specified */}
                                                <Icon
                                                    name='pencil'
                                                    className='clickable margin-left-5'
                                                    color='yellow'
                                                    title='Edit'
                                                    onClick={() => this.editFile(userFileRow)}
                                                />

                                                {/* Shows a delete button if specified */}
                                                <Icon
                                                    name='trash'
                                                    className='clickable margin-left-5'
                                                    color='red'
                                                    title='Delete experiment'
                                                    onClick={() => this.confirmFileDeletion(userFileRow)}
                                                />
                                            </React.Fragment>
                                        }

                                        {/* Extra information: */}
                                        <Icon
                                            name='info'
                                            className='margin-left-2'
                                            color='blue'
                                            title={`The column "${userFileRow.column_used_as_index}" will be used as index`}
                                        />

                                        {/* NaNs warning */}
                                        {userFileRow.contains_nan_values &&
                                            <Icon
                                                name='warning sign'
                                                className='margin-left-2'
                                                color='yellow'
                                                title='The dataset contains NaN values'
                                            />
                                        }
                                    </Table.Cell>
                                </Table.Row>
                            )}
                        />
                    </Grid.Column>
                </Grid>
            </Base>
        )
    }
}

export { NewFile, FilesManager }
