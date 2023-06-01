import React from 'react'
import { Base, CurrentUserContext } from '../Base'
import { Grid, Header, Button, Modal, Table, SemanticICONS, SemanticCOLORS, Icon } from 'semantic-ui-react'
import { DjangoCGDSStudy, DjangoCGDSDataset, DjangoSyncCGDSStudyResponseCode, DjangoResponseSyncCGDSStudyResult, DjangoMethylationPlatform, DjangoSurvivalColumnsTupleSimple, DjangoCreateCGDSStudyResponseCode, RowHeader, CGDSStudySynchronizationState, CGDSDatasetSynchronizationState } from '../../utils/django_interfaces'
import ky from 'ky'
import { getDjangoHeader, alertGeneralError, copyObject, formatDateLocale } from '../../utils/util_functions'
import { FileType, CGDSDatasetSeparator, NameOfCGDSDataset, Nullable } from '../../utils/interfaces'
import { NewCGDSStudyForm } from './NewCGDSStudyForm'
import { survivalTupleIsValid } from '../survival/utils'
import { PaginatedTable } from '../common/PaginatedTable'
import { TableCellWithTitle } from '../common/TableCellWithTitle'

// URLs defined in base.html
declare const urlCGDSStudiesCRUD: string

// URLs defined in cgds.html
declare const urlSyncCGDSStudy: string

/**
 * Component's state
 */
interface CGDSPanelState {
    CGDSStudies: DjangoCGDSStudy[],
    newCGDSStudy: DjangoCGDSStudy,
    sendingSyncRequest: boolean,
    selectedCGDSStudyToDeleteOrSync: Nullable<DjangoCGDSStudy>,
    showDeleteCGDSStudyModal: boolean,
    showSyncCGDSStudyModal: boolean,
    deletingCGDSStudy: boolean,
    addingOrEditingCGDSStudy: boolean,
}

/**
 * State icon info
 */
interface CGDSStudyAndDatasetStateInfo {
    iconName: SemanticICONS,
    color: SemanticCOLORS,
    loading: boolean,
    title: string
}

/**
 * Renders a CRUD panel for a CGDS Studies and their datasets
 * @returns Component
 */
class CGDSPanel extends React.Component<{}, CGDSPanelState> {
    constructor (props) {
        super(props)

        this.state = {
            CGDSStudies: [],
            newCGDSStudy: this.getDefaultNewCGDSStudy(),
            showDeleteCGDSStudyModal: false,
            showSyncCGDSStudyModal: false,
            sendingSyncRequest: false,
            selectedCGDSStudyToDeleteOrSync: null,
            deletingCGDSStudy: false,
            addingOrEditingCGDSStudy: false
        }
    }

    /**
     * Generates a default new file form
     * @returns An object with all the field with default values
     */
    getDefaultNewCGDSStudy (): DjangoCGDSStudy {
        return {
            name: '',
            description: '',
            url: '',
            url_study_info: '',
            mrna_dataset: null,
            mirna_dataset: null,
            cna_dataset: null,
            methylation_dataset: null,
            clinical_patient_dataset: null,
            clinical_sample_dataset: null
        }
    }

    /**
     * Escapes nullable fields to avoid React errors
     * @param dataset Dataset to escape
     * @returns Escaped CGDSDataset object
     */
    escapeDatasetNullFields (dataset: Nullable<DjangoCGDSDataset>): Nullable<DjangoCGDSDataset> {
        if (dataset !== null) {
            dataset.observation = dataset.observation ?? ''
        }

        return dataset
    }

    /**
     * Edits a CGDSStudy
     * @param CGDSStudy CGDS Study to edit
     */
    editCGDSStudy = (CGDSStudy: DjangoCGDSStudy) => {
        const CGDSStudyCopy = copyObject(CGDSStudy)

        // Parse optional text fields to prevent React errors because null values
        CGDSStudyCopy.description = CGDSStudyCopy.description ?? ''
        CGDSStudyCopy.url_study_info = CGDSStudyCopy.url_study_info ?? ''
        CGDSStudyCopy.mrna_dataset = this.escapeDatasetNullFields(CGDSStudyCopy.mrna_dataset)
        CGDSStudyCopy.mirna_dataset = this.escapeDatasetNullFields(CGDSStudyCopy.mirna_dataset)
        CGDSStudyCopy.cna_dataset = this.escapeDatasetNullFields(CGDSStudyCopy.cna_dataset)
        CGDSStudyCopy.methylation_dataset = this.escapeDatasetNullFields(CGDSStudyCopy.methylation_dataset)
        CGDSStudyCopy.clinical_patient_dataset = this.escapeDatasetNullFields(CGDSStudyCopy.clinical_patient_dataset)
        CGDSStudyCopy.clinical_sample_dataset = this.escapeDatasetNullFields(CGDSStudyCopy.clinical_sample_dataset)

        this.setState({ newCGDSStudy: CGDSStudyCopy })
    }

    /**
     * Generates a default filter
     * @returns An object with all the field with default values
     */
    getDefaultFilter () {
        return {
            fileType: FileType.ALL,
            tag: null
        }
    }

    /**
     * Selects a new CGDS Study to edit
     * @param selectedCGDSStudy CGDS Study to edit
     */
    editTag = (selectedCGDSStudy: DjangoCGDSStudy) => {
        this.setState({ newCGDSStudy: copyObject(selectedCGDSStudy) })
    }

    /**
     * Cleans the new/edit CGDSStudy form
     */
    cleanForm = () => { this.setState({ newCGDSStudy: this.getDefaultNewCGDSStudy() }) }

    /**
     * Does a request to add a new CGDS Study
     */
    addOrEditStudy = () => {
        if (!this.canAddCGDSStudy()) {
            return
        }

        // Sets the Request's Headers
        const myHeaders = getDjangoHeader()

        // If exists an id then we are editing, otherwise It's a new Tag
        let addOrEditURL, requestMethod
        if (this.state.newCGDSStudy.id) {
            addOrEditURL = `${urlCGDSStudiesCRUD}/${this.state.newCGDSStudy.id}/`
            requestMethod = ky.patch
        } else {
            addOrEditURL = urlCGDSStudiesCRUD
            requestMethod = ky.post
        }

        this.setState({ addingOrEditingCGDSStudy: true }, () => {
            requestMethod(addOrEditURL, { headers: myHeaders, json: this.state.newCGDSStudy }).then((response) => {
                this.setState({ addingOrEditingCGDSStudy: false })
                response.json().then((CGDSStudy: DjangoCGDSStudy) => {
                    if (CGDSStudy && CGDSStudy.id) {
                        // If all is OK, resets the form and gets the User's tag to refresh the list
                        this.cleanForm()
                    }
                }).catch((err) => {
                    alertGeneralError()
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                this.setState({ addingOrEditingCGDSStudy: false })
                if (err.response?.status === 400) {
                    err.response.json().then((errResponse) => {
                        const errData = errResponse.status
                        if (errData.internal_code === DjangoCreateCGDSStudyResponseCode.CGDS_WITH_DUPLICATED_COLLECTION_NAME) {
                            alert(errData.message)
                        } else {
                            alertGeneralError()
                        }
                    }).catch(() => {
                        alertGeneralError()
                    })
                } else {
                    alertGeneralError()
                }
                console.log('Error adding new Tag ->', err)
            })
        })
    }

    /**
     * Makes a CGDS Study synchronization request
     */
    syncStudy = () => {
        this.setState({ sendingSyncRequest: true }, () => {
            // Sets the Request's Headers
            const myHeaders = getDjangoHeader()

            const jsonParams = { CGDSStudyId: this.state.selectedCGDSStudyToDeleteOrSync?.id }

            ky.post(urlSyncCGDSStudy, { headers: myHeaders, json: jsonParams }).then((response) => {
                this.setState({ sendingSyncRequest: false })
                this.handleClose()
                response.json().then((jsonResponse: DjangoResponseSyncCGDSStudyResult) => {
                    switch (jsonResponse.status.code) {
                        case DjangoSyncCGDSStudyResponseCode.CGDS_STUDY_DOES_NOT_EXIST:
                            alert('The Study was not found, refresh the list and try with other study')
                            break
                        case DjangoSyncCGDSStudyResponseCode.NOT_ID_IN_REQUEST:
                        case DjangoSyncCGDSStudyResponseCode.ERROR:
                            alertGeneralError()
                            break
                    }
                }).catch((err) => {
                    alertGeneralError()
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                this.setState({ sendingSyncRequest: false })
                this.handleClose()
                alertGeneralError()
                console.log('Error adding new Tag ->', err)
            })
        })
    }

    /**
     * Makes a request to delete a Tag
     */
    deleteCGDSStudy = () => {
        // Sets the Request's Headers
        if (this.state.selectedCGDSStudyToDeleteOrSync === null) {
            return
        }

        const myHeaders = getDjangoHeader()
        const deleteURL = `${urlCGDSStudiesCRUD}/${this.state.selectedCGDSStudyToDeleteOrSync.id}`
        this.setState({ deletingCGDSStudy: true }, () => {
            ky.delete(deleteURL, { headers: myHeaders }).then((response) => {
                // If OK is returned refresh the tags
                if (response.ok) {
                    this.setState({
                        deletingCGDSStudy: false,
                        showDeleteCGDSStudyModal: false
                    })
                }
            }).catch((err) => {
                this.setState({ deletingCGDSStudy: false })
                alertGeneralError()
                console.log('Error deleting Tag ->', err)
            })
        })
    }

    /**
     * Handles New Tag Input Key Press
     * @param e Event of change
     */
    handleKeyDown = (e) => {
        // If pressed Enter key submits the new Tag
        if (e.which === 13 || e.keyCode === 13) {
            this.addOrEditStudy()
        } else {
            if (e.which === 27 || e.keyCode === 27) {
                this.setState({ newCGDSStudy: this.getDefaultNewCGDSStudy() })
            }
        }
    }

    /**
     * Show a modal to confirm a CGDS Study deletion/synchronization
     * @param CGDSStudy Selected CGDS Study to delete
     * @param isDeletion If true show deletion modal. Otherwise shows sync modal
     */
    confirmCGDSStudyDeletionOrSync = (CGDSStudy: DjangoCGDSStudy, isDeletion: boolean) => {
        const modalField = isDeletion ? 'showDeleteCGDSStudyModal' : 'showSyncCGDSStudyModal'
        this.setState<never>({
            selectedCGDSStudyToDeleteOrSync: CGDSStudy,
            [modalField]: true
        })
    }

    /**
     * Closes the deletion confirm modals
     */
    handleClose = () => {
        this.setState({
            showDeleteCGDSStudyModal: false,
            showSyncCGDSStudyModal: false
        })
    }

    /**
     * Checks if a CGDSDataset field are valid
     * @param dataset CGDSDataset to check
     * @returns True if all the field are valid for submission, false otherwise
     */
    datasetFieldsAreValid (dataset: DjangoCGDSDataset): boolean {
        return dataset.file_path.trim().length > 0 &&
            dataset.separator !== null &&
            (dataset.header_row_index.toString() !== '' && dataset.header_row_index >= 0) &&
            dataset.mongo_collection_name.trim().length > 0
    }

    /**
     * Check if a CGDS Dataset is valid to submit the new CGDS Study form
     * @param dataset Dataset to check
     * @returns True if everything is OK, false otherwise
     */
    datasetIsValid (dataset: Nullable<DjangoCGDSDataset>): boolean {
        return dataset === null || (
            dataset !== null &&
            this.datasetFieldsAreValid(dataset)
        )
    }

    /**
     * Clinical data needs both patient and sample data
     * @returns True if clinical data is valid, false otherwise
     */
    clinicalDatasetAreValid (): boolean {
        const patientDataset = this.state.newCGDSStudy.clinical_patient_dataset
        const sampleDataset = this.state.newCGDSStudy.clinical_sample_dataset

        if (patientDataset === null && sampleDataset === null) {
            return true
        }

        // Check that there aren't invalid survival columns
        const invalidTuples = patientDataset?.survival_columns?.find((survivalTuple) => !survivalTupleIsValid(survivalTuple))
        const survivalDataIsValid = invalidTuples === undefined

        return (
            patientDataset !== null &&
            sampleDataset !== null &&
            this.datasetFieldsAreValid(patientDataset) &&
            this.datasetFieldsAreValid(sampleDataset) &&
            survivalDataIsValid
        )
    }

    /**
     * Check if can submit the new CGDS Study form
     * @returns True if everything is OK, false otherwise
     */
    canAddCGDSStudy = (): boolean => {
        return !this.state.addingOrEditingCGDSStudy &&
            this.state.newCGDSStudy.name.trim().length > 0 &&
            this.state.newCGDSStudy.url.trim().length > 0 &&
            (
                this.datasetIsValid(this.state.newCGDSStudy.mrna_dataset) &&
                this.datasetIsValid(this.state.newCGDSStudy.mirna_dataset) &&
                this.datasetIsValid(this.state.newCGDSStudy.cna_dataset) &&
                this.datasetIsValid(this.state.newCGDSStudy.methylation_dataset) &&
                this.clinicalDatasetAreValid()
            )
    }

    /**
     * Handles CGDS Study form changes
     * @param name Name of the state field to modify
     * @param value Value to set to the state field
     */
    handleFormChanges = (name: string, value) => {
        const newCGDSStudy = this.state.newCGDSStudy
        newCGDSStudy[name] = value
        this.setState({ newCGDSStudy })
    }

    /**
     * Handles CGDS Dataset form changes
     * @param datasetName Name of the edited CGDS dataset
     * @param name Field of the CGDS dataset to change
     * @param value Value to assign to the specified field
     */
    handleFormDatasetChanges = (datasetName: NameOfCGDSDataset, name: string, value: any) => {
        const newCGDSStudy = this.state.newCGDSStudy
        const dataset = newCGDSStudy[datasetName]
        if (dataset !== null) {
            dataset[name] = value
            this.setState({ newCGDSStudy })
        }
    }

    /**
     * Adds a Survival data tuple for a CGDSDataset
     * @param datasetName Name of the edited CGDS dataset
     */
    addSurvivalFormTuple = (datasetName: NameOfCGDSDataset) => {
        const newCGDSStudy = this.state.newCGDSStudy
        const dataset = newCGDSStudy[datasetName]

        if (dataset !== null) {
            const newElement: DjangoSurvivalColumnsTupleSimple = { event_column: '', time_column: '' }
            if (dataset.survival_columns === undefined) {
                dataset.survival_columns = []
            }
            dataset.survival_columns.push(newElement)
            this.setState({ newCGDSStudy })
        }
    }

    /**
     * Removes a Survival data tuple for a CGDSDataset
     * @param datasetName Name of the edited CGDS dataset
     * @param idxSurvivalTuple Index in survival tuple
     */
    removeSurvivalFormTuple = (datasetName: NameOfCGDSDataset, idxSurvivalTuple: number) => {
        const newCGDSStudy = this.state.newCGDSStudy
        const dataset = newCGDSStudy[datasetName]
        if (dataset !== null && dataset.survival_columns !== undefined) {
            dataset.survival_columns.splice(idxSurvivalTuple, 1)
            this.setState({ newCGDSStudy })
        }
    }

    /**
     * Handles CGDS Dataset form changes in fields of Survival data tuples
     * @param datasetName Name of the edited CGDS dataset
     * @param idxSurvivalTuple Index in survival tuple
     * @param name Field of the CGDS dataset to change
     * @param value Value to assign to the specified field
     */
    handleSurvivalFormDatasetChanges = (
        datasetName: NameOfCGDSDataset,
        idxSurvivalTuple: number,
        name: string,
        value: any
    ) => {
        const newCGDSStudy = this.state.newCGDSStudy
        const dataset = newCGDSStudy[datasetName]
        if (dataset !== null && dataset.survival_columns !== undefined) {
            dataset.survival_columns[idxSurvivalTuple][name] = value
            this.setState({ newCGDSStudy })
        }
    }

    /**
     * Generates the modal to confirm a CGDSStudy deletion
     * @returns Modal component. Null if no Tag was selected to delete
     */
    getCGDSStudyDeletionConfirmModal () {
        if (!this.state.selectedCGDSStudyToDeleteOrSync) {
            return null
        }

        return (
            <Modal size='small' open={this.state.showDeleteCGDSStudyModal} onClose={this.handleClose} centered={false}>
                <Header icon='trash' content='Delete CGDS Study' />
                <Modal.Content>
                    Are you sure you want to delete the Study <strong>{this.state.selectedCGDSStudyToDeleteOrSync.name}</strong>?
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={this.handleClose}>
                        Cancel
                    </Button>
                    <Button color='red' onClick={this.deleteCGDSStudy} loading={this.state.deletingCGDSStudy} disabled={this.state.deletingCGDSStudy}>
                        Delete
                    </Button>
                </Modal.Actions>
            </Modal>
        )
    }

    /**
     * Generates the modal to confirm a CGDSStudy synchronization
     * @returns Modal component. Null if no Tag was selected to delete
     */
    getCGDSStudySyncConfirmModal () {
        if (!this.state.selectedCGDSStudyToDeleteOrSync) {
            return null
        }

        return (
            <Modal size='small' open={this.state.showSyncCGDSStudyModal} onClose={this.handleClose} centered={false}>
                <Header icon='sync' content='Sync CGDS Study' />
                <Modal.Content>
                    <p>Are you sure you want to sync the Study <strong>{this.state.selectedCGDSStudyToDeleteOrSync.name}</strong>?</p>

                    <p>This process <strong>cannot</strong> be undone and will synchronize <strong>all</strong> the CGDS datasets related to this study</p>
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={this.handleClose}>
                        Cancel
                    </Button>
                    <Button color='blue' onClick={this.syncStudy} loading={this.state.sendingSyncRequest} disabled={this.state.sendingSyncRequest}>
                        Sync
                    </Button>
                </Modal.Actions>
            </Modal>
        )
    }

    /**
     * Generates a default CGDS dataset to append to the study
     * @param datasetName Name of the dataset to add
     */
    addCGDSDataset = (datasetName: NameOfCGDSDataset) => {
        const newCGDSStudy = this.state.newCGDSStudy
        newCGDSStudy[datasetName] = {
            file_path: '',
            separator: CGDSDatasetSeparator.TAB,
            observation: '',
            header_row_index: 0,
            mongo_collection_name: '',
            is_cpg_site_id: true, // Always is true for CGDS
            platform: DjangoMethylationPlatform.PLATFORM_450
        }
        this.setState({ newCGDSStudy })
    }

    /**
     * Removes a CGDS dataset from a CGDS Study
     * @param datasetName Name of the dataset to remove
     */
    removeCGDSDataset = (datasetName: NameOfCGDSDataset) => {
        const newCGDSStudy = this.state.newCGDSStudy
        newCGDSStudy[datasetName] = null
        this.setState({ newCGDSStudy })
    }

    /**
     * Checks if the form is entirely empty. Useful to enable 'Cancel' button
     * @returns True is any of the form's field contains any data. False otherwise
     */
    isFormEmpty = (): boolean => {
        return this.state.newCGDSStudy.name.trim().length === 0 &&
            this.state.newCGDSStudy.description.trim().length === 0 &&
            this.state.newCGDSStudy.url.trim().length === 0 &&
            this.state.newCGDSStudy.url_study_info.trim().length === 0 &&
            this.state.newCGDSStudy.mrna_dataset === null &&
            this.state.newCGDSStudy.mirna_dataset === null &&
            this.state.newCGDSStudy.cna_dataset === null &&
            this.state.newCGDSStudy.methylation_dataset === null &&
            this.state.newCGDSStudy.clinical_patient_dataset === null &&
            this.state.newCGDSStudy.clinical_sample_dataset === null
    }

    /**
     * Generates default table's headers
     * @param isSuperuser is a superuser or not?
     * @returns Default object for table's headers
     */
    getDefaultHeaders (isSuperuser: boolean | undefined): RowHeader<DjangoCGDSStudy>[] {
        const headersOptions: RowHeader<DjangoCGDSStudy>[] = [
            { name: 'Name', serverCodeToSort: 'name', width: 2 },
            { name: 'Description', serverCodeToSort: 'description', width: 2 },
            { name: 'Sync Date', serverCodeToSort: 'date_last_synchronization', width: 2 },
            { name: 'mRNA', serverCodeToSort: 'mrna_dataset', width: 1 },
            { name: 'miRNA', serverCodeToSort: 'mirna_dataset', width: 1 },
            { name: 'CNA', serverCodeToSort: 'cna_dataset', width: 1 },
            { name: 'Methylation', serverCodeToSort: 'methylation_dataset', width: 1 },
            { name: 'Clinical patients', serverCodeToSort: 'clinical_patient_dataset', width: 1 },
            { name: 'Clinical samples', serverCodeToSort: 'clinical_sample_dataset', width: 1 },
            { name: 'State', width: 1 }
        ]

        if (isSuperuser) {
            headersOptions.push({ name: 'Actions' })
        }

        return headersOptions
    }

    /**
     * Gets info about the state to display in the card
     * @param CGDSDataset CGDSDataset object
     * @param isClinicalData True if the dataset is about clinical data as its data is transposed
     * @returns The corresponding info of the current CGDS Dataset state
     */
    getCGDSDatasetStateObj (CGDSDataset: DjangoCGDSDataset, isClinicalData: boolean): CGDSStudyAndDatasetStateInfo {
        let stateIcon: CGDSStudyAndDatasetStateInfo
        switch (CGDSDataset.state) {
            case CGDSDatasetSynchronizationState.NOT_SYNCHRONIZED:
                stateIcon = {
                    iconName: 'circle',
                    color: 'grey',
                    loading: false,
                    title: 'The Dataset has not yet been synchronized'
                }
                break
            case CGDSDatasetSynchronizationState.SUCCESS: {
                let numberOfRowsAndSamplesMessage: string
                if (isClinicalData) {
                    // Case of clinical data where samples are as rows indexes
                    numberOfRowsAndSamplesMessage = `${CGDSDataset.number_of_rows} samples x ${CGDSDataset.number_of_samples} attributes`
                } else {
                    numberOfRowsAndSamplesMessage = `${CGDSDataset.number_of_rows} rows x ${CGDSDataset.number_of_samples} samples`
                }

                stateIcon = {
                    iconName: 'circle',
                    color: 'green',
                    loading: false,
                    title: `The Dataset was synchronized successfully: ${numberOfRowsAndSamplesMessage}`
                }
            }
                break
            case CGDSDatasetSynchronizationState.FINISHED_WITH_ERROR:
                stateIcon = {
                    iconName: 'circle',
                    color: 'red',
                    loading: false,
                    title: 'The synchronization has finished with errors. See logs and try again'
                }
                break
            case CGDSDatasetSynchronizationState.FILE_DOES_NOT_EXIST:
                stateIcon = {
                    iconName: 'file',
                    color: 'red',
                    loading: false,
                    title: "The file doesn't exist in the tar.gz file. Edit that field and try again"
                }
                break
            case CGDSDatasetSynchronizationState.NO_PATIENT_ID_COLUMN_FOUND:
                stateIcon = {
                    iconName: 'table',
                    color: 'red',
                    loading: false,
                    title: 'The patient id column was not found. The parameter skip rows (i.e. header index) seems to be wrong'
                }
                break
            case CGDSDatasetSynchronizationState.COULD_NOT_SAVE_IN_MONGO:
            default:
                stateIcon = {
                    iconName: 'database',
                    color: 'red',
                    loading: false,
                    title: 'Could not save dataset in Mongo. Is the MongoDB service down?'
                }
                break
        }
        return stateIcon
    }

    /**
     * Renders a Table Cell for a CGDS Dataset of a CGDS Study
     * @param CGDSDataset CGDS Dataset to evaluate
     * @param isClinicalData True if the dataset is about clinical data as its data is transposed
     * @returns JSX element
     */
    generateDatasetCell (CGDSDataset: Nullable<DjangoCGDSDataset>, isClinicalData: boolean = false): React.ReactNode {
        if (CGDSDataset) {
            const datasetState = this.getCGDSDatasetStateObj(CGDSDataset, isClinicalData)
            return (
                <Icon
                    title={datasetState.title}
                    name={datasetState.iconName}
                    color={datasetState.color}
                    loading={datasetState.loading}
                />
            )
        }

        return '-'
    }

    /**
     * Renders a Table Cell for a CGDS study
     * @param CGDSStudy CGDS study to evaluate
     * @returns JSX element
     */
    generateStudyCell (CGDSStudy: Nullable<CGDSStudySynchronizationState> | undefined): React.ReactNode {
        if (CGDSStudy) {
            const studyState = this.getStateObj(CGDSStudy)
            return (
                <Icon
                    title={studyState.title}
                    name={studyState.iconName}
                    color={studyState.color}
                    loading={studyState.loading}
                />
            )
        }

        return '-'
    }

    /**
     * Gets info about the state to display in the card
     * @param state CGDSStudy state
     * @returns The corresponding info of the current study's state
     */
    getStateObj (state: CGDSStudySynchronizationState | undefined): CGDSStudyAndDatasetStateInfo {
        let stateIcon: CGDSStudyAndDatasetStateInfo
        switch (state) {
            case CGDSStudySynchronizationState.NOT_SYNCHRONIZED:
                stateIcon = {
                    iconName: 'circle',
                    color: 'grey',
                    loading: false,
                    title: 'The study has not yet been synchronized'
                }
                break
            case CGDSStudySynchronizationState.COMPLETED:
                stateIcon = {
                    iconName: 'circle',
                    color: 'green',
                    loading: false,
                    title: 'The study was synchronized successfully'
                }
                break
            case CGDSStudySynchronizationState.FINISHED_WITH_ERROR:
                stateIcon = {
                    iconName: 'circle',
                    color: 'red',
                    loading: false,
                    title: 'The synchronization has finished with errors. See logs and try again'
                }
                break
            case CGDSStudySynchronizationState.URL_ERROR:
                stateIcon = {
                    iconName: 'unlink',
                    color: 'red',
                    loading: false,
                    title: 'The URL of this study in unreachable. Edit that field and try again'
                }
                break
            case CGDSStudySynchronizationState.WAITING_FOR_QUEUE:
                stateIcon = {
                    iconName: 'wait',
                    color: 'yellow',
                    loading: false,
                    title: 'The synchronization of this study will start soon'
                }
                break
            case CGDSStudySynchronizationState.IN_PROCESS:
                stateIcon = {
                    iconName: 'sync alternate',
                    color: 'yellow',
                    loading: true,
                    title: 'The study is being synchronized'
                }
                break
            case CGDSStudySynchronizationState.CONNECTION_TIMEOUT_ERROR:
                stateIcon = {
                    iconName: 'wi-fi',
                    color: 'red',
                    loading: false,
                    title: 'cBioPortal is not responding. Try again later'
                }
                break
            case CGDSStudySynchronizationState.READ_TIMEOUT_ERROR:
                stateIcon = {
                    iconName: 'stopwatch',
                    color: 'red',
                    loading: false,
                    title: 'cBioPortal is not sending data. Try again later'
                }
                break
            default:
                stateIcon = {
                    iconName: 'question',
                    color: 'grey',
                    loading: false,
                    title: 'Unknown error. See logs'
                }
                break
        }
        return stateIcon
    }

    render () {
        // CGDS Study deletion modal
        const cgdsStudyDeletionConfirmModal = this.getCGDSStudyDeletionConfirmModal()
        const cgdsStudySyncConfirmModal = this.getCGDSStudySyncConfirmModal()

        return (
            <Base activeItem='cgds' wrapperClass='wrapper'>
                {/* CGDS Study deletion modal */}
                {cgdsStudyDeletionConfirmModal}

                {/* CGDS Study synchronization modal */}
                {cgdsStudySyncConfirmModal}
                <CurrentUserContext.Consumer>
                    { currentUser =>
                        (
                            <Grid columns={2} padded stackable textAlign='center' divided>
                                {/* New CGDS Study Panel */}
                                {currentUser?.is_superuser
                                    ? <Grid.Column width={3} textAlign='left'>
                                        <NewCGDSStudyForm
                                            newCGDSStudy={this.state.newCGDSStudy}
                                            handleFormChanges={this.handleFormChanges}
                                            handleKeyDown={this.handleKeyDown}
                                            addingOrEditingCGDSStudy={this.state.addingOrEditingCGDSStudy}
                                            addCGDSDataset={this.addCGDSDataset}
                                            removeCGDSDataset={this.removeCGDSDataset}
                                            handleFormDatasetChanges={this.handleFormDatasetChanges}
                                            addSurvivalFormTuple={this.addSurvivalFormTuple}
                                            removeSurvivalFormTuple={this.removeSurvivalFormTuple}
                                            handleSurvivalFormDatasetChanges={this.handleSurvivalFormDatasetChanges}
                                            canAddCGDSStudy={this.canAddCGDSStudy}
                                            addOrEditStudy={this.addOrEditStudy}
                                            cleanForm={this.cleanForm}
                                            isFormEmpty={this.isFormEmpty}
                                        />
                                    </Grid.Column>
                                    : null
                                }
                                {/* List of CGDS Studies */}
                                <Grid.Column width={currentUser?.is_superuser ? 13 : 16} textAlign='center'>
                                    <PaginatedTable<DjangoCGDSStudy>
                                        headerTitle='cBioPortal'
                                        wsChannelUrl='/ws/admins/'
                                        updateWSKey='update_cgds_studies'
                                        headers={this.getDefaultHeaders(currentUser?.is_superuser)}
                                        urlToRetrieveData={urlCGDSStudiesCRUD}
                                        infoPopupContent='These are the available cBioPortal datasets to launch experiments, there are different icons that indicate the state of each dataset. Hover on them to get more information'
                                        mapFunction={(CGDSStudyFileRow: DjangoCGDSStudy) => (
                                            <Table.Row key={CGDSStudyFileRow.id as number}>
                                                <TableCellWithTitle value={CGDSStudyFileRow.name} className='ellipsis'/>
                                                <TableCellWithTitle value={CGDSStudyFileRow.description} className='ellipsis'/>
                                                <Table.Cell>{CGDSStudyFileRow.date_last_synchronization
                                                    ? formatDateLocale(CGDSStudyFileRow.date_last_synchronization)
                                                    : '-'}
                                                </Table.Cell>
                                                <Table.Cell>{this.generateDatasetCell(CGDSStudyFileRow.mrna_dataset)}</Table.Cell>
                                                <Table.Cell>{this.generateDatasetCell(CGDSStudyFileRow.mirna_dataset)}</Table.Cell>
                                                <Table.Cell>{this.generateDatasetCell(CGDSStudyFileRow.cna_dataset)}</Table.Cell>
                                                <Table.Cell>{this.generateDatasetCell(CGDSStudyFileRow.methylation_dataset)}</Table.Cell>
                                                <Table.Cell>{this.generateDatasetCell(CGDSStudyFileRow.clinical_patient_dataset, true)}</Table.Cell>
                                                <Table.Cell>{this.generateDatasetCell(CGDSStudyFileRow.clinical_sample_dataset, true)}</Table.Cell>
                                                <Table.Cell>{this.generateStudyCell(CGDSStudyFileRow.state)}</Table.Cell>
                                                {currentUser?.is_superuser &&
                                                    <Table.Cell>
                                                        {/* Sync button */}
                                                        <Icon
                                                            name='sync alternate'
                                                            color='blue'
                                                            className='clickable'
                                                            title='Sync study'
                                                            loading={this.getStateObj(CGDSStudyFileRow.state).loading}
                                                            disabled={this.getStateObj(CGDSStudyFileRow.state).loading || this.state.sendingSyncRequest}
                                                            onClick={() => this.confirmCGDSStudyDeletionOrSync(CGDSStudyFileRow, false)}
                                                        />

                                                        {/* Edit button */}
                                                        <Icon
                                                            name='pencil'
                                                            color='yellow'
                                                            className='clickable margin-left-30'
                                                            title='Edit study'
                                                            disabled={this.getStateObj(CGDSStudyFileRow.state).loading || this.state.sendingSyncRequest}
                                                            onClick={() => this.editCGDSStudy(CGDSStudyFileRow)}
                                                        />
                                                    </Table.Cell>
                                                }
                                            </Table.Row>
                                        )}
                                    />
                                </Grid.Column>
                            </Grid>
                        )
                    }
                </CurrentUserContext.Consumer>
            </Base>
        )
    }
}

export { CGDSPanel }
