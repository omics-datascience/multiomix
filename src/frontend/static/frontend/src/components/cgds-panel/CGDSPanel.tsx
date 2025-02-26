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
import { StopExperimentButton } from '../pipeline/all-experiments-view/StopExperimentButton'

// URLs defined in base.html
declare const urlCGDSStudiesCRUD: string

// URLs defined in cgds.html
declare const urlSyncCGDSStudy: string
declare const urlStopCGDSSync: string

/**
 * Component's state
 */
interface CGDSPanelState {
    CGDSStudies: DjangoCGDSStudy[],
    newCGDSStudy: DjangoCGDSStudy,
    sendingSyncRequest: boolean,
    selectedCGDSStudyToSync: Nullable<DjangoCGDSStudy>,
    addingOrEditingCGDSStudy: boolean,
    stoppingCGDSStudy: boolean,
    selectedCGDSStudyToStop: Nullable<DjangoCGDSStudy>,
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

/** Sync strategies. */
enum SyncStrategy {
    /** Creates a new version of the CGDS Study and syncs it. */
    NEW_VERSION = 1,
    /** Updates the current version synchronizing all the datasets. */
    SYNC_ALL = 2,
    /** Updates the current version synchronizing only the datasets with a no successful state. */
    SYNC_ONLY_FAILED = 3
}

/**
 * Renders a CRUD panel for a CGDS Studies and their datasets
 * @returns Component
 */
class CGDSPanel extends React.Component<{}, CGDSPanelState> {
    constructor(props) {
        super(props)

        this.state = {
            CGDSStudies: [],
            newCGDSStudy: this.getDefaultNewCGDSStudy(),
            sendingSyncRequest: false,
            selectedCGDSStudyToSync: null,
            addingOrEditingCGDSStudy: false,
            selectedCGDSStudyToStop: null,
            stoppingCGDSStudy: false
        }
    }

    /**
     * Generates a default new file form
     * @returns An object with all the field with default values
     */
    getDefaultNewCGDSStudy(): DjangoCGDSStudy {
        return {
            name: '',
            description: '',
            url: '',
            url_study_info: '',
            version: null,
            is_last_version: false,
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
    escapeDatasetNullFields(dataset: Nullable<DjangoCGDSDataset>): Nullable<DjangoCGDSDataset> {
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

        this.setState({
            newCGDSStudy: CGDSStudyCopy
        })
    }

    /**
     * Generates a default filter
     * @returns An object with all the field with default values
     */
    getDefaultFilter() {
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

        // If exists an id then we are editing, otherwise It's a new CGDSStudy
        let addOrEditURL, requestMethod

        if (this.state.newCGDSStudy.id) {
            addOrEditURL = `${urlCGDSStudiesCRUD}/${this.state.newCGDSStudy.id}/`
            requestMethod = ky.patch
        } else {
            addOrEditURL = urlCGDSStudiesCRUD
            requestMethod = ky.post
        }

        this.setState({ addingOrEditingCGDSStudy: true }, () => {
            requestMethod(addOrEditURL, { headers: myHeaders, json: this.state.newCGDSStudy, timeout: 20000 })
                .then((response) => {
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

                    console.log('Error adding new CGDSStudy ->', err)
                })
        })
    }

    /**
     * Makes a CGDS Study synchronization request.
     * @param strategy Strategy to use in the synchronization.
     */
    syncStudy = (strategy: SyncStrategy) => {
        if (!this.state.selectedCGDSStudyToSync) {
            return
        }

        this.setState({ sendingSyncRequest: true }, () => {
            // Sets the Request's Headers
            const myHeaders = getDjangoHeader()

            const jsonParams = {
                CGDSStudyId: this.state.selectedCGDSStudyToSync?.id,
                strategy
            }

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
                console.log('Error adding new CGDSStudy ->', err)
            })
        })
    }

    /** Makes a request to stop an CGDSStudy. */
    stopCGDSStudy = () => {
        if (!this.state.selectedCGDSStudyToStop) {
            return
        }

        this.setState({ stoppingCGDSStudy: true }, () => {
            // Sets the Request's Headers
            const myHeaders = getDjangoHeader()
            const studyId = this.state.selectedCGDSStudyToStop?.id as number // This is safe

            ky.get(urlStopCGDSSync, { headers: myHeaders, searchParams: { studyId } }).then((response) => {
                // If OK closes the modal
                if (response.ok) {
                    this.handleClose()
                } else {
                    alertGeneralError()
                }
            }).catch((err) => {
                alertGeneralError()
                console.log('Error stopping CGDSStudy:', err)
            }).finally(() => {
                this.setState({ stoppingCGDSStudy: false })
            })
        })
    }

    /**
     * Handles New CGDSStudy Input Key Press
     * @param e Event of change
     */
    handleKeyDown = (e) => {
        // If pressed Enter key submits the new CGDSStudy
        if (e.which === 13 || e.keyCode === 13) {
            this.addOrEditStudy()
        } else {
            if (e.which === 27 || e.keyCode === 27) {
                this.setState({ newCGDSStudy: this.getDefaultNewCGDSStudy() })
            }
        }
    }

    /**
     * Show a modal to confirm a CGDS Study synchronization
     * @param CGDSStudy Selected CGDS Study to sync.
     */
    confirmCGDSStudySync = (CGDSStudy: DjangoCGDSStudy) => {
        this.setState({ selectedCGDSStudyToSync: CGDSStudy })
    }

    /**
     * Closes the sync/stop confirm modals
     */
    handleClose = () => {
        this.setState({
            selectedCGDSStudyToSync: null,
            selectedCGDSStudyToStop: null
        })
    }

    /**
     * Checks if a CGDSDataset field are valid
     * @param dataset CGDSDataset to check
     * @returns True if all the field are valid for submission, false otherwise
     */
    datasetFieldsAreValid(dataset: DjangoCGDSDataset): boolean {
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
    datasetIsValid(dataset: Nullable<DjangoCGDSDataset>): boolean {
        return dataset === null || (
            dataset !== null &&
            this.datasetFieldsAreValid(dataset)
        )
    }

    /**
     * Clinical data needs both patient and sample data
     * @returns True if clinical data is valid, false otherwise
     */
    clinicalDatasetAreValid(): boolean {
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
     * 
     */
    addSurvivalFormTuple = (datasetName: NameOfCGDSDataset) => {
        const newCGDSStudy = this.state.newCGDSStudy
        const dataset = newCGDSStudy[datasetName]

        if (dataset !== null) {
            const newElement: DjangoSurvivalColumnsTupleSimple = { event_column: '', time_column: '' }

            if (dataset.header_row_index === 0) {
                newElement.event_column = 'OS_STATUS'
                newElement.time_column = 'OS_MONTH'
            }

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
     * Generates the modal to confirm a CGDSStudy sync stopping
     * @returns Modal component. Null if no CGDSStudy was selected to stop
     */
    getCGDSStudyStopConfirmModal() {
        if (!this.state.selectedCGDSStudyToStop) {
            return null
        }

        return (
            <Modal size='small' open={this.state.selectedCGDSStudyToStop !== null} onClose={this.handleClose} centered={false}>
                <Header icon='trash' content='Stop CGDS Study' />
                <Modal.Content>
                    Are you sure you want to stop the Study <strong>{this.state.selectedCGDSStudyToStop.name}</strong>?
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={this.handleClose}>
                        Cancel
                    </Button>
                    <Button color='red' onClick={this.stopCGDSStudy} loading={this.state.stoppingCGDSStudy} disabled={this.state.stoppingCGDSStudy}>
                        Stop
                    </Button>
                </Modal.Actions>
            </Modal>
        )
    }

    /**
     * Generates the modal to confirm a CGDSStudy synchronization
     * @returns Modal component. Null if no CGDSStudy was selected to sync.
     */
    getCGDSStudySyncConfirmModal() {
        if (!this.state.selectedCGDSStudyToSync) {
            return null
        }

        return (
            <Modal size='small' open={this.state.selectedCGDSStudyToSync !== null} onClose={this.handleClose} centered={false}>
                <Header icon='sync' content='Sync CGDS Study' />
                <Modal.Content>
                    <p>
                        Are you sure you want to sync the Study <strong>{this.state.selectedCGDSStudyToSync.name}</strong>? This process <strong>cannot</strong> be undone.
                    </p>

                    <p>
                        The available strategies are the following:

                        <ul>
                            <li>
                                <strong>Sync all:</strong> synchronizes all the data from the CGDS Study. This will delete all the existing data and replace it with the new one in the <strong>current version</strong>.
                            </li>
                            <li>
                                <strong>Sync only failed:</strong> synchronizes only the data of <strong>failed/non-synchronized datasets</strong> from the CGDS Study. This will delete all their existing data and replace it with the new one in the <strong>current version</strong>.
                            </li>
                            <li>
                                <strong>Create new version and sync:</strong> synchronizes all the data from the CGDS Study. This <strong>will create a new version</strong> of the study with the new data, leaving the previous version untouched.
                            </li>
                        </ul>
                    </p>

                    <p>
                        <strong>IMPORTANT: only select <i>Sync all/failed</i> options if there were some critical errors that must be fixed. Synchronizing an existing dataset could lead to inconsistencies with existing experiments using its data. If it is just a new data update from cBioPortal, a new version should be generated.</strong>
                    </p>

                    {!this.state.selectedCGDSStudyToSync.is_last_version &&
                        <p>New versions of a Study can only be done from its last version</p>
                    }
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={this.handleClose}>
                        Cancel
                    </Button>

                    {/* Sync all button */}
                    <Button
                        color='orange'
                        onClick={() => this.syncStudy(SyncStrategy.SYNC_ALL)}
                        loading={this.state.sendingSyncRequest}
                        disabled={this.state.sendingSyncRequest}
                    >
                        Sync all
                    </Button>

                    {/* Sync only failed button */}
                    <Button
                        color='teal'
                        onClick={() => this.syncStudy(SyncStrategy.SYNC_ONLY_FAILED)}
                        loading={this.state.sendingSyncRequest}
                        disabled={this.state.sendingSyncRequest}
                    >
                        Sync only failed
                    </Button>

                    {/* NOTE: only the last version can be sync to prevent errors with the Mongo collection names */}
                    {this.state.selectedCGDSStudyToSync.is_last_version &&
                        <Button
                            color='blue'
                            onClick={() => this.syncStudy(SyncStrategy.NEW_VERSION)}
                            loading={this.state.sendingSyncRequest}
                            disabled={this.state.sendingSyncRequest}
                        >
                            Create new version and sync
                        </Button>
                    }
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

        const headerRowIndex = (datasetName === 'clinical_patient_dataset' || datasetName === 'clinical_sample_dataset') ? 4 : 0
        newCGDSStudy[datasetName] = {
            file_path: '',
            separator: CGDSDatasetSeparator.TAB,
            observation: '',
            header_row_index: headerRowIndex,
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
    getDefaultHeaders(isSuperuser: boolean | undefined): RowHeader<DjangoCGDSStudy>[] {
        const headersOptions: RowHeader<DjangoCGDSStudy>[] = [
            { name: 'Name', serverCodeToSort: 'name', width: 1 },
            { name: 'Description', serverCodeToSort: 'description', width: 2 },
            { name: 'Version', serverCodeToSort: 'version', width: 1, textAlign: 'center' },
            { name: 'Sync', title: 'Sync. Date', serverCodeToSort: 'date_last_synchronization', width: 1, textAlign: 'center' },
            { name: 'mRNA', serverCodeToSort: 'mrna_dataset', width: 1, textAlign: 'center' },
            { name: 'miRNA', serverCodeToSort: 'mirna_dataset', width: 1, textAlign: 'center' },
            { name: 'CNA', serverCodeToSort: 'cna_dataset', width: 1, textAlign: 'center' },
            { name: 'Methy.', title: 'Methylation', serverCodeToSort: 'methylation_dataset', width: 1, textAlign: 'center' },
            { name: 'Clinical P.', title: 'Clinical Patients', serverCodeToSort: 'clinical_patient_dataset', width: 1, textAlign: 'center' },
            { name: 'Clinical S.', title: 'Clinical Samples', serverCodeToSort: 'clinical_sample_dataset', width: 1, textAlign: 'center' },
            { name: 'State', width: 1, textAlign: 'center' }
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
    getCGDSDatasetStateObj(CGDSDataset: DjangoCGDSDataset, isClinicalData: boolean): CGDSStudyAndDatasetStateInfo {
        let stateIcon: CGDSStudyAndDatasetStateInfo

        switch (CGDSDataset.state) {
            case CGDSDatasetSynchronizationState.NOT_SYNCHRONIZED:
                stateIcon = {
                    iconName: 'circle',
                    color: 'grey',
                    loading: false,
                    title: 'The dataset has not yet been synchronized'
                }
                break
            case CGDSDatasetSynchronizationState.SUCCESS: {
                let numberOfRowsAndSamplesMessage: string

                if (isClinicalData) {
                    // Case of clinical data where samples are as rows indexes
                    numberOfRowsAndSamplesMessage = `${CGDSDataset.number_of_rows} samples x ${CGDSDataset.number_of_samples} attributes`
                } else {
                    numberOfRowsAndSamplesMessage = `${CGDSDataset.number_of_rows} molecules x ${CGDSDataset.number_of_samples} samples`
                }

                stateIcon = {
                    iconName: 'circle',
                    color: 'green',
                    loading: false,
                    title: `The dataset was synchronized successfully: ${numberOfRowsAndSamplesMessage}`
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
    generateDatasetCell(CGDSDataset: Nullable<DjangoCGDSDataset>, isClinicalData: boolean = false): React.ReactNode {
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
    generateStudyCell(CGDSStudy: Nullable<CGDSStudySynchronizationState> | undefined): React.ReactNode {
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
    getStateObj(state: CGDSStudySynchronizationState | undefined): CGDSStudyAndDatasetStateInfo {
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
            case CGDSStudySynchronizationState.TIMEOUT_EXCEEDED:
                stateIcon = {
                    iconName: 'wait',
                    color: 'red',
                    loading: false,
                    title: 'The synchronization process has reached the timeout limit. Try again later'
                }
                break
            case CGDSStudySynchronizationState.STOPPED:
                stateIcon = {
                    iconName: 'stop',
                    color: 'red',
                    loading: false,
                    title: 'The synchronization was stopped'
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

    render() {
        // CGDS Study modals
        const cgdsStudyStopConfirmModal = this.getCGDSStudyStopConfirmModal()
        const cgdsStudySyncConfirmModal = this.getCGDSStudySyncConfirmModal()

        return (
            <Base activeItem='cgds' wrapperClass='wrapper'>
                {/* CGDS Study stop modal */}
                {cgdsStudyStopConfirmModal}

                {/* CGDS Study synchronization modal */}
                {cgdsStudySyncConfirmModal}

                <CurrentUserContext.Consumer>
                    {currentUser => {
                        const userIsAdmin = currentUser?.is_superuser

                        return (
                            <Grid columns={2} padded stackable textAlign='center' divided>
                                {/* New CGDS Study Panel */}
                                {userIsAdmin &&
                                    <Grid.Column width={3} textAlign='left'>
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
                                }
                                {/* List of CGDS Studies */}
                                <Grid.Column width={userIsAdmin ? 13 : 16} textAlign='center'>
                                    <PaginatedTable<DjangoCGDSStudy>
                                        headerTitle='cBioPortal'
                                        wsChannelUrl='/ws/admins/'
                                        updateWSKey='update_cgds_studies'
                                        headers={this.getDefaultHeaders(userIsAdmin)}
                                        urlToRetrieveData={urlCGDSStudiesCRUD}
                                        showSearchInput
                                        customFilters={[
                                            { label: 'Only last version', keyForServer: 'only_last_version', defaultValue: true, type: 'checkbox' }
                                        ]}
                                        infoPopupContent='These are the available cBioPortal datasets to launch experiments. During the synchronization process all the duplicated molecules have been remove. There are different icons that indicate the state of each dataset, hover on them to get more information'
                                        mapFunction={(CGDSStudyFileRow: DjangoCGDSStudy) => {
                                            const studyState = this.getStateObj(CGDSStudyFileRow.state)
                                            const isInProcess = CGDSStudyFileRow.state === CGDSStudySynchronizationState.WAITING_FOR_QUEUE ||
                                                CGDSStudyFileRow.state === CGDSStudySynchronizationState.IN_PROCESS

                                            return (
                                                <Table.Row key={CGDSStudyFileRow.id as number}>
                                                    <TableCellWithTitle value={CGDSStudyFileRow.name} className='ellipsis' />
                                                    <TableCellWithTitle value={CGDSStudyFileRow.description} className='ellipsis' />
                                                    <Table.Cell textAlign='center'>{CGDSStudyFileRow.version}</Table.Cell>
                                                    <Table.Cell textAlign='center'>{CGDSStudyFileRow.date_last_synchronization
                                                        ? formatDateLocale(CGDSStudyFileRow.date_last_synchronization)
                                                        : '-'}
                                                    </Table.Cell>
                                                    <Table.Cell textAlign='center'>{this.generateDatasetCell(CGDSStudyFileRow.mrna_dataset)}</Table.Cell>
                                                    <Table.Cell textAlign='center'>{this.generateDatasetCell(CGDSStudyFileRow.mirna_dataset)}</Table.Cell>
                                                    <Table.Cell textAlign='center'>{this.generateDatasetCell(CGDSStudyFileRow.cna_dataset)}</Table.Cell>
                                                    <Table.Cell textAlign='center'>{this.generateDatasetCell(CGDSStudyFileRow.methylation_dataset)}</Table.Cell>
                                                    <Table.Cell textAlign='center'>{this.generateDatasetCell(CGDSStudyFileRow.clinical_patient_dataset, true)}</Table.Cell>
                                                    <Table.Cell textAlign='center'>{this.generateDatasetCell(CGDSStudyFileRow.clinical_sample_dataset, true)}</Table.Cell>
                                                    <Table.Cell textAlign='center'>{this.generateStudyCell(CGDSStudyFileRow.state)}</Table.Cell>
                                                    {userIsAdmin &&
                                                        <Table.Cell>
                                                            {/* Sync button */}
                                                            <Icon
                                                                name='sync alternate'
                                                                color='blue'
                                                                className='clickable'
                                                                title='Sync study'
                                                                loading={studyState.loading}
                                                                disabled={studyState.loading || this.state.sendingSyncRequest}
                                                                onClick={() => this.confirmCGDSStudySync(CGDSStudyFileRow)}
                                                            />

                                                            {/* Edit button */}
                                                            <Icon
                                                                name='pencil'
                                                                color='yellow'
                                                                className='clickable margin-left-30'
                                                                title='Edit study'
                                                                disabled={studyState.loading || this.state.sendingSyncRequest}
                                                                onClick={() => this.editCGDSStudy(CGDSStudyFileRow)}
                                                            />

                                                            {/* Stop button */}
                                                            {isInProcess &&
                                                                <StopExperimentButton
                                                                    title='Stop CGDS study synchronization'
                                                                    onClick={() => this.setState({ selectedCGDSStudyToStop: CGDSStudyFileRow })}
                                                                />
                                                            }
                                                        </Table.Cell>
                                                    }
                                                </Table.Row>
                                            )
                                        }}
                                    />
                                </Grid.Column>
                            </Grid>
                        )
                    }}
                </CurrentUserContext.Consumer>
            </Base>
        )
    }
}

export { CGDSPanel }
