import React from 'react'
import { Table, Form, Pagination, DropdownMenuProps } from 'semantic-ui-react'
import { AllExperimentsTableControl, Nullable } from '../../../utils/interfaces'
import { DjangoExperiment, RowHeader, DjangoTag } from '../../../utils/django_interfaces'
import { AllExperimentsRow } from './AllExperimentsRow'
import { getExperimentTypeSelectOptions, getCorrelationMethodSelectOptions } from '../../../utils/util_functions'

/**
 * Component's props
 */
interface AllExperimentsViewProps {
    allExperiments: DjangoExperiment[],
    allExperimentsTableControl: AllExperimentsTableControl,
    gettingAllExperiments: boolean,
    tags: DjangoTag[],
    getAllUserExperiments: (retryIfNotFound?: boolean) => void,
    seeResult: (experiment: DjangoExperiment) => void,
    editExperiment: (experiment: DjangoExperiment) => void,
    confirmExperimentDeletion: (experiment: DjangoExperiment) => void,
    handleSortAllExperiments: (headerServerCodeToSort: string) => void,
    handleTableControlChangesAllExperiments: (name: string, value: any, resetPagination?: boolean) => void
}

/**
 * Component's state
 */
interface AllExperimentsViewState {
    headers: RowHeader<DjangoExperiment>[],
    /** Id of the experiment which clinical source popup must be opened */
    clinicalPopupOpenId: Nullable<number>
}

/**
 * Renders a table with filters and an experiment results rows
 * TODO: refactor component with PaginatedTable!
 */
class AllExperimentsView extends React.Component<AllExperimentsViewProps, AllExperimentsViewState> {
    constructor (props) {
        super(props)

        this.state = {
            headers: this.getDefaultHeaders(),
            clinicalPopupOpenId: null
        }
    }

    /**
     * Generates default table's headers
     * @returns Default object for table's headers
     */
    getDefaultHeaders (): RowHeader<DjangoExperiment>[] {
        return [
            { name: 'Name', serverCodeToSort: 'name' },
            { name: 'Description', serverCodeToSort: 'description', width: 3 },
            { name: 'Date', serverCodeToSort: 'submit_date' },
            { name: 'State', serverCodeToSort: 'state', width: 1 },
            { name: 'Type', serverCodeToSort: 'type' },
            { name: 'Cor. Method', serverCodeToSort: 'correlation_method' },
            { name: 'N° Combinations', serverCodeToSort: 'result_final_row_count' },
            { name: 'Clinical', width: 1 },
            { name: 'Tag', serverCodeToSort: 'tag', width: 1 },
            { name: 'Sources' },
            { name: 'Actions' }
        ]
    }

    /**
     * Opens popup to add/edit clinical source data for a specific Experiment
     * @param experimentId ID of the experiment to show popup
     */
    openPopup = (experimentId: number) => { this.setState({ clinicalPopupOpenId: experimentId }) }

    /**
     * Closes the current popup
     */
    closePopup = () => { this.setState({ clinicalPopupOpenId: null }) }

    render () {
        // Sets the order icon in Table's header
        const columnSorted = this.props.allExperimentsTableControl.sortField
        const sortOrder = this.props.allExperimentsTableControl.sortOrderAscendant ? 'ascending' : 'descending'
        const headers = this.state.headers.map((header) => {
            const sorted = columnSorted === header.serverCodeToSort ? sortOrder : undefined

            // If the column is not sortable the there's not callback
            // Uses '!==' as it could be 'undefined' and that would mean that is sortable
            const onClickCallback = (header.serverCodeToSort)
                ? () => this.props.handleSortAllExperiments(header.serverCodeToSort as string)
                : null

            return (
                <Table.HeaderCell
                    key={header.name}
                    title={header.name}
                    width={header.width}
                    sorted={sorted}
                    onClick={onClickCallback}
                >
                    {header.name}
                </Table.HeaderCell>
            )
        })
        const rows = this.props.allExperiments.map((experiment) => {
            return (
                <AllExperimentsRow
                    key={experiment.id}
                    experiment={experiment}
                    openPopup={this.openPopup}
                    closePopup={this.closePopup}
                    showPopup={this.state.clinicalPopupOpenId === experiment.id}
                    getAllUserExperiments={this.props.getAllUserExperiments}
                    seeResult={this.props.seeResult}
                    editExperiment={this.props.editExperiment}
                    confirmExperimentDeletion={this.props.confirmExperimentDeletion}
                />
            )
        })

        const selectPageSizeOptions = [
            { key: '10', text: '10', value: 10 },
            { key: '25', text: '25', value: 25 },
            { key: '50', text: '50', value: 50 },
            { key: '100', text: '100', value: 100 }
        ]

        // Calculates total pages
        const totalPages = Math.max(1, Math.ceil(this.props.allExperimentsTableControl.totalRowCount as number / this.props.allExperimentsTableControl.pageSize))

        // Generates Tags filter options
        const tagOptions: DropdownMenuProps[] = this.props.tags.map((tag) => {
            return { key: tag.name, value: tag.id, text: tag.name }
        })
        tagOptions.unshift({ key: 'select_tag', text: 'No tag selected', value: null })

        // Get Experiment type select options, with 'All' option included
        const experimentTypeOptions = getExperimentTypeSelectOptions()

        // Get Correlation Method select options, with 'All' option included
        const selectCorrelationMethodsOptions = getCorrelationMethodSelectOptions()

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
                            value={this.props.allExperimentsTableControl.textFilter}
                            onChange={(_, { name, value }) => this.props.handleTableControlChangesAllExperiments(name, value)}
                        />

                        {/* Tag filter */}
                        <Form.Dropdown
                            fluid
                            width={5}
                            search
                            label='Tag'
                            selection
                            options={tagOptions}
                            name='tagId'
                            clearable
                            value={this.props.allExperimentsTableControl.tagId ?? undefined}
                            onChange={(_, { name, value }) => this.props.handleTableControlChangesAllExperiments(name, value)}
                            placeholder='Select an existing Tag'
                        />

                        {/* Experiment type filter */}
                        <Form.Select
                            fluid
                            width={2}
                            label='Experiment type'
                            options={experimentTypeOptions}
                            name='experimentType'
                            value={this.props.allExperimentsTableControl.experimentType}
                            onChange={(_, { name, value }) => this.props.handleTableControlChangesAllExperiments(name, value)}
                        />

                        {/* Correlation method filter */}
                        <Form.Select
                            fluid
                            width={2}
                            label='Correlation method'
                            options={selectCorrelationMethodsOptions}
                            name='correlationMethod'
                            value={this.props.allExperimentsTableControl.correlationMethod}
                            onChange={(_, { name, value }) => this.props.handleTableControlChangesAllExperiments(name, value)}
                        />

                        {/* Page size */}
                        <Form.Select
                            fluid
                            width={2}
                            label='Entries'
                            options={selectPageSizeOptions}
                            name='pageSize'
                            value={this.props.allExperimentsTableControl.pageSize}
                            onChange={(_, { name, value }) => this.props.handleTableControlChangesAllExperiments(name, value)}
                        />
                    </Form.Group>
                </Form>

                {/* Table */}
                <Table sortable celled textAlign="center" fixed singleLine>
                    {/* Header */}
                    <Table.Header>
                        <Table.Row>
                            {headers}
                        </Table.Row>
                    </Table.Header>

                    {/* Body */}
                    <Table.Body>
                        {rows}
                    </Table.Body>
                </Table>

                {/* Pagination control */}
                <Pagination
                    activePage={this.props.allExperimentsTableControl.pageNumber}
                    onPageChange={(_, { activePage }) => this.props.handleTableControlChangesAllExperiments('pageNumber', activePage, false)}
                    size='mini'
                    totalPages={totalPages}
                />
            </div>
        )
    }
}

export { AllExperimentsView }
