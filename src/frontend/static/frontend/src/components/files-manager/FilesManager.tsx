import React from 'react'
import { Base } from '../Base'
import { Grid, Header, Button, Modal, DropdownItemProps, Table, Icon } from 'semantic-ui-react'
import { DjangoTag, DjangoUserFile, TagType, DjangoInstitution, DjangoMethylationPlatform, DjangoResponseUploadUserFileError, DjangoUserFileUploadErrorInternalCode, DjangoSurvivalColumnsTupleSimple, RowHeader } from '../../utils/django_interfaces'
import ky, { HTTPError } from 'ky'
import { getDjangoHeader, alertGeneralError, getFileTypeSelectOptions, formatDateLocale, getFileTypeName, getInputFileCSVColumns } from '../../utils/util_functions'
import { FileType, Nullable } from '../../utils/interfaces'
import { NewFileForm } from './NewFileForm'
import { startUpload, UploadState } from '../../utils/file_uploader'
import { PaginatedTable, PaginationCustomFilter } from '../common/PaginatedTable'
import { TableCellWithTitle } from '../common/TableCellWithTitle'
import { TagLabel } from '../common/TagLabel'
import { TagDropdown } from '../common/TagDropdown'
import { PopupIcons } from '../common/PopupIcons'
import { SwitchPublicButton } from '../common/SwitchPublicButton'
import { DeleteButton } from '../common/DeleteButton'
import { useIntl, IntlShape } from 'react-intl'

/** Structure returned from the chunk upload service. */
type UploadResponse = {
    /** If the upload was successful. */
    ok: boolean,
    /** Error message to show (only set in case ok === false). */
    errorMsg?: string
}

// URLs defined in files.html
declare const urlTagsCRUD: string
declare const urlUserFilesCRUD: string
declare const urlUserInstitutions: string
declare const urlChunkUpload: string
declare const urlChunkUploadComplete: string
declare const downloadFileURL: string
declare const downloadFileHeaders: string

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
    showDeleteFileModal: boolean,
    selectedFileToDelete: Nullable<DjangoUserFile>,
    deletingFile: boolean,
    uploadingFile: boolean,
    newFile: NewFile,
    uploadPercentage: number,
    uploadState: Nullable<UploadState>
    /** posibles values for survival tuple */
    survivalTuplesPossiblesValues: string[],
}

/**
 * Renders a manager to list, add, download and remove source files (which are used to make experiments).
 * Also, this component renders a CRUD of Tags for files
 */
interface FilesManagerProps {
    handleChangeConfirmModalState: (setOption: boolean, headerText: string, contentText: string, onConfirm: () => void) => void
    intl: IntlShape
}

class FilesManager extends React.Component<FilesManagerProps, FilesManagerState> {
    private newFileInputRef: React.RefObject<any> = React.createRef()
    filterTimeout: number | undefined
    abortController = new AbortController()

    constructor (props) {
        super(props)

        this.state = {
            tags: [],
            files: [],
            userInstitutions: [],
            showDeleteFileModal: false,
            selectedFileToDelete: null,
            deletingFile: false,
            uploadingFile: false,
            newFile: this.getDefaultNewFile(),
            uploadPercentage: 0,
            uploadState: null,
            survivalTuplesPossiblesValues: []
        }
    }

    /**
     * Gets the input label translated.
     * @returns Translated label for file input.
     */
    getFileInputLabelTranslated = () => {
        const { intl } = this.props
        return intl.formatMessage({ id: 'files.manager.input.label' })
    }

    /**
     * Generates a default new file form
     * @returns An object with all the field with default values
     */
    getDefaultNewFile = (): NewFile => {
        return {
            newFileName: this.getFileInputLabelTranslated(),
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
        const newFileName = (newFile && newFile.files.length > 0) ? newFile.files[0].name : this.getFileInputLabelTranslated()

        // If there wasn't a File name written by the user, loads the filename in the input
        const newFileNameUser = (newFileForm.newFileNameUser.trim().length > 0) ? newFileForm.newFileNameUser : newFileName
        // Sets the new field values
        newFileForm.newFileName = newFileName
        newFileForm.newFileNameUser = newFileNameUser
        getInputFileCSVColumns(newFile.files[0]).then((headersColumnsNames) => {
            this.setState({ newFile: newFileForm, survivalTuplesPossiblesValues: headersColumnsNames })
        })
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
     * @param e Event
     */
    onUnload = e => { // the method that will be used for both add and remove event
        if (this.state.uploadingFile) {
            e.preventDefault()
            e.returnValue = this.props.intl.formatMessage({ id: 'files.manager.upload.unloadWarning' })
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

    /** Removes event on component unmount and Abort controller if component unmount. */
    componentWillUnmount () {
        window.removeEventListener('beforeunload', this.onUnload)
        this.abortController.abort()
    }

    /**
     * Fetches the Institutions of which the User is part of
     */
    getUserInstitutions () {
        ky.get(urlUserInstitutions, { signal: this.abortController.signal }).then((response) => {
            response.json<DjangoInstitution[]>().then((userInstitutions) => {
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

        ky.get(urlTagsCRUD, { searchParams, signal: this.abortController.signal }).then((response) => {
            response.json<DjangoTag[]>().then((tags) => {
                this.setState({ tags })
            }).catch((err) => {
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.log("Error getting user's tags ->", err)
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
     * Persists a Tag change for an existing UserFile.
     * @param userFile UserFile to update.
     * @param tagId New Tag id, or null to clear it.
     */
    updateUserFileTag = (userFile: DjangoUserFile, tagId: Nullable<number>) => {
        const formData = new FormData()
        formData.append('name', userFile.name)
        formData.append('description', userFile.description ?? '')
        formData.append('file_type', userFile.file_type.toString())
        formData.append('is_cpg_site_id', userFile.is_cpg_site_id.toString())

        if (userFile.is_cpg_site_id && userFile.platform) {
            formData.append('platform', userFile.platform.toString())
        }

        userFile.institutions.forEach((institution) => {
            formData.append('institutions', institution.id.toString())
        })

        if (userFile.survival_columns && userFile.survival_columns.length > 0) {
            formData.append('survival_columns', JSON.stringify(userFile.survival_columns))
        }

        if (tagId !== null) {
            formData.append('tag', tagId.toString())
        }

        ky.patch(`${urlUserFilesCRUD}${userFile.id}/`, {
            headers: getDjangoHeader(),
            body: formData,
            timeout: false
        }).catch((err) => {
            alertGeneralError()
            console.log('Error updating UserFile Tag ->', err)
        })
    }

    /**
     * Closes the deletion confirm modals
     */
    handleClose = () => {
        this.setState({
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
    uploadError = (error: HTTPError) => {
        const { intl } = this.props

        error.response.json<DjangoResponseUploadUserFileError>().then((errorBody) => {
            console.error(errorBody)
            // NOTE: Parses int as Django Rest Framework returns as string
            // Related issue https://github.com/encode/django-rest-framework/issues/7532
            const internalCode = errorBody && errorBody.file_obj
                ? parseInt(errorBody.file_obj.status.internal_code as unknown as string)
                : null

            if (internalCode === DjangoUserFileUploadErrorInternalCode.INVALID_FORMAT_NON_NUMERIC) {
                alert(intl.formatMessage({ id: 'files.manager.error.invalidFormat' }))
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
                startUpload<UploadResponse>({
                    url: urlChunkUpload,
                    urlComplete: urlChunkUploadComplete,
                    headers: myHeaders,
                    file: this.newFileInputRef.current.files[0],
                    completeData: formData,
                    onChunkUpload: (percentDone) => { this.setState({ uploadPercentage: percentDone }) },
                    onUploadStateChange: (currentState) => { this.setState({ uploadState: currentState }) }
                }).then(this.uploadSuccess)
                    .catch((err: HTTPError) => {
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
     * Generates the modal to confirm a File deletion
     * @returns Modal component. Null if no File was selected to delete
     */
    getFileDeletionConfirmModals () {
        const { intl } = this.props

        if (!this.state.selectedFileToDelete) {
            return null
        }

        const warningMessage = this.state.selectedFileToDelete.file_type === FileType.CLINICAL
            ? intl.formatMessage({ id: 'files.manager.delete.file.warning.clinical' })
            : intl.formatMessage({ id: 'files.manager.delete.file.warning.default' })

        return (
            <Modal size='small' open={this.state.showDeleteFileModal} onClose={this.handleClose} centered={false}>
                <Header icon='trash' content={intl.formatMessage({ id: 'files.manager.delete.file.title' })} />
                <Modal.Content>
                    {intl.formatMessage({ id: 'files.manager.delete.file.confirm' }, { fileName: <strong>{this.state.selectedFileToDelete.name}</strong> })} <strong>{warningMessage}</strong>
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={this.handleClose}>
                        {intl.formatMessage({ id: 'common.cancel' })}
                    </Button>
                    <Button color='red' onClick={this.deleteFile} loading={this.state.deletingFile} disabled={this.state.deletingFile}>
                        {intl.formatMessage({ id: 'common.delete' })}
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
        if (fileToEdit.file_type === FileType.CLINICAL) {
            ky.get(`${downloadFileHeaders}${fileToEdit.id}`, { signal: this.abortController.signal }).then((response) => {
                response.json<string[]>().then((fileHeaders) => {
                    // Recieve file separates by , to get array of headers
                    const survivalTuplesPossiblesValues = fileHeaders
                    this.setState({
                        survivalTuplesPossiblesValues,
                        newFile: {
                            id: fileToEdit.id,
                            newFileName: fileToEdit.name,
                            newFileNameUser: fileToEdit.name,
                            newFileType: fileToEdit.file_type,
                            newFileDescription: fileToEdit.description ?? '',
                            newTag: fileToEdit.tag ? fileToEdit.tag.id : null,
                            isCpGSiteId: fileToEdit.is_cpg_site_id,
                            platform: fileToEdit.platform ? fileToEdit.platform : DjangoMethylationPlatform.PLATFORM_450,
                            institutions: fileToEdit.institutions.map((institution) => institution.id),
                            survivalColumns: fileToEdit.survival_columns ?? []
                        }
                    })
                }).catch((err) => {
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                console.log('Error getting file content ->', err)
            })
        } else {
            this.setState({
                survivalTuplesPossiblesValues: [],
                newFile: {
                    id: fileToEdit.id,
                    newFileName: fileToEdit.name,
                    newFileNameUser: fileToEdit.name,
                    newFileType: fileToEdit.file_type,
                    newFileDescription: fileToEdit.description ?? '',
                    newTag: fileToEdit.tag ? fileToEdit.tag.id : null,
                    isCpGSiteId: fileToEdit.is_cpg_site_id,
                    platform: fileToEdit.platform ? fileToEdit.platform : DjangoMethylationPlatform.PLATFORM_450,
                    institutions: fileToEdit.institutions.map((institution) => institution.id),
                    survivalColumns: fileToEdit.survival_columns ?? []
                }
            })
        }
    }

    /**
     * Adds a Survival data tuple
     */
    addSurvivalFormTuple = () => {
        this.setState(prevState => ({
            newFile: {
                ...prevState.newFile,
                survivalColumns: [
                    ...prevState.newFile.survivalColumns,
                    { event_column: '', time_column: '' }
                ],
            },
        }))
    }

    /**
     * Removes a Survival data tuple for a CGDSDataset
     * @param idxSurvivalTuple Index in survival tuple
     */
    removeSurvivalFormTuple = (idxSurvivalTuple: number) => {
        this.setState(prevState => ({
            newFile: {
                ...prevState.newFile,
                survivalColumns: prevState.newFile.survivalColumns.filter((_, i) => i !== idxSurvivalTuple),
            },
        }))
    }

    /**
     * Handles CGDS Dataset form changes in fields of Survival data tuples
     * @param idxSurvivalTuple Index in survival tuple
     * @param name Field of the CGDS dataset to change
     * @param value Value to assign to the specified field
     */
    handleSurvivalFormDatasetChanges = (idxSurvivalTuple: number, name: string, value: any) => {
        this.setState(prevState => ({
            newFile: {
                ...prevState.newFile,
                survivalColumns: prevState.newFile.survivalColumns.map((t, i) =>
                    i === idxSurvivalTuple ? { ...t, [name]: value } : t
                ),
            },
        }))
    }

    /**
     * Generates default table's headers
     * @returns Default object for table's headers
     */
    getDefaultHeaders (): RowHeader<DjangoUserFile>[] {
        const { intl } = this.props
        return [
            { name: intl.formatMessage({ id: 'common.name' }), serverCodeToSort: 'name' },
            { name: intl.formatMessage({ id: 'common.description' }), serverCodeToSort: 'description', width: 3 },
            { name: intl.formatMessage({ id: 'files.manager.table.type' }), serverCodeToSort: 'file_type' },
            { name: intl.formatMessage({ id: 'common.date' }), serverCodeToSort: 'upload_date' },
            { name: intl.formatMessage({ id: 'files.manager.table.institutions' }), width: 2 },
            { name: intl.formatMessage({ id: 'files.manager.table.tag' }), serverCodeToSort: 'tag', width: 2 },
            { name: intl.formatMessage({ id: 'files.manager.table.public' }), width: 1 },
            { name: intl.formatMessage({ id: 'common.actions' }), width: 2 }
        ]
    }

    /**
     * Generates default table's Filters
     * @returns Default object for table's Filters
     */
    getDefaultFilters (): PaginationCustomFilter[] {
        const { intl } = this.props
        const tagOptions: DropdownItemProps[] = this.state.tags.map((tag) => {
            const id = tag.id as number
            return { key: id, value: id, text: tag.name }
        })

        tagOptions.unshift({ key: 'no_tag', text: intl.formatMessage({ id: 'files.manager.filter.tag.noTag' }) })

        const selectVisibilityOptions = [
            { key: 'all', text: intl.formatMessage({ id: 'files.manager.filter.visibility.all' }), value: 'all' },
            { key: 'private', text: intl.formatMessage({ id: 'files.manager.filter.visibility.private' }), value: 'private' }
        ]

        const institutionsOptions: DropdownItemProps[] = this.state.userInstitutions.map((institution) => {
            return { key: institution.id, value: institution.id, text: institution.name }
        })

        return [
            {
                label: intl.formatMessage({ id: 'files.manager.table.tag' }),
                keyForServer: 'tag',
                defaultValue: '',
                placeholder: intl.formatMessage({ id: 'files.manager.filter.tag.placeholder' }),
                options: tagOptions,
                width: 3
            },
            {
                label: intl.formatMessage({ id: 'files.manager.filter.visibility.label' }),
                keyForServer: 'visibility',
                defaultValue: 'all',
                options: selectVisibilityOptions,
                clearable: false,
                width: 2
            },
            {
                label: intl.formatMessage({ id: 'files.manager.filter.institutions.label' }),
                keyForServer: 'institutions',
                defaultValue: '',
                options: institutionsOptions,
                disabledFunction: (actualValues) => actualValues.visibility === 'private',
                width: 3
            },
            {
                label: intl.formatMessage({ id: 'files.manager.filter.fileType.label' }),
                keyForServer: 'file_type',
                defaultValue: FileType.ALL,
                options: getFileTypeSelectOptions(),
                clearable: false,
                width: 2
            }
        ]
    }

    render () {
        // File deletion modal
        const { intl } = this.props
        const fileDeletionConfirmModal = this.getFileDeletionConfirmModals()
        const fileTypeOptions = getFileTypeSelectOptions(false)
        const tagOptions: DropdownItemProps[] = this.state.tags.map((tag) => {
            const id = tag.id as number
            return { key: id, value: id, text: tag.name }
        })

        tagOptions.unshift({ key: 'no_tag', text: intl.formatMessage({ id: 'files.manager.filter.tag.noTag' }) })

        const institutionsOptions: DropdownItemProps[] = this.state.userInstitutions.map((institution) => {
            return { key: institution.id, value: institution.id, text: institution.name }
        })

        return (
            <Base activeItem='files' wrapperClass='wrapper'>
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
                            survivalTuplesPossiblesValues={this.state.survivalTuplesPossiblesValues}
                        />
                    </Grid.Column>

                    {/* Files overview panel */}
                    <Grid.Column
                        id='files-manager-result-column'
                        width={13}
                        textAlign='center'
                    >
                        <PaginatedTable<DjangoUserFile>
                            headerTitle={intl.formatMessage({ id: 'files.manager.title' })}
                            headers={this.getDefaultHeaders()}
                            customFilters={this.getDefaultFilters()}
                            showSearchInput
                            searchLabel={intl.formatMessage({ id: 'common.name' })}
                            searchPlaceholder={intl.formatMessage({ id: 'files.manager.search.placeholder' })}
                            urlToRetrieveData={urlUserFilesCRUD}
                            updateWSKey='update_user_files'
                            mapFunction={(userFileRow: DjangoUserFile) => (
                                <Table.Row key={userFileRow.id as number}>
                                    <TableCellWithTitle value={userFileRow.name} />
                                    <TableCellWithTitle value={userFileRow.description} />
                                    <Table.Cell>{getFileTypeName(userFileRow.file_type)}</Table.Cell>
                                    <TableCellWithTitle value={formatDateLocale(userFileRow.upload_date as string, 'L')} />
                                    <Table.Cell>
                                        {userFileRow.institutions.length > 0 && (
                                            <Icon
                                                name='building'
                                                size='large'
                                                title={intl.formatMessage(
                                                    { id: 'files.manager.tooltip.sharedWith' },
                                                    { list: userFileRow.institutions.map((i) => i.name).join(', ') }
                                                )}
                                            />
                                        )}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <TagDropdown
                                            selectedTagId={userFileRow.tag ? userFileRow.tag.id : null}
                                            trigger={<TagLabel tag={userFileRow.tag} />}
                                            tagType={TagType.FILE}
                                            onTagSelect={(tagId) => this.updateUserFileTag(userFileRow, tagId)}
                                            onTagCreated={() => this.getUserTags()}
                                            onTagEdited={() => this.getUserTags()}
                                            onTagDeleted={(deletedTagId) => {
                                                if (this.state.newFile.newTag === deletedTagId) {
                                                    this.handleAddFileInputsChange('newTag', null)
                                                }

                                                this.getUserTags()
                                            }}
                                        />
                                    </Table.Cell>
                                    <Table.Cell textAlign='center'>
                                        {
                                            userFileRow.is_public
                                                ? (
                                                    <Icon
                                                        title={intl.formatMessage({ id: 'files.manager.tooltip.public' })}
                                                        name='check'
                                                        color='green'
                                                    />
                                                )
                                                : (
                                                    <Icon
                                                        title={intl.formatMessage({ id: 'files.manager.tooltip.privateVisibility' })}
                                                        name='close'
                                                        color='red'
                                                    />
                                                )
                                        }
                                    </Table.Cell>
                                    <Table.Cell>
                                        {/* Extra information: */}
                                        <Icon
                                            name='info'
                                            className='margin-left-2'
                                            color='blue'
                                            title={intl.formatMessage(
                                                { id: 'files.manager.tooltip.indexColumn' },
                                                { columnName: userFileRow.column_used_as_index }
                                            )}
                                        />
                                        {/* Users can modify or delete own files or the ones which belongs to an
                                        Institution which the user is admin of */}
                                        {userFileRow.is_private_or_institution_admin && (
                                            <>
                                                {/* Shows a edit button if specified */}
                                                <Icon
                                                    name='pencil'
                                                    className='clickable margin-left-5'
                                                    color='yellow'
                                                    title={intl.formatMessage({ id: 'common.edit' })}
                                                    onClick={() => this.editFile(userFileRow)}
                                                />
                                            </>
                                        )}

                                        <PopupIcons
                                            content={(
                                                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
                                                    {/* Shows a download button if specified */}
                                                    <Icon
                                                        name='cloud download'
                                                        color='blue'
                                                        className='clickable margin-left-5'
                                                        title={intl.formatMessage({ id: 'files.manager.tooltip.download' })}
                                                        onClick={() => window.open(`${downloadFileURL}${userFileRow.id}`, '_blank')}
                                                    />
                                                    {/* Public switch */}
                                                    <SwitchPublicButton
                                                        publicButtonEntity={{
                                                            id: userFileRow.id as number,
                                                            user: { id: userFileRow.user.id },
                                                            is_public: userFileRow.is_public
                                                        }}
                                                        nameEntity='file'
                                                        publicKey='userFileId'
                                                        handleChangeConfirmModalState={this.props.handleChangeConfirmModalState}
                                                    />
                                                    {/* Shows a delete button if specified */}
                                                    {!userFileRow.is_public && (
                                                        <DeleteButton
                                                            title={intl.formatMessage({ id: 'common.delete' })}
                                                            onClick={() => this.confirmFileDeletion(userFileRow)}
                                                            ownerId={userFileRow.user.id}
                                                        />
                                                    )}
                                                </div>
                                            )}
                                        />

                                        {/* NaNs warning */}
                                        {userFileRow.contains_nan_values && (
                                            <Icon
                                                name='warning sign'
                                                className='margin-left-2'
                                                color='yellow'
                                                title={intl.formatMessage({ id: 'files.manager.tooltip.nanWarning' })}
                                            />
                                        )}
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
/**
 * Functional wrapper to inject intl into the class component.
 */

const FilesManagerWithIntl = (props: Omit<FilesManagerProps, 'intl'>) => {
    const intl = useIntl()
    return <FilesManager {...props} intl={intl} />
}

export { NewFile, FilesManagerWithIntl as FilesManager }
