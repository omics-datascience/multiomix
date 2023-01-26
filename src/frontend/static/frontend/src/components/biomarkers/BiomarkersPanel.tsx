import React from 'react'
import { Base } from '../Base'
import { Header, Button, Modal, Table, DropdownItemProps, Icon, Confirm, Form } from 'semantic-ui-react'
import { DjangoSurvivalColumnsTupleSimple, DjangoTag, RowHeader, TagType } from '../../utils/django_interfaces'
import ky from 'ky'
import { getDjangoHeader, alertGeneralError, copyObject, getDefaultGeneralTableControl, /* generatesOrderingQuery, */ formatDateLocale } from '../../utils/util_functions'
import { NameOfCGDSDataset, GeneralTableControl, /* WebsocketConfig , FileType , ResponseRequestWithPagination , */ Nullable } from '../../utils/interfaces'
import { WebsocketClientCustom } from '../../websockets/WebsocketClient'
import { Biomarker, BiomarkerType, ConfirmModal, FormBiomarkerData, MoleculesSectionData, MoleculesTypeOfSelection, SaveBiomarkerStructure, SaveMoleculeStructure } from './types'
import { ModalContentBiomarker } from './modalContentBiomarker/ModalContentBiomarker'
import { PaginatedTable, PaginationCustomFilter } from '../common/PaginatedTable'
import { TableCellWithTitle } from '../common/TableCellWithTitle'
import { TagLabel } from '../common/TagLabel'
import { isEqual } from 'lodash/isEqual'
import './../../css/biomarkers.css'
// URLs defined in biomarkers.html
declare const urlBiomarkersCRUD: string
declare const urlTagsCRUD: string
declare const urlGeneSymbolsFinder: string
declare const urlGenesSymbols: string

/** Some flags to validate the Biomarkers form. */
type ValidationForm = {
    haveAmbiguous: boolean,
    haveInvalid: boolean
}

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

/** BiomarkersPanel's state */
interface BiomarkersPanelState {
    biomarkers: Biomarker[],
    newBiomarker: Biomarker,
    selectedBiomarkerToDeleteOrSync: Nullable<Biomarker>,
    showDeleteBiomarkerModal: boolean,
    deletingBiomarker: boolean,
    addingOrEditingBiomarker: boolean,
    tableControl: GeneralTableControl,
    formBiomarker: FormBiomarkerData,
    confirmModal: ConfirmModal
    tags: DjangoTag[],
    isOpenModal: boolean
}

/**
 * Renders a CRUD panel for a Biomarker
 */
export class BiomarkersPanel extends React.Component<{}, BiomarkersPanelState> {
    filterTimeout: number | undefined;
    websocketClient: WebsocketClientCustom;
    constructor (props) {
        super(props)

        this.state = {
            biomarkers: [],
            newBiomarker: this.getDefaultNewBiomarker(),
            showDeleteBiomarkerModal: false,
            selectedBiomarkerToDeleteOrSync: null,
            deletingBiomarker: false,
            addingOrEditingBiomarker: false,
            tableControl: this.getDefaultTableControl(),
            formBiomarker: this.getDefaultFormBiomarker(),
            confirmModal: this.getDefaultConfirmModal(),
            tags: [],
            isOpenModal: false
        }
    }

    /**
     * Generates a default confirm modal structure
     * @returns Default confirmModal object
     */
    getDefaultConfirmModal = (): ConfirmModal => {
        return {
            confirmModal: false,
            headerText: '',
            contentText: '',
            onConfirm: () => console.log('DefaultConfirmModalFunction, this should change during cycle of component')
        }
    }

    handleCancelConfirmModalState () {
        this.setState({
            confirmModal: this.getDefaultConfirmModal()
        })
    }

    /**
     * Changes confirm modal state
     * @param setOption New state of option
     * @param headerText Optional text of header in confirm modal, by default will be empty
     * @param contentText optional text of content in confirm modal, by default will be empty
     * @param onConfirm Modal onConfirm callback
     */
    handleChangeConfirmModalState = (setOption: boolean, headerText: string, contentText: string, onConfirm: Function) => {
        const confirmModal = this.state.confirmModal
        confirmModal.confirmModal = setOption
        confirmModal.headerText = headerText
        confirmModal.contentText = contentText
        confirmModal.onConfirm = onConfirm
        this.setState({ confirmModal })
    }

    /**
     * TODO: document
     * @param molecule TODO: document
     * @param section TODO: document
     * @param itemSelected TODO: document
     */
    handleSelectOptionMolecule = (molecule: MoleculesSectionData, section: BiomarkerType, itemSelected: string) => {
        const indexChosen = this.state.formBiomarker.moleculesSection[section].data.findIndex((item) => item.value === itemSelected)
        const newFormBiomarkerByMoleculesSection: FormBiomarkerData = {
            ...this.state.formBiomarker
        }
        if (indexChosen !== -1) {
            newFormBiomarkerByMoleculesSection.moleculesSection[section].data = [...newFormBiomarkerByMoleculesSection.moleculesSection[section].data].filter(
                (item) => isEqual(item.value, molecule.value)
            )
        } else {
            const indexToSelect = this.state.formBiomarker.moleculesSection[section].data.findIndex(
                (item) => isEqual(item.value, molecule.value)
            )
            const sectionModified = [...this.state.formBiomarker.moleculesSection[section].data]
            sectionModified[indexToSelect].isValid = true
            sectionModified[indexToSelect].value = itemSelected
            newFormBiomarkerByMoleculesSection.moleculesSection[section].data = sectionModified
        }

        this.setState({ formBiomarker: newFormBiomarkerByMoleculesSection })
    }

    /**
     * Method that get symbols while user is writing in Select molecules input
     * @param query string that is sending to the api
     */
    handleGenesSymbolsFinder = (query: string): void => {
        // loading aca
        const formBiomarkerPreLoad = this.state.formBiomarker
        formBiomarkerPreLoad.moleculesSymbolsFinder.isLoading = true
        this.setState({
            formBiomarker: formBiomarkerPreLoad
        })
        ky.get(urlGeneSymbolsFinder, { searchParams: { query, limit: 5 } }).then((response) => {
            response.json().then((jsonResponse: string[]) => {
                const formBiomarker = this.state.formBiomarker
                formBiomarker.moleculesSymbolsFinder.data = jsonResponse.map(gen => ({
                    key: gen,
                    text: gen,
                    value: gen
                }))
                this.setState({
                    formBiomarker: formBiomarker
                })
            }).catch((err) => {
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.log('Error getting genes ->', err)
        }).finally(() => {
            const formBiomarker = this.state.formBiomarker
            formBiomarker.moleculesSymbolsFinder.isLoading = false
            this.setState({ formBiomarker })
        })
    }

    /**
     * Method that removes invalid genes of the sector selected
     * @param sector string of the sector selected to change state
     */
    handleRemoveInvalidGenes = (sector: BiomarkerType): void => {
        const formBiomarker = this.state.formBiomarker
        formBiomarker.moleculesSection[sector].data = this.state.formBiomarker.moleculesSection[sector].data.filter(gen => !(!gen.isValid && !Array.isArray(gen.value)))
        this.setState({
            formBiomarker: formBiomarker
        })
    }

    /**
     * Method that gets symbols while user is writing in Select molecules input
     * @param genes array of strings that is sending to the api
     */
    handleGenesSymbols = (genes: string[]): void => {
        const settings = {
            headers: getDjangoHeader(),
            json: {
                genes_ids: genes
            }
        }

        const moleculesSectionPreload = {
            ...this.state.formBiomarker.moleculesSection,
            [this.state.formBiomarker.moleculeSelected]: {
                isLoading: true,
                data: [...this.state.formBiomarker.moleculesSection[this.state.formBiomarker.moleculeSelected].data]
            }
        }

        this.setState({
            formBiomarker: {
                ...this.state.formBiomarker,
                moleculesSection: moleculesSectionPreload
            }
        })

        ky.post(urlGenesSymbols, settings).then((response) => {
            response.json().then((jsonResponse: { [key: string]: string[] }) => {
                const genes = Object.entries(jsonResponse)
                const genesArray: MoleculesSectionData[] = []

                genes.forEach(gene => {
                    let condition
                    switch (gene[1].length) {
                        case 0:
                            condition = this.state.formBiomarker.moleculesSection[this.state.formBiomarker.moleculeSelected].data.concat(genesArray).filter(item => item.value === gene[0])
                            if (!condition.length) {
                                genesArray.push({
                                    isValid: false,
                                    value: gene[0]
                                })
                            }
                            break
                        case 1:
                            condition = this.state.formBiomarker.moleculesSection[this.state.formBiomarker.moleculeSelected].data.concat(genesArray).filter(item => item.value === gene[1][0])
                            if (!condition.length) {
                                genesArray.push({
                                    isValid: true,
                                    value: gene[1][0]
                                })
                            }
                            break
                        default:
                            condition = this.state.formBiomarker.moleculesSection[this.state.formBiomarker.moleculeSelected].data.concat(genesArray).filter(
                                item => isEqual(item.value, gene[1])
                            )

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
                    [this.state.formBiomarker.moleculeSelected]: {
                        isLoading: false,
                        data: [...this.state.formBiomarker.moleculesSection[this.state.formBiomarker.moleculeSelected].data].concat(genesArray)
                    }
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
            validation: {
                haveAmbiguous: false,
                haveInvalid: false,
                isLoading: false,
                checkBox: false
            },
            moleculesSection: {
                [BiomarkerType.CNA]: {
                    isLoading: false,
                    data: []
                },
                [BiomarkerType.MIRNA]: {
                    isLoading: false,
                    data: []
                },
                [BiomarkerType.METHYLATION]: {
                    isLoading: false,
                    data: []
                },
                [BiomarkerType.MRNA]: {
                    isLoading: false,
                    data: []
                }
            },
            moleculesSymbolsFinder: {
                isLoading: false,
                data: []
            }
        }
    }

    /**
     * Updates checkbox status
     * @param value new value to set
     */
    handleChangeCheckBox = (value: boolean) => {
        const formBiomarker = this.state.formBiomarker
        formBiomarker.validation.checkBox = value
        this.setState({ formBiomarker })
    }

    /**
     * Validates if the form is correct, if not change state of labels alerts bars
     * @returns Some flags indicating if the form is valid or not
     */
    handleValidateForm = (): ValidationForm => {
        let haveAmbiguous = false
        let haveInvalid = false

        for (const option of Object.values(BiomarkerType)) {
            if (!haveAmbiguous) {
                const indexOfAmbiguous = this.state.formBiomarker.moleculesSection[option].data.findIndex(item => !item.isValid && Array.isArray(item.value))
                if (indexOfAmbiguous >= 0) {
                    haveAmbiguous = true
                }
            }
            if (!haveInvalid && !this.state.formBiomarker.validation.checkBox) {
                const indexOfInvalid = this.state.formBiomarker.moleculesSection[option].data.findIndex(item => !item.isValid && !Array.isArray(item.value))
                if (indexOfInvalid >= 0) {
                    haveInvalid = true
                }
            }
        }

        return {
            haveAmbiguous: haveAmbiguous,
            haveInvalid: haveInvalid
        }
    }

    /**
     * Generates a valid structure to send the molecule to backend and create the Biomarker
     * @param item Molecule to send
     * @returns Correct structure to send
     */
    getValidMoleculeIdentifier = (item: MoleculesSectionData): SaveMoleculeStructure => {
        return (!Array.isArray(item.value) && item.isValid
            ? { identifier: item.value }
            : { identifier: '' })
    }

    /**
     * Makes the request to create a Biomarker
     */
    createBiomarker = () => {
        const formBiomarker = this.state.formBiomarker
        formBiomarker.validation.isLoading = true
        this.setState({ formBiomarker })

        const biomarkerToSend: SaveBiomarkerStructure = {
            name: formBiomarker.biomarkerName,
            description: formBiomarker.biomarkerDescription,
            mrnas: formBiomarker.moleculesSection.MRNA.data.map(this.getValidMoleculeIdentifier).filter(item => item.identifier.length > 0),
            mirnas: formBiomarker.moleculesSection.MIRNA.data.map(this.getValidMoleculeIdentifier).filter(item => item.identifier.length > 0)
        }

        const settings = {
            headers: getDjangoHeader(),
            json: biomarkerToSend
        }

        ky.post(urlBiomarkersCRUD, settings).then((response) => {
            response.json().then((jsonResponse: Biomarker) => {
                // TODO: jsonResponse has the data of the created Biomarker. Just discard this if not used.
                console.log(jsonResponse)
            }).catch((err) => {
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.log('Error getting genes ->', err)
        }).finally(() => {
            // TODO: put here loading = false. Maybe it's needed to move loading state to another single variable instead of a BiomarkerForm attribute
        })

        // TODO: put loading = false in ky.finally() and remove this block
        formBiomarker.validation.isLoading = false
        this.setState({
            formBiomarker: formBiomarker
        })
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
     * change name or description of manual form
     * @param value new value for input form
     * @param name type of input to change
     */
    handleChangeInputForm = (value: string, name: 'biomarkerName' | 'biomarkerDescription') => {
        const formBiomarker = this.state.formBiomarker
        formBiomarker[name] = value
        this.setState({
            formBiomarker: formBiomarker
        })
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

    handleAddMoleculeToSection = (value: MoleculesSectionData) => {
        const genesSymbolsFinder = this.state.formBiomarker.moleculesSymbolsFinder
        genesSymbolsFinder.data = []
        this.setState({
            formBiomarker: {
                ...this.state.formBiomarker,
                moleculesSymbolsFinder: genesSymbolsFinder
            }
        })

        const sectionFound = this.state.formBiomarker.moleculesSection[this.state.formBiomarker.moleculeSelected].data.find((item: MoleculesSectionData) => value.value === item.value)
        if (sectionFound !== undefined) {
            return
        }
        const moleculesSection = {
            ...this.state.formBiomarker.moleculesSection,
            [this.state.formBiomarker.moleculeSelected]: {
                isLoading: false,
                data: [...this.state.formBiomarker.moleculesSection[this.state.formBiomarker.moleculeSelected].data, value]
            }
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
    handleRemoveMolecule = (section: BiomarkerType, molecule: MoleculesSectionData) => {
        const data = this.state.formBiomarker.moleculesSection[section].data.map((item: MoleculesSectionData) => {
            if (item.value === molecule.value) return
            return item
        })

        this.setState({
            ...this.state,
            formBiomarker: {
                ...this.state.formBiomarker,
                moleculesSection: {
                    ...this.state.formBiomarker.moleculesSection,
                    [section]: {
                        isLoading: false,
                        data: data.filter((item) => item !== undefined)
                    }
                }
            }
        })
    }

    /**
     * Generates a default new file form
     * @returns An object with all the field with default values
     */
    getDefaultNewBiomarker (): Biomarker {
        return {
            id: null,
            name: '',
            description: '',
            tag: null,
            number_of_genes: 0,
            number_of_mirnas: 0,
            number_of_cnas: 0,
            number_of_methylations: 0,
            contains_nan_values: false,
            column_used_as_index: ''
        }
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
     * When the component has been mounted, It requests for
     * tags and files
     */
    componentDidMount () {
        this.getUserTags()
    }

    /**
     * Selects a new Biomarker to edit
     * @param selectedBiomarker Biomarker to edit
     */
    editTag = (selectedBiomarker: Biomarker) => {
        this.setState({ newBiomarker: copyObject(selectedBiomarker) })
    }

    /**
     * Cleans the new/edit biomarker form
     */
    cleanForm = () => { this.setState({ isOpenModal: true, formBiomarker: this.getDefaultFormBiomarker(), confirmModal: this.getDefaultConfirmModal() }) }

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
     * TODO: Check if needed
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
     * TODO: Check if needed
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
     * TODO: Check if needed
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
     * TODO: Check if needed
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
    isFormEmpty = (): boolean => isEqual(this.state.formBiomarker, this.getDefaultFormBiomarker())

    /**
     * Generates default table's headers
     * @returns Default object for table's headers
     */
    getDefaultHeaders (): RowHeader<Biomarker>[] {
        return [
            { name: 'Name', serverCodeToSort: 'name', width: 3 },
            { name: 'Description', serverCodeToSort: 'description', width: 4 },
            { name: 'Tag', serverCodeToSort: 'tag', width: 2 },
            { name: 'Date', serverCodeToSort: 'upload_date' },
            { name: '# mRNAS', serverCodeToSort: 'number_of_genes', width: 1 },
            { name: '# miRNAS', serverCodeToSort: 'number_of_mirnas', width: 1 },
            { name: '# CNA', serverCodeToSort: 'number_of_cnas', width: 1 },
            { name: '# Methylation', serverCodeToSort: 'number_of_methylations', width: 1 },
            { name: 'Actions' }
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

        return [
            { label: 'Tag', keyForServer: 'tag', defaultValue: '', options: tagOptions }
        ]
    }

    /**
     * Fetches the User's defined tags
     */
    getUserTags () {
        // Gets only File's Tags
        const searchParams = {
            type: TagType.FILE
        }

        ky.get(urlTagsCRUD, { searchParams: searchParams }).then((response) => {
            response.json().then((tags: DjangoTag[]) => {
                this.setState({ tags })
            }).catch((err) => {
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.log("Error getting user's tags ->", err)
        })
    }

    closeBiomarkerModal = () => {
        this.setState({
            formBiomarker: this.getDefaultFormBiomarker(),
            isOpenModal: false,
            confirmModal: this.getDefaultConfirmModal()
        })
    }

    render () {
        // Biomarker deletion modal
        const deletionConfirmModal = this.getDeletionConfirmModal()

        return (
            <Base activeItem='biomarkers' wrapperClass='wrapper'>
                {/* Biomarker deletion modal */}
                {deletionConfirmModal}

                <PaginatedTable<Biomarker>
                    headerTitle='Biomarkers'
                    headers={this.getDefaultHeaders()}
                    customFilters={this.getDefaultFilters()}
                    showSearchInput
                    customElements={[
                        <Form.Field key={1} className='biomarkers--button--modal' title='Add new Biomarker'>
                            <Button primary icon onClick={() => this.setState({ formBiomarker: this.getDefaultFormBiomarker(), isOpenModal: true })}>
                                <Icon name='add' />
                            </Button>
                        </Form.Field>
                    ]}
                    searchLabel='Name'
                    searchPlaceholder='Search by name'
                    urlToRetrieveData={urlBiomarkersCRUD}
                    updateWSKey='update_biomarkers'
                    mapFunction={(biomarker: Biomarker) => (
                        <Table.Row key={biomarker.id as number}>
                            <TableCellWithTitle value={biomarker.name} />
                            <TableCellWithTitle value={biomarker.description} />
                            <Table.Cell><TagLabel tag={biomarker.tag} /> </Table.Cell>
                            <TableCellWithTitle value={formatDateLocale(biomarker.upload_date as string, 'LLL')} />
                            <Table.Cell>{biomarker.number_of_genes}</Table.Cell>
                            <Table.Cell>{biomarker.number_of_mirnas}</Table.Cell>
                            <Table.Cell>{biomarker.number_of_cnas}</Table.Cell>
                            <Table.Cell>{biomarker.number_of_methylations}</Table.Cell>
                            <Table.Cell>
                                {/* Users can modify or delete own biomarkers or the ones which the user is admin of */}
                                <React.Fragment>

                                    {/* Shows a delete button if specified */}
                                    <Icon
                                        name='trash'
                                        className='clickable margin-left-5'
                                        color='red'
                                        title='Delete biomarker'
                                        onClick={() => this.confirmBiomarkerDeletion(biomarker)}
                                    />
                                </React.Fragment>
                            </Table.Cell>
                        </Table.Row>
                    )}
                />

                <Modal
                    closeIcon={<Icon name='close' size='large' />}
                    closeOnEscape={false}
                    closeOnDimmerClick={false}
                    closeOnDocumentClick={false}
                    style={{ width: '92%', height: '92%' }}
                    onClose={() => this.handleChangeConfirmModalState(true, 'You are going to lose all the data inserted', 'Are you sure?', this.closeBiomarkerModal)}
                    open={this.state.isOpenModal}>
                    <ModalContentBiomarker
                        handleChangeInputForm={this.handleChangeInputForm}
                        handleChangeMoleculeInputSelected={this.handleChangeMoleculeInputSelected}
                        handleChangeMoleculeSelected={this.handleChangeMoleculeSelected}
                        biomarkerForm={this.state.formBiomarker}
                        handleFormChanges={this.handleFormChanges}
                        handleKeyDown={this.handleKeyDown}
                        addCGDSDataset={() => { }}
                        removeCGDSDataset={() => { }}
                        handleFormDatasetChanges={this.handleFormDatasetChanges}
                        addSurvivalFormTuple={this.addSurvivalFormTuple}
                        removeSurvivalFormTuple={this.removeSurvivalFormTuple}
                        handleSurvivalFormDatasetChanges={this.handleSurvivalFormDatasetChanges}
                        cleanForm={this.cleanForm}
                        isFormEmpty={this.isFormEmpty}
                        addingOrEditingCGDSStudy={true}
                        canAddCGDSStudy={this.canAddBiomarker}
                        addOrEditStudy={() => { }}
                        handleAddMoleculeToSection={this.handleAddMoleculeToSection}
                        handleRemoveMolecule={this.handleRemoveMolecule}
                        handleGenesSymbolsFinder={this.handleGenesSymbolsFinder}
                        handleGenesSymbols={this.handleGenesSymbols}
                        handleSelectOptionMolecule={this.handleSelectOptionMolecule}
                        handleRemoveInvalidGenes={this.handleRemoveInvalidGenes}
                        handleChangeConfirmModalState={this.handleChangeConfirmModalState}
                        handleValidateForm={this.handleValidateForm}
                        handleSendForm={this.createBiomarker}
                        handleChangeCheckBox={this.handleChangeCheckBox}
                    />
                </Modal>

                <Confirm
                    className='biomarkers--confirm--modal'
                    open={this.state.confirmModal.confirmModal}
                    header={this.state.confirmModal.headerText}
                    content={this.state.confirmModal.contentText}
                    size="large"
                    onCancel={() => this.handleCancelConfirmModalState()}
                    onConfirm={() => this.state.confirmModal.onConfirm()}
                />
            </Base>
        )
    }
}

export { Biomarker }
