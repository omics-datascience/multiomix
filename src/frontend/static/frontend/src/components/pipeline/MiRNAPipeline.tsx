import React from 'react'
import ky from 'ky'
import {
    Header,
    Grid,
    Segment,
    Button,
    DropdownMenuProps,
    Modal,
    Menu,
    Icon
} from 'semantic-ui-react'
import { UserLastExperiments } from './last-experiments/UserLastExperiments'
import { ExperimentResultView } from './experiment-result/ExperimentResultView'
import { getDjangoHeader, alertGeneralError, getDefaultNewTag, getDefaultExperimentTableControl, generatesOrderingQueryMultiField } from '../../utils/util_functions'
import { DjangoExperiment, DjangoTag, DjangoUserFile, DjangoCGDSStudy, DjangoMRNAxGEMResultRow, ExperimentType, RowHeader } from '../../utils/django_interfaces'
import { FileType, AllExperimentsTableControl, ExperimentInfo, ExperimentResultTableControl, NewExperiment, SourceType, ResponseRequestWithPagination, CorrelationType, Nullable, WebsocketConfig } from '../../utils/interfaces'
import { PipelineForm } from './PipelineForm'
import { AllExperimentsView } from './all-experiments-view/AllExperimentsView'
import { NewExperimentSourceStateName } from './Pipeline'
import { WebsocketClientCustom } from '../../websockets/WebsocketClient'

declare const urlGetExperimentData: string
declare const urlGetFullUserExperiment: string
declare const urlTagsCRUD: string
declare const urlUserExperiments: string
declare const urlStopExperiment: string
declare const maximumNumberOfOpenTabs: number
declare const currentUserId: string

/** Options for tabs: user could view all his experiments or a specific result */
type ActiveTabsOptions = 'all-experiments' | number;

/** To type the RowHeader array */
interface GeneExtraDataFields {
    gene__chromosome: string,
    gene__start: string,
    gene__end: string,
    gene__type: string,
    gene__description: string,
}

type SortingKeyOf = keyof DjangoMRNAxGEMResultRow | keyof GeneExtraDataFields

/** Type of Table headers */
type HeaderRow = (RowHeader<DjangoMRNAxGEMResultRow> | RowHeader<GeneExtraDataFields>)

/**
 * Request search params to get the Experiment's Combinations
 */
type ExperimentResultSearchParams = {
    /** Id of the experiment */
    experiment_id: number,
    /** Page Number */
    page: number,
    /** Page Size */
    page_size: number,
    /** Field to sort */
    ordering: string,
    /** Search by Gene/GEM */
    search: string,
    /** Correlation coefficient filter */
    coefficientThreshold: number,
    /** Correlation type filter */
    correlationType: CorrelationType
}

/**
 * Structure of the tabs to switch in the middle panel
 */
interface ExperimentTab {
    name: string,
    experimentInfo: ExperimentInfo,
    tableControl: ExperimentResultTableControl<SortingKeyOf>
}

type DictOfExperimentTabs = { [experimentTabId: number]: ExperimentTab }

/**
 * Component's props
 */
interface MiRNAPipelineProps {
    newExperiment: NewExperiment,
    gemFileType: FileType
    uploadPercentage: number,
    tags: DjangoTag[],
    // For tag form
    isSelectingTagForNewExperiment: boolean,
    newTagForNewExperiment: DjangoTag
    addingTagForNewExperiment: boolean,
    gettingCommonSamples: boolean,
    numberOfSamplesMRNA: number,
    numberOfSamplesMiRNA: number,
    numberOfSamplesInCommon: number,
    getAllUserExperiments: (retryIfNotFound?: boolean) => void,
    selectTagForNewExperiment: (selectedTagId: any) => void,
    handleKeyDownForNewExperiment: (e) => void,
    handleAddTagInputsChangeForNewExperiment: (name: string, value: any) => void,
    toggleDisplayTagForm: () => void,
    // Rest of parameters
    lastExperiments: DjangoExperiment[],
    gettingExperiments: boolean,
    allExperiments: DjangoExperiment[],
    allExperimentsTableControl: AllExperimentsTableControl,
    gettingAllExperiments: boolean,
    sendingRequest: boolean,
    getUserExperimentsTags: () => void,
    runPipeline: () => void,
    editExperiment: (experiment: DjangoExperiment) => void,
    makeEditExperimentRequest: () => void,
    resetExperimentForm: () => void,
    handleFormInputsChange: (name: string, value) => void,
    handleSortAllExperiments: (headerServerCodeToSort: string) => void,
    handleTableControlChangesAllExperiments: (name: string, value: any, resetPagination?: boolean) => void,
    updateAllExperimentsTables: () => void,
    noDataEntered: () => boolean,
    /** An optional callback to handle changes in source select types */
    handleChangeSourceType: (sourceType: SourceType, sourceStateName: NewExperimentSourceStateName) => void,
    /** Function callback when a new file is selected from OS browser window */
    selectNewFile: (e: Event) => void,
    /** Function callback when a file is selected from Dataset Modal */
    selectUploadedFile: (selectedFile: DjangoUserFile, sourceStateName: NewExperimentSourceStateName) => void,
    /** Function callback when a study is selected from CGDS Modal */
    selectStudy: (selectedStudy: DjangoCGDSStudy, sourceStateName: NewExperimentSourceStateName) => void,
    /** Function callback to handle GEM FileType changes */
    selectGEMFileType: (fileType: FileType) => void
}

/**
 * State of the component
 */
interface MiRNAPipelineState {
    activeTab: ActiveTabsOptions,
    experimentTabs: DictOfExperimentTabs,
    /** ID of the experiment it's assigning a tag */
    experimentWhichIsSelectingTag: Nullable<DjangoExperiment>,
    selectedExperimentToDeleteOrStop: Nullable<DjangoExperiment>,
    showDeleteExperimentModal: boolean,
    showStopExperimentModal: boolean,
    deletingExperiment: boolean,
    stoppingExperiment: boolean,
    newTagForLastExperiment: DjangoTag,
    addingTag: boolean,
    showFollowUpButton: boolean,
    showLastExperiments: boolean
}

/**
 * Renders a form to submit experiments. With Selects for source selection, sliders,
 * checkbox, submit button,, etc
 */
class MiRNAPipeline extends React.Component<MiRNAPipelineProps, MiRNAPipelineState> {
    websocketClient: WebsocketClientCustom
    filterTimeout: number | undefined
    abortController = new AbortController()

    constructor (props: MiRNAPipelineProps) {
        super(props)

        this.initializeWebsocketClient()

        this.state = this.getDefaultState()
    }

    /**
     * Instantiates a Websocket Client
     */
    initializeWebsocketClient () {
        const websocketConfig: WebsocketConfig = {
            channelUrl: `/ws/users/${currentUserId}/`,
            commandsToAttend: [
                {
                    key: 'update_experiments',
                    functionToExecute: this.updateAllExperimentsTabs
                }
            ]
        }
        this.websocketClient = new WebsocketClientCustom(websocketConfig)
    }
    /**
     * Abort controller if component unmount
     */

    componentWillUnmount () {
        this.abortController.abort()
    }

    /**
     * Updates all the tabs. Useful to get new changes when updates some data in form
     * or binds a clinical dataset to an open experiment (i.e. experiment being showed in tab)
     * TODO: maybe is more efficient to implement a custom message to update only the experiment has change
     */
    updateAllExperimentsTabs = () => {
        Object.keys(this.state.experimentTabs).forEach((key) => {
            const experimentTab: ExperimentTab = this.state.experimentTabs[key]
            this.refreshExperimentInfo(experimentTab.experimentInfo.experiment.id)
        })
    }

    /**
     * Generates a default state
     * @returns New default state
     */
    getDefaultState (): MiRNAPipelineState {
        return {
            experimentTabs: {},
            activeTab: 'all-experiments',
            experimentWhichIsSelectingTag: null,
            selectedExperimentToDeleteOrStop: null,
            showDeleteExperimentModal: false,
            showStopExperimentModal: false,
            deletingExperiment: false,
            stoppingExperiment: false,
            newTagForLastExperiment: getDefaultNewTag(),
            addingTag: false,
            showFollowUpButton: false,
            showLastExperiments: false
        }
    }

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

        if (this.state.newTagForLastExperiment.id !== null) {
            addOrEditURL = `${urlTagsCRUD}${this.state.newTagForLastExperiment.id}/`
            requestMethod = ky.patch
        } else {
            addOrEditURL = urlTagsCRUD
            requestMethod = ky.post
        }

        this.setState({ addingTag: true }, () => {
            requestMethod(addOrEditURL, { headers: myHeaders, json: this.state.newTagForLastExperiment }).then((response) => {
                this.setState({ addingTag: false })
                response.json().then((insertedTag: DjangoTag) => {
                    if (insertedTag && insertedTag.id) {
                        // If all is OK, resets the form and gets the User's tag to refresh the list
                        this.setState({ newTagForLastExperiment: getDefaultNewTag() })
                        this.selectTagForLastExperiment(
                            insertedTag.id,
                            this.state.experimentWhichIsSelectingTag as DjangoExperiment
                        )
                        this.props.getUserExperimentsTags()
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
     * Handles New Tag Input changes
     * @param name State field to change
     * @param value Value to assign to the specified field
     */
    handleAddTagInputsChangeForLastExperiment = (name: string, value) => {
        const newTag = this.state.newTagForLastExperiment
        newTag[name] = value
        this.setState({ newTagForLastExperiment: newTag })
    }

    /**
     * Handles New Tag Input Key Press
     * @param e Event of change
     */
    handleKeyDownTagForLastExperiment = (e) => {
        // If pressed Enter key submits the new Tag
        if (e.which === 13 || e.keyCode === 13) {
            this.addOrEditTag()
        } else {
            if (e.which === 27 || e.keyCode === 27) {
                this.setState({ newTagForLastExperiment: getDefaultNewTag() })
            }
        }
    }

    /**
     * Gets a specific tab
     * @param experimentTabId Id of the experiment to get
     * @returns Corresponding ExperimentTab
     */
    getExperimentTab (experimentTabId: number): ExperimentTab {
        return this.state.experimentTabs[experimentTabId]
    }

    /**
     * Handles the table's control filters, select, etc changes for an experiment
     * @param experimentId Id of the experiment to modify its state
     * @param name Name of the state field to modify
     * @param value Value to set to the state field
     * @param resetPagination If true, resets pagination to pageNumber = 1. Useful when the filters change
     */
    handleTableControlChanges = (experimentId: number, name: string, value: any, resetPagination: boolean = true) => {
        // Updates filter information and makes the request again
        const experimentTabs = this.state.experimentTabs
        const tableControl = experimentTabs[experimentId].tableControl
        tableControl[name] = value

        // If pagination reset is required...
        if (resetPagination) {
            tableControl.pageNumber = 1
        }

        // Sets the new state and gets new experiment info
        this.setState({ experimentTabs }, () => {
            clearTimeout(this.filterTimeout)
            this.filterTimeout = window.setTimeout(() => this.getExperimentTableInfo(experimentId), 300)
        })
    }

    /**
     * Sets Low/High precision for a specific tab
     * @param experimentId Id of the experiment to modify its state
     * @param showHighPrecision New state value
     */
    changePrecisionState = (experimentId: number, showHighPrecision: boolean) => {
        const experimentTabs = this.state.experimentTabs
        const tableControl = experimentTabs[experimentId].tableControl
        tableControl.showHighPrecision = showHighPrecision
        this.setState({ experimentTabs })
    }

    /**
     * Fetches an experiment data to visualize it in the table
     * @param experimentId PK of the experiment to fetch the data
     */
    getExperimentTableInfo (experimentId: number) {
        const currentExperimentTab = this.getExperimentTab(experimentId)
        const currentTableControl = currentExperimentTab.tableControl

        // Sets the Request's Parameters
        const searchParams: ExperimentResultSearchParams = {
            experiment_id: experimentId,
            page: currentTableControl.pageNumber,
            page_size: currentTableControl.pageSize,
            search: currentTableControl.textFilter,
            coefficientThreshold: currentTableControl.coefficientThreshold,
            correlationType: currentTableControl.correlationType,
            ordering: generatesOrderingQueryMultiField(currentTableControl.sortFields)
        }

        // Makes the request
        ky.get(urlGetExperimentData, { searchParams, signal: this.abortController.signal }).then((response) => {
            response.json().then((experimentResult: ResponseRequestWithPagination<DjangoMRNAxGEMResultRow>) => {
                const experimentTabs = this.state.experimentTabs
                experimentTabs[experimentId].experimentInfo.rows = experimentResult.results
                experimentTabs[experimentId].experimentInfo.totalRowCount = experimentResult.count

                this.setState({
                    activeTab: experimentId,
                    experimentTabs
                })
            }).catch((err) => {
                alertGeneralError()
                this.closeTab(experimentId)
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            if (!this.abortController.signal.aborted) {
                alertGeneralError()
                this.closeTab(experimentId)
            }

            console.log('Error getting experiment data', err)
        })
    }

    /**
     * Shows/hides the tag selection in experiment list
     * @param experiment ID of the experiment to assign a new Tag
     */
    selectExperimentToAssignTag = (experiment: DjangoExperiment) => {
        // If it's the same ID, it toggles to hide the tag panel, otherwise, selects the new experiment
        const newId = experiment === this.state.experimentWhichIsSelectingTag ? null : experiment
        this.setState({ experimentWhichIsSelectingTag: newId })
    }

    /**
     * Handles sorting on Result View table
     * @param experimentId Id of the experiment to modify its table control
     * @param header HeaderRow of the selected column to send to the server for sorting
     */
    handleSort = (experimentId: number, header: HeaderRow) => {
        // If the user has selected other column for sorting...
        const experimentTabs = this.state.experimentTabs
        const tableControl = experimentTabs[experimentId].tableControl
        const idxColumn = tableControl.sortFields.findIndex(({ field }) => field === header.serverCodeToSort)

        if (idxColumn === -1) {
            tableControl.sortFields.push({
                field: header.serverCodeToSort as SortingKeyOf,
                sortOrderAscendant: false,
                name: header.name
            })
        } else {
            const fieldSorted = tableControl.sortFields[idxColumn]

            if (!fieldSorted.sortOrderAscendant) {
                // If it's the same just change the sort order
                fieldSorted.sortOrderAscendant = !fieldSorted.sortOrderAscendant
                tableControl.sortFields[idxColumn] = fieldSorted
            } else {
                // Otherwise, clean the sorting by this column
                tableControl.sortFields.splice(idxColumn, 1)
            }
        }

        this.setState({ experimentTabs }, () => this.getExperimentTableInfo(experimentId))
    }

    /**
     * Resets filters and sorting of a specific table control
     * @param experiment Experiment to get tab to edit its table control
     */
    resetFiltersAndSorting = (experiment: DjangoExperiment) => {
        const experimentTabs = this.state.experimentTabs
        experimentTabs[experiment.id].tableControl = this.getDefaultTableControl(experiment)
        this.setState({ experimentTabs }, () => this.getExperimentTableInfo(experiment.id))
    }

    /**
     * Resets only filters
     * @param experimentInfo Experiment to get tab to edit its table control
     */
    resetFilters = (experimentInfo: ExperimentInfo) => {
        const experiment = experimentInfo.experiment
        const experimentTabs = this.state.experimentTabs
        const defaultTableControl = this.getDefaultTableControl(experiment)
        // Keeps only the sorting values
        defaultTableControl.sortFields = experimentTabs[experiment.id].tableControl.sortFields
        experimentTabs[experiment.id].tableControl = defaultTableControl
        this.setState({ experimentTabs }, () => this.getExperimentTableInfo(experiment.id))
    }

    /**
     * Resets only sorting
     * @param experiment Experiment to get tab to edit its table control
     */
    resetSorting = (experiment: DjangoExperiment) => {
        const experimentTabs = this.state.experimentTabs
        experimentTabs[experiment.id].tableControl.sortFields = []
        this.setState({ experimentTabs }, () => this.getExperimentTableInfo(experiment.id))
    }

    /**
     * Generates a table control object with default values
     * @param experiment Experiment to get some needed fields
     * @returns Table control object with default values
     */
    getDefaultTableControl (experiment: DjangoExperiment): ExperimentResultTableControl<SortingKeyOf> {
        const tableControl = getDefaultExperimentTableControl<keyof DjangoMRNAxGEMResultRow>()
        // Except the coefficient threshold
        tableControl.coefficientThreshold = experiment.minimum_coefficient_threshold

        // By default shows 50 elements
        tableControl.pageSize = 50

        // By default sorts by correlation descending
        tableControl.sortFields.push({
            field: 'correlation',
            sortOrderAscendant: false,
            name: 'Correlation'
        })

        // Positive correlations by default for CNA experiments, negative ones for the rest
        tableControl.correlationType = experiment.type === ExperimentType.CNA
            ? CorrelationType.POSITIVE
            : CorrelationType.NEGATIVE

        return tableControl
    }

    /**
     * Updates a tab with a fresh data of the experiment
     * @param experimentId Experiment's id to update the corresponding tab
     * @param experiment Experiment object to extract some fields
     * @param callback Optional callback to execute after state update
     */
    updateTab = (experimentId: number, experiment: DjangoExperiment, callback?: (() => void) | undefined) => {
        const experimentTabs = this.state.experimentTabs

        const currentExperiment: ExperimentInfo = {
            experiment,
            rows: [],
            totalRowCount: 0
        }

        // NOTE: uses experiment's id as experiment tab's id
        experimentTabs[experimentId] = {
            name: experiment.name,
            experimentInfo: currentExperiment, //  NOTE: the others fields will be filled when fetch info from backend
            tableControl: this.getDefaultTableControl(experiment)
        }

        this.setState({
            experimentTabs
        }, callback)
    }

    /**
     * Gets new experiment data from the backend to update a tab
     * @param experimentId Experiment's id to retrieve its data
     */
    refreshExperimentInfo = (experimentId: number) => {
        const url = `${urlGetFullUserExperiment}/${experimentId}/`
        ky.get(url, { signal: this.abortController.signal }).then((response) => {
            response.json().then((experiment: DjangoExperiment) => {
                this.updateTab(experimentId, experiment)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            if (!this.abortController.signal.aborted) {
                alertGeneralError()
            }

            console.log('Error getting experiment', err)
        })
    }

    /**
     * Restart filters and table controls and fetches an experiment data to visualize it in the table
     * @param experiment Selected experiment to fetch the data
     */
    seeResult = (experiment: DjangoExperiment) => {
        // If the user raises the maximum number of open tabs allowed, shows an alert
        if (Object.keys(this.state.experimentTabs).length === maximumNumberOfOpenTabs) {
            alert('You have reached the maximum number of open tabs. Please close one and try again.')
            return
        }

        const experimentId = experiment.id

        // If It exists show its tab
        if (this.getExperimentTab(experimentId)) {
            this.showTab(experimentId)
            return
        }

        // Creates a new tab
        this.updateTab(experiment.id, experiment, () => {
            // Once the state is updated...
            this.getExperimentTableInfo(experimentId)
        })
    }

    /**
     * Closes a specific tab
     * @param experimentTabId Id of the tab to be deleted
     */
    closeTab = (experimentTabId: number) => {
        const experimentTabs = this.state.experimentTabs
        delete experimentTabs[experimentTabId] // Deletes the key
        this.setState({ activeTab: 'all-experiments', experimentTabs })
    }

    /**
     * Show a modal to confirm an experiment deletion
     * @param experiment Experiment to delete
     */
    confirmExperimentDeletion = (experiment: DjangoExperiment) => {
        this.setState({
            selectedExperimentToDeleteOrStop: experiment,
            showDeleteExperimentModal: true
        })
    }

    /**
     * Show a modal to confirm an experiment stop
     * @param experiment Experiment to stop
     */
    confirmExperimentStop = (experiment: DjangoExperiment) => {
        this.setState({
            selectedExperimentToDeleteOrStop: experiment,
            showStopExperimentModal: true
        })
    }

    /**
     * Selects a tag to set to an experiment from the LastExperiment list
     * @param selectedTagId Id of the selected tag to set to the experiment
     * @param selectedExperiment Experiment to set the tag
     */
    selectTagForLastExperiment = (selectedTagId: number, selectedExperiment: DjangoExperiment) => {
        const myHeaders = getDjangoHeader()
        const jsonData = {
            // NOTE: name and description has to be sended as it's indicated in Django Serializer
            name: selectedExperiment.name,
            description: selectedExperiment.description,
            tag: selectedTagId
        }
        const url = `${urlUserExperiments}/${selectedExperiment.id}/`
        ky.put(url, { headers: myHeaders, json: jsonData }).then((response) => {
            if (response.ok) {
                this.setState({ experimentWhichIsSelectingTag: null })

                // Refresh the experiments tables
                this.props.updateAllExperimentsTables()
            }
        })
    }

    /**
     * Closes the deletion confirm modal
     */
    handleCloseDelete = () => { this.setState({ showDeleteExperimentModal: false }) }

    /**
     * Closes the stopping confirm modal
     */
    handleCloseStop = () => { this.setState({ showStopExperimentModal: false }) }

    /**
     * Makes a request to delete an Experiment
     */
    deleteExperiment = () => {
        if (this.state.selectedExperimentToDeleteOrStop === null) {
            return
        }

        // Sets the Request's Headers
        const myHeaders = getDjangoHeader()
        const deleteURL = `${urlUserExperiments}/${this.state.selectedExperimentToDeleteOrStop.id}`
        this.setState({ deletingExperiment: true }, () => {
            ky.delete(deleteURL, { headers: myHeaders, timeout: false }).then((response) => {
                // If OK is returned refresh the experiments
                if (response.ok) {
                    this.setState({
                        deletingExperiment: false,
                        showDeleteExperimentModal: false
                    })

                    // Refresh the experiments tables
                    this.props.updateAllExperimentsTables()

                    // If the experiment which was deleted is the same which is being edited, cleans the form
                    if (this.state.selectedExperimentToDeleteOrStop?.id === this.props.newExperiment.id) {
                        this.props.resetExperimentForm()
                    }
                }
            }).catch((err) => {
                this.setState({ deletingExperiment: false })
                alertGeneralError()
                console.log('Error deleting experiment ->', err)
            })
        })
    }

    /**
     * Makes a request to delete an Experiment
     */
    stopExperiment = () => {
        if (this.state.selectedExperimentToDeleteOrStop === null) {
            return
        }

        // Sets the Request's Headers
        const myHeaders = getDjangoHeader()
        const experimentId = this.state.selectedExperimentToDeleteOrStop.id
        this.setState({ stoppingExperiment: true }, () => {
            ky.get(urlStopExperiment, {
                signal: this.abortController.signal,
                headers: myHeaders,
                searchParams: { experimentId }
            }).then((response) => {
                // If OK is returned refresh the experiments
                if (response.ok) {
                    this.setState({
                        stoppingExperiment: false,
                        showStopExperimentModal: false
                    })

                    // Refresh the experiments tables
                    this.props.updateAllExperimentsTables()

                    // If the experiment which was deleted is the same which is being edited, cleans the form
                    if (this.state.selectedExperimentToDeleteOrStop?.id === this.props.newExperiment.id) {
                        this.props.resetExperimentForm()
                    }
                }
            }).catch((err) => {
                if (!this.abortController.signal.aborted) {
                    this.setState({ stoppingExperiment: false })
                    alertGeneralError()
                }

                console.log('Error deleting experiment ->', err)
            })
        })
    }

    /**
     * Generates the modal to confirm an Experiment deletion
     * @returns Modal component. Null if no Experiment was selected to delete
     */
    getExperimentDeletionConfirmModals () {
        if (!this.state.selectedExperimentToDeleteOrStop) {
            return null
        }

        return (
            <Modal size='small' open={this.state.showDeleteExperimentModal} onClose={this.handleCloseDelete} centered={false}>
                <Header icon='trash' content='Delete experiment' />
                <Modal.Content>
                    Are you sure you want to delete the experiment <strong>{this.state.selectedExperimentToDeleteOrStop.name}</strong>?
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={this.handleCloseDelete}>
                        Cancel
                    </Button>
                    <Button color='red' onClick={this.deleteExperiment} loading={this.state.deletingExperiment} disabled={this.state.deletingExperiment}>
                        Delete
                    </Button>
                </Modal.Actions>
            </Modal>
        )
    }

    /**
     * Generates the modal to confirm an Experiment stopping
     * @returns Modal component. Null if no Experiment was selected to stop
     */
    getExperimentStopConfirmModals () {
        if (!this.state.selectedExperimentToDeleteOrStop) {
            return null
        }

        return (
            <Modal size='small' open={this.state.showStopExperimentModal} onClose={this.handleCloseStop} centered={false}>
                <Header icon='stop' content='Stop experiment' />
                <Modal.Content>
                    Are you sure you want to stop the experiment <strong>{this.state.selectedExperimentToDeleteOrStop.name}</strong>?
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={this.handleCloseStop}>
                        Cancel
                    </Button>
                    <Button color='red' onClick={this.stopExperiment} loading={this.state.stoppingExperiment} disabled={this.state.stoppingExperiment}>
                        Stop
                    </Button>
                </Modal.Actions>
            </Modal>
        )
    }

    /**
     * Generate a middle column/panel component
     * @returns Corresponding component
     */
    getCurrentActiveTabContent () {
        if (this.state.activeTab === 'all-experiments') {
            // Shows all experiments table
            return (
                <AllExperimentsView
                    allExperiments={this.props.allExperiments}
                    allExperimentsTableControl={this.props.allExperimentsTableControl}
                    gettingAllExperiments={this.props.gettingAllExperiments}
                    tags={this.props.tags}
                    getAllUserExperiments={this.props.getAllUserExperiments}
                    seeResult={this.seeResult}
                    editExperiment={this.props.editExperiment}
                    confirmExperimentDeletion={this.confirmExperimentDeletion}
                    confirmExperimentStop={this.confirmExperimentStop}
                    handleSortAllExperiments={this.props.handleSortAllExperiments}
                    handleTableControlChangesAllExperiments={this.props.handleTableControlChangesAllExperiments}
                />
            )
        } else {
            const activeExperimentTab = this.getExperimentTab(this.state.activeTab)
            return (
                <ExperimentResultView
                    experimentTabId={activeExperimentTab.experimentInfo.experiment.id}
                    experimentInfo={activeExperimentTab.experimentInfo}
                    tableControl={activeExperimentTab.tableControl}
                    handleTableControlChanges={this.handleTableControlChanges}
                    changePrecisionState={this.changePrecisionState}
                    handleSort={this.handleSort}
                    closeTab={this.closeTab}
                    resetFiltersAndSorting={this.resetFiltersAndSorting}
                    resetFilters={this.resetFilters}
                    resetSorting={this.resetSorting}
                    refreshExperimentInfo={this.refreshExperimentInfo}
                />
            )
        }
    }

    /**
     * Renders Experiment results tabs
     * @returns Menu Items components to switch between contents
     */
    getResultTabs () {
        return Object.entries(this.state.experimentTabs).map((entry) => {
            const [experimentTabId, experimentTab] = entry
            const experimentTabIdInt = Number.parseInt(experimentTabId)
            return (
                <Menu.Item
                    key={experimentTabId}
                    active={this.state.activeTab === experimentTabIdInt}
                    title={experimentTab.name}
                >
                    {/* NOTE: the onClick event is on the div and not the Menu.Item because will cause issues
                    with the onClick of the Icon */}
                    <div className='clickable ellipsis experiment-tab' onClick={() => this.showTab(experimentTabIdInt)}>
                        {experimentTab.name}
                    </div>

                    {/* Close tab button */}
                    <Icon name='times' className='clickable margin-left-5' onClick={() => this.closeTab(experimentTabIdInt)}/>
                </Menu.Item>
            )
        })
    }

    /**
     * Selects a tab to show its content
     * @param selectedTab Selected tab by the user to switch
     */
    showTab (selectedTab: ActiveTabsOptions) { this.setState({ activeTab: selectedTab }) }

    render () {
        const tagOptions: DropdownMenuProps[] = this.props.tags.map((tag) => {
            return { key: tag.name, value: tag.id, text: tag.name }
        })
        tagOptions.unshift({ key: 'no-tag', value: null, text: 'No Tag' })

        const experimentDeletionConfirmModal = this.getExperimentDeletionConfirmModals()
        const experimentStopConfirmModal = this.getExperimentStopConfirmModals()

        const middlePanel = this.getCurrentActiveTabContent()

        // Tabs to choose a specific result table to show
        const resultsTabs = this.getResultTabs()

        return (
            <div>
                {/* Experiment deletion confirm modal */}
                {experimentDeletionConfirmModal}

                {/* Experiment stopping confirm modal */}
                {experimentStopConfirmModal}

                {/* Pipeline */}
                <Segment>
                    <Grid columns={3} stackable textAlign='left' divided>
                        {/* New Experiment panel */}
                        <Grid.Column width={2} textAlign='center'>
                            <PipelineForm
                                newExperiment={this.props.newExperiment}
                                gemFileType={this.props.gemFileType}
                                uploadPercentage={this.props.uploadPercentage}
                                // For new tag
                                isSelectingTagForNewExperiment={this.props.isSelectingTagForNewExperiment}
                                toggleDisplayTagForm={this.props.toggleDisplayTagForm}
                                tagOptions={tagOptions}
                                selectTagForNewExperiment={this.props.selectTagForNewExperiment}
                                newTagForNewExperiment={this.props.newTagForNewExperiment}
                                numberOfSamplesMRNA={this.props.numberOfSamplesMRNA}
                                numberOfSamplesMiRNA={this.props.numberOfSamplesMiRNA}
                                numberOfSamplesInCommon={this.props.numberOfSamplesInCommon}
                                gettingCommonSamples={this.props.gettingCommonSamples}
                                addingTagForNewExperiment={this.props.addingTagForNewExperiment}
                                handleKeyDownForNewExperiment={this.props.handleKeyDownForNewExperiment}
                                handleAddTagInputsChangeForNewExperiment={this.props.handleAddTagInputsChangeForNewExperiment}
                                handleChangeSourceType={this.props.handleChangeSourceType}
                                selectNewFile={this.props.selectNewFile}
                                selectUploadedFile={this.props.selectUploadedFile}
                                selectStudy={this.props.selectStudy}
                                selectGEMFileType={this.props.selectGEMFileType}
                                // Rest of parameters
                                sendingRequest={this.props.sendingRequest}
                                runPipeline={this.props.runPipeline}
                                makeEditExperimentRequest={this.props.makeEditExperimentRequest}
                                handleFormInputsChange={this.props.handleFormInputsChange}
                                resetExperimentForm={this.props.resetExperimentForm}
                                noDataEntered={this.props.noDataEntered}
                            />
                        </Grid.Column>

                        {/* Tabs with all experiments Table or a table with current selected experiment info */}
                        <Grid.Column
                            id="experiment-result-column"
                            width={this.state.showLastExperiments ? 12 : 14}
                            textAlign='center'
                        >
                            <Grid>
                                <Grid.Row columns={2}>
                                    <Grid.Column width={15}>
                                        <Menu className="menu-with-bolder-border">
                                            <Menu.Item
                                                id='all-experiments-tab'
                                                active={this.state.activeTab === 'all-experiments'}
                                                onClick={() => this.showTab('all-experiments')}
                                            >
                                                <strong>All analysis</strong>
                                            </Menu.Item>

                                            {/* The rest of the Experiments' result */}
                                            {resultsTabs}
                                        </Menu>
                                    </Grid.Column>
                                    <Grid.Column width={1}>
                                        <Button
                                            icon
                                            color='blue'
                                            fluid
                                            className='borderless-button full-height'
                                            title={`${this.state.showLastExperiments ? 'Hide' : 'Show'} last analysis`}
                                            onClick={() => this.setState((prev) => (
                                                { showLastExperiments: !prev.showLastExperiments }
                                            ))}
                                        >
                                            <Icon name={this.state.showLastExperiments ? 'chevron right' : 'list ul'}/>
                                        </Button>
                                    </Grid.Column>
                                </Grid.Row>
                                <Grid.Row columns={1}>
                                    <Grid.Column>
                                        {/* Active tab's content */}
                                        {middlePanel}
                                    </Grid.Column>
                                </Grid.Row>
                            </Grid>
                        </Grid.Column>

                        {/* My experiments info */}
                        {this.state.showLastExperiments &&
                            <Grid.Column width={2} textAlign='center'>
                                <UserLastExperiments
                                    seeResult={this.seeResult}
                                    experiments={this.props.lastExperiments}
                                    gettingExperiments={this.props.gettingExperiments}
                                    experimentWhichIsSelectingTag={this.state.experimentWhichIsSelectingTag}
                                    selectExperimentToAssignTag={this.selectExperimentToAssignTag}
                                    tagOptions={tagOptions}
                                    selectTagForLastExperiment={this.selectTagForLastExperiment}
                                    confirmExperimentDeletion={this.confirmExperimentDeletion}
                                    newTag={this.state.newTagForLastExperiment}
                                    addingTag={this.state.addingTag}
                                    handleKeyDown={this.handleKeyDownTagForLastExperiment}
                                    handleAddTagInputsChange={this.handleAddTagInputsChangeForLastExperiment}
                                />
                            </Grid.Column>
                        }
                    </Grid>
                </Segment>
            </div>
        )
    }
}

export { MiRNAPipeline, HeaderRow }
