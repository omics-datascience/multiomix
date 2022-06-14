import React from 'react'
import { Base, CurrentUserContext } from '../Base'
import { Grid, Header, Button, Modal, Table } from 'semantic-ui-react'
import { DjangoCGDSDataset, DjangoSurvivalColumnsTupleSimple } from '../../utils/django_interfaces'
import ky from 'ky'
import { getDjangoHeader, alertGeneralError, copyObject, getDefaultGeneralTableControl, generatesOrderingQuery } from '../../utils/util_functions'
import { FileType, NameOfCGDSDataset, GeneralTableControl, WebsocketConfig, ResponseRequestWithPagination, Nullable } from '../../utils/interfaces'
import { WebsocketClientCustom } from '../../websockets/WebsocketClient'
import { Biomarker } from './types'
import { PaginatedTable } from '../common/PaginatedTable'
import { NewBiomarkerForm } from './NewBiomarkerForm'

// URLs defined in biomarkers.html
declare const urlBiomarkers: string
declare const urlBiomarkersCRUD: string

/**
 * Request search params to get the CGDSStudies' datasets
 */
type CGDSStudiesSearchParams = {
    /** Page Number */
    page: number,
    /** Page Size */
    page_size: number,
    /** Field to sort */
    ordering: string
}

/**
 * Component's state
 */
interface BiomarkersPanelState {
    biomarkers: Biomarker[],
    newBiomarker: Biomarker,
    selectedBiomarkerToDeleteOrSync: Nullable<Biomarker>,
    showDeleteBiomarkerModal: boolean,
    deletingBiomarker: boolean,
    addingOrEditingBiomarker: boolean,
    tableControl: GeneralTableControl
}

/**
 * Renders a CRUD panel for a Biomarker
 * @returns Component
 */
export class BiomarkersPanel extends React.Component<{}, BiomarkersPanelState> {
    filterTimeout: number | undefined;
    websocketClient: WebsocketClientCustom;

    constructor (props) {
        super(props)

        // Initializes the websocket client
        this.initializeWebsocketClient()

        this.state = {
            biomarkers: [],
            newBiomarker: this.getDefaultNewBiomarker(),
            showDeleteBiomarkerModal: false,
            selectedBiomarkerToDeleteOrSync: null,
            deletingBiomarker: false,
            addingOrEditingBiomarker: false,
            tableControl: this.getDefaultTableControl()
        }
    }

    /**
     * Generates a default table control object sorted by name and pageSize = 50
     * @returns Default GeneralTableControl object
     */
    getDefaultTableControl (): GeneralTableControl {
        const defaultTableControl = getDefaultGeneralTableControl()
        return { ...defaultTableControl, sortField: 'name', pageSize: 50 }
    }

    /**
     * Handles the table's control filters, select, etc changes
     * @param name Name of the state field to modify
     * @param value Value to set to the state field
     * @param resetPagination If true, resets pagination to pageNumber = 1. Useful when the filters change
     */
    handleTableControlChanges = (name: string, value: any, resetPagination: boolean = true) => {
        // Updates filter information and makes the request again
        const tableControl = this.state.tableControl
        tableControl[name] = value

        // If pagination reset is required...
        if (resetPagination) {
            tableControl.pageNumber = 1
        }

        // Sets the new state and gets new experiment info
        this.setState({ tableControl }, () => {
            clearTimeout(this.filterTimeout)
            this.filterTimeout = window.setTimeout(this.getCGDSStudies, 300)
        })
    }

    /**
     * Handles sorting on table
     * @param headerServerCodeToSort Server code of the selected column to send to the server for sorting
     */
    handleSort = (headerServerCodeToSort: string) => {
        // If the user has selected other column for sorting...
        const tableControl = this.state.tableControl
        if (this.state.tableControl.sortField !== headerServerCodeToSort) {
            tableControl.sortField = headerServerCodeToSort
            tableControl.sortOrderAscendant = true
        } else {
            // If it's the same just change the sort order
            tableControl.sortOrderAscendant = !tableControl.sortOrderAscendant
        }
        this.setState({ tableControl }, () => this.getCGDSStudies())
    }

    /**
     * Generates a default new file form
     * @returns An object with all the field with default values
     */
    getDefaultNewBiomarker (): Biomarker {
        return {
            id: null,
            name: ''
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
     * Edits a biomarker
     * @param biomarker Biomarker to edit
     */
    editBiomarker = (biomarker: Biomarker) => {
        const biomarkerCopy = copyObject(biomarker)
        this.setState({ newBiomarker: biomarkerCopy })
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
     * When the component has been mounted, It requests for
     * tags and files
     */
    componentDidMount () {
        this.getCGDSStudies()
    }

    /**
     * Fetches the CGDS Studies
     */
    getCGDSStudies = () => {
        const searchParams: CGDSStudiesSearchParams = {
            page: this.state.tableControl.pageNumber,
            page_size: this.state.tableControl.pageSize,
            ordering: generatesOrderingQuery(
                this.state.tableControl.sortField,
                this.state.tableControl.sortOrderAscendant
            )
        }

        ky.get(urlBiomarkersCRUD, { searchParams: searchParams }).then((response) => {
            response.json().then((jsonResponse: ResponseRequestWithPagination<Biomarker>) => {
                const tableControl = this.state.tableControl
                tableControl.totalRowCount = jsonResponse.count
                this.setState({ biomarkers: jsonResponse.results, tableControl })
            }).catch((err) => {
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.log('Error getting studies ->', err)
        })
    }

    /**
     * Selects a new Biomarker to edit
     * @param selectedBiomarker Biomarker to edit
     */
    editTag = (selectedBiomarker: Biomarker) => {
        this.setState({ newBiomarker: copyObject(selectedBiomarker) })
    }

    /**
     * Instantiates a Websocket Client
     */
    initializeWebsocketClient () {
        const websocketConfig: WebsocketConfig = {
            channelUrl: '/ws/admins/',
            commandsToAttend: [
                {
                    key: 'update_cgds_studies',
                    functionToExecute: this.getCGDSStudies
                }
            ]
        }
        this.websocketClient = new WebsocketClientCustom(websocketConfig)
    }

    /**
     * Cleans the new/edit biomarker form
     */
    cleanForm = () => { this.setState({ newBiomarker: this.getDefaultNewBiomarker() }) }

    /**
     * Does a request to add a new Biomarker
     */
    addOrEditBiomarker = () => {
        if (!this.canAddBiomarker()) {
            return
        }

        // Sets the Request's Headers
        const myHeaders = getDjangoHeader()

        // If exists an id then we are editing, otherwise It's a new Tag
        let addOrEditURL, requestMethod
        if (this.state.newBiomarker.id) {
            addOrEditURL = `${urlBiomarkersCRUD}/${this.state.newBiomarker.id}/`
            requestMethod = ky.patch
        } else {
            addOrEditURL = urlBiomarkersCRUD
            requestMethod = ky.post
        }

        this.setState({ addingOrEditingBiomarker: true }, () => {
            requestMethod(addOrEditURL, { headers: myHeaders, json: this.state.newBiomarker }).then((response) => {
                response.json().then((biomarker: Biomarker) => {
                    if (biomarker && biomarker.id) {
                        // If all is OK, resets the form and gets the User's tag to refresh the list
                        this.cleanForm()
                        this.getCGDSStudies()
                    }
                }).catch((err) => {
                    alertGeneralError()
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                alertGeneralError()
                console.log('Error adding new Biomarker ->', err)
            }).finally(() => {
                this.setState({ addingOrEditingBiomarker: false })
            })
        })
    }

    /**
     * Makes a request to delete a Tag
     */
    deleteBiomarker = () => {
        // Sets the Request's Headers
        if (this.state.selectedBiomarkerToDeleteOrSync === null) {
            return
        }

        const myHeaders = getDjangoHeader()
        const deleteURL = `${urlBiomarkersCRUD}/${this.state.selectedBiomarkerToDeleteOrSync.id}`
        this.setState({ deletingBiomarker: true }, () => {
            ky.delete(deleteURL, { headers: myHeaders }).then((response) => {
                // If OK is returned refresh the tags
                if (response.ok) {
                    this.setState({
                        deletingBiomarker: false,
                        showDeleteBiomarkerModal: false
                    })
                    this.getCGDSStudies()
                }
            }).catch((err) => {
                this.setState({ deletingBiomarker: false })
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
            this.addOrEditBiomarker()
        } else {
            if (e.which === 27 || e.keyCode === 27) {
                this.setState({ newBiomarker: this.getDefaultNewBiomarker() })
            }
        }
    }

    /**
     * Show a modal to confirm a Biomarker deletion
     * @param biomarker Selected Biomarker to delete
     */
    confirmBiomarkerDeletion = (biomarker: Biomarker) => {
        this.setState<never>({
            selectedBiomarkerToDeleteOrSync: biomarker,
            showDeleteBiomarkerModal: true
        })
    }

    /**
     * Closes the deletion confirm modals
     */
    handleClose = () => {
        this.setState({ showDeleteBiomarkerModal: false })
    }

    /**
     * Check if can submit the new Biomarker form
     * @returns True if everything is OK, false otherwise
     */
    canAddBiomarker = (): boolean => {
        return !this.state.addingOrEditingBiomarker &&
            this.state.newBiomarker.name.trim().length > 0
    }

    /**
     * Handles Biomarker form changes
     * @param name Name of the state field to modify
     * @param value Value to set to the state field
     */
    handleFormChanges = (name: string, value) => {
        const newBiomarker = this.state.newBiomarker
        newBiomarker[name] = value
        this.setState({ newBiomarker: newBiomarker })
    }

    /**
     * Handles CGDS Dataset form changes
     * @param datasetName Name of the edited CGDS dataset
     * @param name Field of the CGDS dataset to change
     * @param value Value to assign to the specified field
     */
    handleFormDatasetChanges = (datasetName: NameOfCGDSDataset, name: string, value: any) => {
        const newBiomarker = this.state.newBiomarker
        const dataset = newBiomarker[datasetName]
        if (dataset !== null) {
            dataset[name] = value
            this.setState({ newBiomarker: newBiomarker })
        }
    }

    /**
     * Adds a Survival data tuple for a CGDSDataset
     * @param datasetName Name of the edited CGDS dataset
     */
    addSurvivalFormTuple = (datasetName: NameOfCGDSDataset) => {
        const newBiomarker = this.state.newBiomarker
        const dataset = newBiomarker[datasetName]

        if (dataset !== null) {
            const newElement: DjangoSurvivalColumnsTupleSimple = { event_column: '', time_column: '' }
            if (dataset.survival_columns === undefined) {
                dataset.survival_columns = []
            }
            dataset.survival_columns.push(newElement)
            this.setState({ newBiomarker: newBiomarker })
        }
    }

    /**
     * Removes a Survival data tuple for a CGDSDataset
     * @param datasetName Name of the edited CGDS dataset
     * @param idxSurvivalTuple Index in survival tuple
     */
    removeSurvivalFormTuple = (datasetName: NameOfCGDSDataset, idxSurvivalTuple: number) => {
        const newBiomarker = this.state.newBiomarker
        const dataset = newBiomarker[datasetName]
        if (dataset !== null && dataset.survival_columns !== undefined) {
            dataset.survival_columns.splice(idxSurvivalTuple, 1)
            this.setState({ newBiomarker: newBiomarker })
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
        const newBiomarker = this.state.newBiomarker
        const dataset = newBiomarker[datasetName]
        if (dataset !== null && dataset.survival_columns !== undefined) {
            dataset.survival_columns[idxSurvivalTuple][name] = value
            this.setState({ newBiomarker: newBiomarker })
        }
    }

    /**
     * Generates the modal to confirm a biomarker deletion
     * @returns Modal component. Null if no Tag was selected to delete
     */
    getDeletionConfirmModal () {
        if (!this.state.selectedBiomarkerToDeleteOrSync) {
            return null
        }

        return (
            <Modal size='small' open={this.state.showDeleteBiomarkerModal} onClose={this.handleClose} centered={false}>
                <Header icon='trash' content='Delete Biomarker' />
                <Modal.Content>
                    Are you sure you want to delete the Biomarker <strong>{this.state.selectedBiomarkerToDeleteOrSync.name}</strong>?
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={this.handleClose}>
                        Cancel
                    </Button>
                    <Button color='red' onClick={this.deleteBiomarker} loading={this.state.deletingBiomarker} disabled={this.state.deletingBiomarker}>
                        Delete
                    </Button>
                </Modal.Actions>
            </Modal>
        )
    }

    /**
     * Checks if the form is entirely empty. Useful to enable 'Cancel' button
     * @returns True is any of the form's field contains any data. False otherwise
     */
    isFormEmpty = (): boolean => {
        return this.state.newBiomarker.name.trim().length === 0
    }

    render () {
        // Biomarker deletion modal
        const deletionConfirmModal = this.getDeletionConfirmModal()

        return (
            <Base activeItem='cgds'>
                {/* Biomarker deletion modal */}
                {deletionConfirmModal}

                <CurrentUserContext.Consumer>
                    { currentUser =>
                        (
                            <Grid columns={2} padded stackable textAlign='center' divided>
                                {/* New Biomarker Panel */}
                                {currentUser?.is_superuser
                                    ? <Grid.Column width={3} textAlign='left'>
                                        {/*  <NewBiomarkerForm
                                            newBiomarker={this.state.newBiomarker}
                                            handleFormChanges={this.handleFormChanges}
                                            handleKeyDown={this.handleKeyDown}
                                            addingOrEditingBiomarker={this.state.addingOrEditingBiomarker}
                                            addCGDSDataset={this.addCGDSDataset}
                                            removeCGDSDataset={this.removeCGDSDataset}
                                            handleFormDatasetChanges={this.handleFormDatasetChanges}
                                            addSurvivalFormTuple={this.addSurvivalFormTuple}
                                            removeSurvivalFormTuple={this.removeSurvivalFormTuple}
                                            handleSurvivalFormDatasetChanges={this.handleSurvivalFormDatasetChanges}
                                            canAddBiomarker={this.canAddBiomarker}
                                            addOrEditBiomarker={this.addOrEditBiomarker}
                                            cleanForm={this.cleanForm}
                                            isFormEmpty={this.isFormEmpty}
                                        /> */}
                                    </Grid.Column> : null
                                }
                                {/* List of CGDS Studies */}
                                <Grid.Column width={currentUser?.is_superuser ? 13 : 16} textAlign='center'>
                                    <PaginatedTable<Biomarker>
                                        headerTitle='Biomarkers'
                                        headers={[
                                            { name: 'Name', serverCodeToSort: 'name' },
                                            { name: 'Actions' }
                                        ]}
                                        showSearchInput
                                        searchLabel='Name'
                                        searchPlaceholder='Search by name'
                                        urlToRetrieveData={urlBiomarkers}
                                        mapFunction={(diseaseRow: Biomarker) => {
                                            return (
                                                <Table.Row key={diseaseRow.id as number}>
                                                    <Table.Cell>{diseaseRow.name}</Table.Cell>
                                                </Table.Row>
                                            )
                                        }}
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
