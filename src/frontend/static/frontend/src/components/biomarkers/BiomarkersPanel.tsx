import React from 'react'
import { Base, CurrentUserContext } from '../Base'
import { Grid, Header, Button, Modal, Table } from 'semantic-ui-react'
import { DjangoCGDSDataset, DjangoSurvivalColumnsTupleSimple } from '../../utils/django_interfaces'
import ky from 'ky'
import { getDjangoHeader, alertGeneralError, copyObject, getDefaultGeneralTableControl, generatesOrderingQuery } from '../../utils/util_functions'
import { FileType, NameOfCGDSDataset, GeneralTableControl, WebsocketConfig, ResponseRequestWithPagination, Nullable } from '../../utils/interfaces'
import { WebsocketClientCustom } from '../../websockets/WebsocketClient'
import { Biomarker, BiomarkerType, FormBiomarkerData, MoleculesSectionData, MoleculesTypeOfSelection } from './types'
import { PaginatedTable } from '../common/PaginatedTable'
import { ModalContentBiomarker } from './modalContentBiomarker/ModalContentBiomarker'
import _ from 'lodash'

// URLs defined in biomarkers.html
declare const urlBiomarkersCRUD: string
declare const urlGeneSymbolsFinder: string
declare const urlGenesSymbols: string

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
    tableControl: GeneralTableControl,
    formBiomarker: FormBiomarkerData,
    formBiomarkerModal: boolean,
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
            tableControl: this.getDefaultTableControl(),
            formBiomarker: this.getDefaultFormBiomarker(),
            /*  biomarkersMolecules: this.getDefaultbiomarkersMolecules(), */
            formBiomarkerModal: false
        }
    }
    /**
     * Method that get symbols while user is writing in Select molecules input
     * @param option State of modal
     */

    handleChangeModalState (option:boolean) {
        this.setState(
            {
                ...this.state,
                formBiomarkerModal: option
            }
        )
    }

    /**
     * Method that get symbols while user is writing in Select molecules input
     * @param option State of modal
     */

    handleSelectOptionMolecule= (mol: MoleculesSectionData, section: BiomarkerType, itemSelected: string) => {
        const indexChoosed = this.state.formBiomarker.moleculesSection[section].findIndex((item) => item.value === itemSelected)
        const newFormBiomarkerByMoleculesSection:FormBiomarkerData = {
            ...this.state.formBiomarker
        }
        if (indexChoosed !== -1) {
            newFormBiomarkerByMoleculesSection.moleculesSection[section] = [...newFormBiomarkerByMoleculesSection.moleculesSection[section]].filter(item => JSON.stringify(item.value) !== JSON.stringify(mol.value))
        } else {
            const indexToSelect = this.state.formBiomarker.moleculesSection[section].findIndex((item) => JSON.stringify(item.value) === JSON.stringify(mol.value))
            const sectionModified = [...this.state.formBiomarker.moleculesSection[section]]
            sectionModified[indexToSelect].isValid = true
            sectionModified[indexToSelect].value = itemSelected
            newFormBiomarkerByMoleculesSection.moleculesSection[section] = sectionModified
        }
        return this.setState(
            {
                formBiomarker: newFormBiomarkerByMoleculesSection
            }
        )
    }

    /**
     * Method that get symbols while user is writing in Select molecules input
     * @param query string that is sending to the api
     */

    handleGenesSymbolsFinder = (query:string):void => {
        ky.get(urlGeneSymbolsFinder, { searchParams: { query, limit: 5 } }).then((response) => {
            response.json().then((jsonResponse: string[]) => {
                const formBiomarker = this.state.formBiomarker
                formBiomarker.genesSymbolsFinder = [{
                    key: '0',
                    text: 'Select molecules',
                    value: ''
                }].concat(jsonResponse.map(gen => ({
                    key: gen,
                    text: gen,
                    value: gen
                })))
                this.setState({
                    formBiomarker: formBiomarker
                })
            }).catch((err) => {
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.log('Error getting genes ->', err)
        })
    }
    /**
     * Method that get symbols while user is writing in Select molecules input
     * @param genes array of strings that is sending to the api
     */

    handleGenesSymbols = (genes:string[]):void => {
        const settings = {
            headers: getDjangoHeader(),
            json: {
                genes_ids: genes
            }
        }
        ky.post(urlGenesSymbols, settings).then((response) => {
            response.json().then((jsonResponse: {[key:string]:string[]}) => {
                const genes = Object.entries(jsonResponse)
                const genesArray: MoleculesSectionData[] = []
                genes.forEach(gene => {
                    let condition
                    switch (gene[1].length) {
                        case 0:
                            condition = this.state.formBiomarker.moleculesSection[this.state.formBiomarker.moleculeSelected].concat(genesArray).filter(item => item.value === gene[0])
                            if (!condition.length) {
                                genesArray.push({
                                    isValid: false,
                                    value: gene[0]
                                })
                            }
                            break
                        case 1:
                            condition = this.state.formBiomarker.moleculesSection[this.state.formBiomarker.moleculeSelected].concat(genesArray).filter(item => item.value === gene[1][0])
                            if (!condition.length) {
                                genesArray.push({
                                    isValid: true,
                                    value: gene[1][0]
                                })
                            }
                            break
                        default:
                            condition = this.state.formBiomarker.moleculesSection[this.state.formBiomarker.moleculeSelected].concat(genesArray).filter(item => JSON.stringify(item.value) === JSON.stringify(gene[1]))
                            if (!condition.length) {
                                genesArray.push({
                                    isValid: false,
                                    value: gene[1]
                                })
                            }
                            break
                    }
                })
                const moleculesSection = {
                    ...this.state.formBiomarker.moleculesSection,
                    [this.state.formBiomarker.moleculeSelected]: [...this.state.formBiomarker.moleculesSection[this.state.formBiomarker.moleculeSelected]].concat(genesArray)
                }
                this.setState({
                    formBiomarker: {
                        ...this.state.formBiomarker,
                        moleculesSection: moleculesSection
                    }
                })
            }).catch((err) => {
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.log('Error getting genes ->', err)
        })
    }

    /**
     * Generates a default formBiomarker
     * @returns Default FormBiomarkerData object
     */

    getDefaultFormBiomarker (): FormBiomarkerData {
        return {
            biomarkerName: '',
            biomarkerDescription: '',
            tag: '',
            moleculeSelected: BiomarkerType.MIRNA,
            molecule: 0,
            moleculesTypeOfSelection: MoleculesTypeOfSelection.INPUT,
            moleculesSection: {
                [BiomarkerType.CNA]: [],
                [BiomarkerType.MIRNA]: [],
                [BiomarkerType.METHYLATION]: [],
                [BiomarkerType.MRNA]: []
            },
            genesSymbolsFinder: []
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
     * @param value Value to set to the state moleculeSelected in formBiomarkerState
     */
    handleChangeMoleculeSelected = (value: BiomarkerType) => {
        this.setState({
            formBiomarker: {
                ...this.state.formBiomarker,
                moleculeSelected: value
            }
        })
    }

    /**
     * Handles the table's control filters, select, etc changes
     * @param value Value to set to the state moleculesTypeOfSelection in formBiomarkerState
     */
    handleChangeMoleculeInputSelected = (value: MoleculesTypeOfSelection) => {
        this.setState({
            formBiomarker: {
                ...this.state.formBiomarker,
                moleculesTypeOfSelection: value
            }
        })
    }

    /**
     * Handles the table's control filters, select, etc changes
     * @param value Value to add to the molecules section that is selected
     */

    handleAddMoleculeToSection= (value: MoleculesSectionData) => {
        if (_.find(this.state.formBiomarker.moleculesSection[this.state.formBiomarker.moleculeSelected], (item: MoleculesSectionData) => value.value === item.value)) {
            return
        }
        const moleculesSection = {
            ...this.state.formBiomarker.moleculesSection,
            [this.state.formBiomarker.moleculeSelected]: [...this.state.formBiomarker.moleculesSection[this.state.formBiomarker.moleculeSelected], value]
        }
        this.setState({
            formBiomarker: {
                ...this.state.formBiomarker,
                moleculesSection: moleculesSection
            }
        })
    }

    /**
     * Handles the table's control filters, select, etc changes
     * @param section Value to add to the molecules section that is selected
     * @param molecule molecule to remove of the array
     */
    handleRemoveMolecule= (section:BiomarkerType, molecule: MoleculesSectionData) => {
        const data = _.map(this.state.formBiomarker.moleculesSection[section], (item:MoleculesSectionData) => {
            if (item.value === molecule.value) return
            return item
        })
        this.setState({
            ...this.state,
            formBiomarker: {
                ...this.state.formBiomarker,
                moleculesSection: {
                    ...this.state.formBiomarker.moleculesSection,
                    [section]: _.filter(data, (item: MoleculesSectionData) => item)
                }
            }
        })
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
            this.filterTimeout = window.setTimeout(this.getAllBiomarkers, 300)
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
        this.setState({ tableControl }, () => this.getAllBiomarkers())
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
        this.getAllBiomarkers()
    }

    /**
     * Fetches the CGDS Studies
     */
    getAllBiomarkers = () => {
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
                    functionToExecute: this.getAllBiomarkers
                }
            ]
        }
        this.websocketClient = new WebsocketClientCustom(websocketConfig)
    }

    /**
     * Cleans the FormBiomarkerData
     */
    cleanForm = () => { this.setState({ formBiomarker: this.getDefaultFormBiomarker() }) }

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
                        this.getAllBiomarkers()
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
                    this.getAllBiomarkers()
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
        return JSON.stringify(this.state.formBiomarker) === JSON.stringify(this.getDefaultFormBiomarker())
    }

    render () {
        // Biomarker deletion modal
        const deletionConfirmModal = this.getDeletionConfirmModal()

        return (
            <Base activeItem='biomarkers' wrapperClass='wrapper'>
                {/* Biomarker deletion modal */}
                {deletionConfirmModal}

                <CurrentUserContext.Consumer>
                    { currentUser =>
                        (
                            <>
                                <Grid columns={2} padded stackable textAlign='center' divided>
                                    {/* New Biomarker Panel */}
                                    {currentUser?.is_superuser
                                        ? <Grid.Column width={3} textAlign='left'>
                                            {/* { <NewBiomarkerForm
                                                handleChangeMoleculeSelected={this.handleChangeMoleculeSelected}
                                                biomarkerForm={this.state.formBiomarker}
                                                handleFormChanges={this.handleFormChanges}
                                                handleKeyDown={this.handleKeyDown}
                                                addCGDSDataset={/* this.addCGDSDataset () => {}}
                                                removeCGDSDataset={/* this.removeCGDSDataset () => {}}
                                                handleFormDatasetChanges={this.handleFormDatasetChanges}
                                                addSurvivalFormTuple={this.addSurvivalFormTuple}
                                                removeSurvivalFormTuple={this.removeSurvivalFormTuple}
                                                handleSurvivalFormDatasetChanges={this.handleSurvivalFormDatasetChanges}
                                                cleanForm={this.cleanForm}
                                                isFormEmpty={this.isFormEmpty}
                                                addingOrEditingCGDSStudy={true}
                                                canAddCGDSStudy={ () => true }
                                                addOrEditStudy={ () => {} }
                                                handleChangeInputTypeSelected={this.handleChangeInputTypeSelected}
                                            /> */}
                                            <button onClick={() => this.handleChangeModalState(true)}>openMOdal</button>

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
                                            urlToRetrieveData={urlBiomarkersCRUD}
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
                                <Modal
                                    style={{ width: '90%', height: '90%' }}
                                    onClose={() => this.handleChangeModalState(false)}
                                    onOpen={() => this.handleChangeModalState(true)}
                                    open={this.state.formBiomarkerModal}>
                                    <ModalContentBiomarker
                                        handleChangeMoleculeInputSelected={this.handleChangeMoleculeInputSelected}
                                        handleChangeMoleculeSelected={this.handleChangeMoleculeSelected}
                                        biomarkerForm={this.state.formBiomarker}
                                        handleFormChanges={this.handleFormChanges}
                                        handleKeyDown={this.handleKeyDown}
                                        addCGDSDataset={() => {}}
                                        removeCGDSDataset={() => {}}
                                        handleFormDatasetChanges={this.handleFormDatasetChanges}
                                        addSurvivalFormTuple={this.addSurvivalFormTuple}
                                        removeSurvivalFormTuple={this.removeSurvivalFormTuple}
                                        handleSurvivalFormDatasetChanges={this.handleSurvivalFormDatasetChanges}
                                        cleanForm={this.cleanForm}
                                        isFormEmpty={this.isFormEmpty}
                                        addingOrEditingCGDSStudy={true}
                                        canAddCGDSStudy={this.canAddBiomarker}
                                        addOrEditStudy={() => {}}
                                        handleAddMoleculeToSection={this.handleAddMoleculeToSection}
                                        handleRemoveMolecule={this.handleRemoveMolecule}
                                        handleGenesSymbolsFinder={this.handleGenesSymbolsFinder}
                                        handleGenesSymbols={this.handleGenesSymbols}
                                        handleSelectOptionMolecule={this.handleSelectOptionMolecule}
                                    />
                                </Modal>
                            </>
                        )
                    }
                </CurrentUserContext.Consumer>
            </Base>
        )
    }
}
