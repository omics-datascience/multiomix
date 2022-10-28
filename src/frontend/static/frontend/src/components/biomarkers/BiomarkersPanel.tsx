import React from 'react'
import { Base, CurrentUserContext } from '../Base'
import { Grid, Header, Button, Modal, Table, DropdownItemProps, Icon } from 'semantic-ui-react'
import { DjangoSurvivalColumnsTupleSimple, DjangoTag, RowHeader, TagType } from '../../utils/django_interfaces'
import ky from 'ky'
import { getDjangoHeader, alertGeneralError, copyObject, formatDateLocale } from '../../utils/util_functions'
import { NameOfCGDSDataset, Nullable } from '../../utils/interfaces'
import { Biomarker } from './types'
import { PaginatedTable, PaginationCustomFilter } from '../common/PaginatedTable'
import { TableCellWithTitle } from '../common/TableCellWithTitle'
import { TagLabel } from '../common/TagLabel'

// URLs defined in biomarkers.html
declare const urlBiomarkersCRUD: string
<<<<<<< HEAD
declare const urlTagsCRUD: string
=======
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
>>>>>>> biomarkers

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

    tags: DjangoTag[]
}

/**
 * Renders a CRUD panel for a Biomarker
 * @returns Component
 */
export class BiomarkersPanel extends React.Component<{}, BiomarkersPanelState> {
    filterTimeout: number | undefined;

    constructor (props) {
        super(props)

        this.state = {
            biomarkers: [],
            newBiomarker: this.getDefaultNewBiomarker(),
            showDeleteBiomarkerModal: false,
            selectedBiomarkerToDeleteOrSync: null,
            deletingBiomarker: false,
            addingOrEditingBiomarker: false,
            tags: []
        }
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
            number_of_mrnas: 0,
            number_of_mirnas: 0,
            number_of_cna: 0,
            number_of_methylation: 0,
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
    isFormEmpty = (): boolean => {
        return this.state.newBiomarker.name.trim().length === 0
    }

    /**
     * Generates default table's headers
     * @returns Default object for table's headers
     */
    getDefaultHeaders (): RowHeader<Biomarker>[] {
        return [
            { name: 'Name', serverCodeToSort: 'name' },
            { name: 'Description', serverCodeToSort: 'description', width: 3 },
            { name: 'Tag', serverCodeToSort: 'tag', width: 1 },
            { name: 'Date', serverCodeToSort: 'upload_date' },
            { name: '# mRNAS', serverCodeToSort: 'number_of_mrnas', width: 2 },
            { name: '# miRNAS', serverCodeToSort: 'number_of_mirnas', width: 2 },
            { name: '# CNA', serverCodeToSort: 'number_of_cna', width: 1 },
            { name: '# Methylation', serverCodeToSort: 'number_of_methylation', width: 2 },
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
                                        headers={this.getDefaultHeaders()}
                                        customFilters={this.getDefaultFilters()}
                                        showSearchInput
                                        searchLabel='Name'
                                        searchPlaceholder='Search by name'
                                        urlToRetrieveData={urlBiomarkersCRUD}
                                        updateWSKey='update_biomarkers'
                                        mapFunction={(diseaseRow: Biomarker) => (
                                            <Table.Row key={diseaseRow.id as number}>
                                                <TableCellWithTitle value={diseaseRow.name} />
                                                <TableCellWithTitle value={diseaseRow.description !== null ? diseaseRow.description : 'No description'} />
                                                <Table.Cell><TagLabel tag={diseaseRow.tag} /> </Table.Cell>
                                                <TableCellWithTitle value={formatDateLocale(diseaseRow.upload_date as string, 'LLL')} />
                                                <Table.Cell></Table.Cell>
                                                <Table.Cell></Table.Cell>
                                                <Table.Cell></Table.Cell>
                                                <Table.Cell></Table.Cell>
                                                <Table.Cell>
                                                    {/* Users can modify or delete own biomarkers or the ones which the user is admin of */}
                                                    <React.Fragment>

                                                        {/* Shows a delete button if specified */}
                                                        <Icon
                                                            name='trash'
                                                            className='clickable margin-left-5'
                                                            color='red'
                                                            title='Delete biomarker'
                                                            onClick={() => this.confirmBiomarkerDeletion(diseaseRow)}
                                                        />
                                                    </React.Fragment>
                                                </Table.Cell>
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

export { Biomarker }
