import React from 'react'
import { Table, Pagination, Icon } from 'semantic-ui-react'
import { ExperimentInfo, ExperimentResultTableControl, Nullable } from '../../../utils/interfaces'
import { ExperimentType, DjangoMRNAxGEMResultRow, DjangoExperiment } from '../../../utils/django_interfaces'
import { getCorrelationAndPValuesAdjMethodsDescription, getGemDescription } from '../../../utils/util_functions'
import { ExperimentResultRow } from './ExperimentResultRow'
import { ResultTableControlForm } from './ResultTableControlForm'
import { GeneGemDetailsModal } from './gene-gem-details/GeneGemDetailsModal'
import { HeaderRow } from '../MiRNAPipeline'
import { InfoPopup } from './gene-gem-details/InfoPopup'

/**
 * Component's props
 */
interface ExperimentResultViewProps {
    experimentTabId: number,
    experimentInfo: ExperimentInfo,
    tableControl: ExperimentResultTableControl,
    handleTableControlChanges: (experimentTabId: number, name: string, value: any, resetPagination?: boolean) => void,
    changePrecisionState: (experimentId: number, showHighPrecision: boolean) => void,
    handleSort: (experimentTabId: number, header: HeaderRow) => void,
    closeTab: (experimentTabId: number) => void,
    resetFiltersAndSorting: (experiment: DjangoExperiment) => void
    resetFilters: (experiment: ExperimentInfo) => void
    resetSorting: (experiment: DjangoExperiment) => void,
    /** Callback to refresh experiment info on clinical source changes */
    refreshExperimentInfo: (experimentId: number) => void
}

/**
 * Component's state
 */
interface ExperimentResultViewState {
    selectedRow: Nullable<DjangoMRNAxGEMResultRow>,
    showDetailsModal: boolean
}

/**
 * Renders a view with an Experiment's result combinations
 * TODO: refactor component with PaginatedTable! (if possible)
 */
class ExperimentResultView extends React.Component<ExperimentResultViewProps, ExperimentResultViewState> {
    constructor (props) {
        super(props)

        this.state = {
            selectedRow: null,
            showDetailsModal: false
        }
    }

    /**
     * Changes the state of a specific field in TableControl of the current tab
     * @param field Field to update
     * @param value Value to set
     */
    handleTableControlChanges = (field: string, value) => {
        this.props.handleTableControlChanges(this.props.experimentTabId, field, value)
    }

    /**
     * Sets Low/High precision for a specific tab
     * @param newShowHighPrecision New state value
     */
    changePrecisionState = (newShowHighPrecision) => {
        this.props.changePrecisionState(this.props.experimentTabId, newShowHighPrecision)
    }

    /**
     * Opens a modal with the details of the selected gene/GEM
     * @param selectedRow Selected Gene x GEM combination
     */
    openDetailsModal = (selectedRow: DjangoMRNAxGEMResultRow) => {
        // Mark as active the corresponding table row
        this.setState({
            selectedRow,
            showDetailsModal: true
        })
    }

    /**
     * Modal closing callback
     */
    handleCloseModal = () => { this.setState({ selectedRow: null, showDetailsModal: false }) }

    /**
     * Generates a text indicating applied sorting order to the user
     * @returns Information about the sorting order
     */
    generateSortingInfoText (): string {
        const tableControl = this.props.tableControl

        if (!tableControl.sortFields.length) {
            return ''
        }

        const sortFieldsText = tableControl.sortFields.map((sortField) => {
            return `${sortField.name} (${sortField.sortOrderAscendant ? 'ASC' : 'DESC'})`
        })

        return sortFieldsText.join(', ')
    }

    render () {
        // Get GEM description to display
        const experiment = this.props.experimentInfo.experiment
        const gemDescription = getGemDescription(experiment.type, 'ExperimentType')

        const [correlationMethodDescription, pValuesAdjustmentMethodDescription] = getCorrelationAndPValuesAdjMethodsDescription(
            experiment.correlation_method,
            experiment.p_values_adjustment_method
        )

        // Table Headers
        const headers: HeaderRow[] = [
            { name: gemDescription, serverCodeToSort: 'gem' },
            { name: 'mRNA', serverCodeToSort: 'gene' },
            { name: 'Chromosome', serverCodeToSort: 'gene__chromosome', width: 2 },
            { name: 'Gene start (bp)', serverCodeToSort: 'gene__start' },
            { name: 'Gene end (bp)', serverCodeToSort: 'gene__end' },
            { name: 'Gene type', serverCodeToSort: 'gene__type' },
            { name: 'Gene desc.', serverCodeToSort: 'gene__description', width: 4 },
            { name: 'Correlation', serverCodeToSort: 'correlation' },
            { name: 'P-value', serverCodeToSort: 'p_value' },
            { name: `Adj. P-value (${pValuesAdjustmentMethodDescription})`, serverCodeToSort: 'adjusted_p_value' }
        ]

        // Check if it's a miRNA experiment to show specific actions
        const isMiRNA = experiment.type === ExperimentType.MIRNA

        // Calculates total pages
        const totalPages = Math.max(1, Math.ceil(this.props.experimentInfo.totalRowCount / this.props.tableControl.pageSize))

        return (
            <React.Fragment>
                {/* NOTE: this conditional ensures that componentDidMount fires when selectedRow is set avoiding errors */}
                {this.state.showDetailsModal &&
                    <GeneGemDetailsModal
                        experiment={experiment}
                        selectedRow={this.state.selectedRow}
                        isMiRNA={isMiRNA}
                        correlationMethodDescription={correlationMethodDescription}
                        pValuesAdjustmentMethodDescription={pValuesAdjustmentMethodDescription}
                        showModal={this.state.showDetailsModal}
                        refreshExperimentInfo={this.props.refreshExperimentInfo}
                        handleClose={this.handleCloseModal}
                    />
                }

                {/* Table Control */}
                <ResultTableControlForm
                    experimentInfo={this.props.experimentInfo}
                    tableControl={this.props.tableControl}
                    gemDescription={gemDescription}
                    minimumCoefficientThreshold={experiment.minimum_coefficient_threshold}
                    numberOfShowingCombinations={this.props.experimentInfo.totalRowCount}
                    totalNumberOfCombinations={experiment.result_final_row_count}
                    handleTableControlChanges={this.handleTableControlChanges}
                    changePrecisionState={this.changePrecisionState}
                    resetFiltersAndSorting={this.props.resetFiltersAndSorting}
                    resetFilters={this.props.resetFilters}
                />

                {/* Sorting order */}
                <p id='sorting-order-data'>
                    <strong>Sorting (in order) by</strong> {this.generateSortingInfoText()}

                    <Icon
                        name='trash'
                        color='red'
                        title='Clean sorting only'
                        className='clickable margin-left-1'
                        onClick={() => this.props.resetSorting(experiment)}
                        disabled={!this.props.tableControl.sortFields.length}
                    />

                    <InfoPopup
                        onTop={false}
                        extraClassName='margin-left-1'
                        content='The order of sorting will be respected. If you want to remove any of the element which are being sorted you can click on its column header until the sorting mark disappear. To make a full clean of the sorting, you can click the red button on the left'
                    />
                </p>

                {/* Table */}
                <Table sortable celled textAlign="center" fixed singleLine>
                    {/* Header */}
                    <Table.Header>
                        <Table.Row>
                            {headers.map((header) => {
                                const columnSorted = this.props.tableControl.sortFields.find(({ field }) => field === header.serverCodeToSort)
                                const isSorted = columnSorted
                                    ? columnSorted.sortOrderAscendant ? 'ascending' : 'descending'
                                    : undefined
                                return (
                                    <Table.HeaderCell
                                        key={header.name}
                                        sorted={isSorted}
                                        onClick={() => this.props.handleSort(
                                            this.props.experimentTabId,
                                            header
                                        )}
                                    >
                                        {header.name}
                                    </Table.HeaderCell>
                                )
                            })}

                            <Table.HeaderCell>Actions</Table.HeaderCell>
                        </Table.Row>
                    </Table.Header>

                    {/* Body */}
                    <Table.Body>
                        {this.props.experimentInfo.rows.map((row) => (
                            <ExperimentResultRow
                                key={row.id}
                                row={row}
                                selectedRow={this.state.selectedRow}
                                showHighPrecision={this.props.tableControl.showHighPrecision}
                                openDetailsModal={this.openDetailsModal}
                            />
                        ))}
                    </Table.Body>
                </Table>

                {/* Pagination control */}
                <Pagination
                    activePage={this.props.tableControl.pageNumber}
                    onPageChange={(_, { activePage }) => this.props.handleTableControlChanges(this.props.experimentTabId, 'pageNumber', activePage, false)}
                    size='mini'
                    totalPages={totalPages}
                />
            </React.Fragment>
        )
    }
}

export { ExperimentResultView }
