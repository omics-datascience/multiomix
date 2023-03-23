import ky from 'ky'
import React, { ReactElement } from 'react'
import { DropdownItemProps, Form, Grid, Header, Pagination, SemanticWIDTHSNUMBER, Table } from 'semantic-ui-react'
import { RowHeader } from '../../utils/django_interfaces'
import { GeneralTableControl, ResponseRequestWithPagination, WebsocketConfig } from '../../utils/interfaces'
import { getDefaultGeneralTableControl, getDefaultPageSizeOption, alertGeneralError, generatesOrderingQuery } from '../../utils/util_functions'
import { WebsocketClientCustom } from '../../websockets/WebsocketClient'
import { InfoPopup } from '../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { NoDataRow } from '../pipeline/experiment-result/gene-gem-details/NoDataRow'

declare const currentUserId: string

/**
 * Type of sorting settings
 */
type DefaultSortProp = {
    sortField: string,
    sortOrderAscendant: boolean
}

/**
 * Type of filter settings
 */
type PaginationCustomFilter = {
    /** Label used in Form.Select component */
    label: string,
    /** Key sent to server for filtering */
    keyForServer: string,
    /** Default value for Select */
    defaultValue: any,
    /** Placeholder for select */
    placeholder?: string
    /** Form.Select options */
    options: DropdownItemProps[],
    /** Receives all the current custom filter's values and must return the current `disabled` prop of the filter */
    disabledFunction?: (actualValues: {[key: string]: any}) => boolean
}

/**
 * Component's props
 */
interface PaginatedTableProps<T> {
    /** Title above the table */
    headerTitle: string,
    /** List of headers to render as HeaderCell */
    headers: RowHeader<T>[]
    /** Backend API URL to retrieve data */
    urlToRetrieveData: string,
    /** Grid.Column width. */
    width?: SemanticWIDTHSNUMBER,
    /** Initial query params to send the backend API (extra params will be attached) */
    queryParams?: any,
    /** List of elements to render before the custom filters. Every element must be inside a `Form.Item` */
    customElements?: JSX.Element[],
    /** Array of custom inputs to render */
    customFilters?: PaginationCustomFilter[],
    /** Field and order if needed to order by default by any field */
    defaultSortProp?: DefaultSortProp,
    /** To show or not an input to fires a search against the backend */
    showSearchInput?: boolean,
    /** Search input's label */
    searchLabel?: string,
    /** Search input's placeholder */
    searchPlaceholder?: string,
    /**
     * Websocket key to listen and refresh the table's data. This key must be sent from the backend to the current user's private
     * Websocket channel or to the `channelUrl` URL.
     */
    updateWSKey?: string,
    /** Websocket URL to listen for the `updateWSKey`. If this prop is not specified, it uses the current user's private Websocket channel. */
    wsChannelUrl?: string,
    /** If specified, an Information popup will be displayed on the top-right corner of the table */
    infoPopupContent?: string,
    /** Callback to render custom components applied to data retrieved from backend API */
    mapFunction: (elem: T) => ReactElement
}

/**
 * Component's state
 */
interface PaginatedTableState<T> {
    /** Table control to handle sorting, filter, and pagination */
    tableControl: GeneralTableControl,
    elements: T[],
    gettingData: boolean
}

/**
 * A general component to handle pagination
 * @param props Component's props
 * @returns Component
 */
class PaginatedTable<T> extends React.Component<PaginatedTableProps<T>, PaginatedTableState<T>> {
    private filterTimeout: number | undefined;
    websocketClient: WebsocketClientCustom;

    constructor (props: PaginatedTableProps<T>) {
        super(props)

        // Initializes the websocket client
        this.initializeWebsocketClient()

        // Generates TableControl
        const generalTableControl = getDefaultGeneralTableControl()
        if (props.defaultSortProp) {
            generalTableControl.sortField = props.defaultSortProp.sortField
            generalTableControl.sortOrderAscendant = props.defaultSortProp.sortOrderAscendant
        }

        // Generates custom filters
        if (this.props.customFilters) {
            generalTableControl.filters = {}
            this.props.customFilters.forEach((filter) => {
                generalTableControl.filters[filter.keyForServer] = filter.defaultValue
            })
        }

        this.state = {
            elements: [],
            tableControl: generalTableControl,
            gettingData: false
        }
    }

    /**
     * Fires request to retrieve data from custom URL
     */
    componentDidMount () {
        this.getData()
    }

    /**
     * Handles the table's control filters, select, etc changes
     * @param name Name of the state field to modify
     * @param value Value to set to the state field
     * @param resetPagination If true, resets pagination to pageNumber = 1. Useful when the filters change
     * @param isFilter If true the update is on a filter value
     */
    handleTableControlChanges = (name: string, value: any, resetPagination: boolean = true, isFilter: boolean = false) => {
        // Updates filter information and makes the request again
        const tableControl = this.state.tableControl
        if (!isFilter) {
            tableControl[name] = value
        } else {
            tableControl.filters[name] = value
        }

        // If pagination reset is required...
        if (resetPagination) {
            tableControl.pageNumber = 1
        }

        // Sets the new state and gets data
        this.setState({ tableControl }, () => {
            clearTimeout(this.filterTimeout)
            this.filterTimeout = window.setTimeout(this.getData, 300)
        })
    }

    /**
     * Generic function to retrieves data from backend
     */
    getData = () => {
        // If it's getting the data, prevents multiples requests to the server
        if (this.state.gettingData) {
            return
        }

        const tableControl = this.state.tableControl

        // Appends pagination, sorting and filter parameters
        const searchParams = {
            ...this.props.queryParams,
            search: tableControl.textFilter,
            page_size: tableControl.pageSize,
            page: tableControl.pageNumber,
            ordering: generatesOrderingQuery(tableControl.sortField, tableControl.sortOrderAscendant)
        }

        // Appends filters to query
        if (tableControl.filters) {
            Object.entries(tableControl.filters).forEach(([key, value]) => {
                if (value) {
                    searchParams[key] = value
                }
            })
        }

        this.setState({ gettingData: true }, () => {
            ky.get(this.props.urlToRetrieveData, { searchParams: searchParams, timeout: 60000 }).then((response) => {
                response.json().then((jsonResponse: ResponseRequestWithPagination<T>) => {
                    tableControl.totalRowCount = jsonResponse.count

                    this.setState({
                        elements: jsonResponse.results,
                        tableControl
                    })
                }).catch((err) => {
                    alertGeneralError()
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                alertGeneralError()
                console.log('Error getting data ->', err)
            }).finally(() => {
                this.setState({ gettingData: false })
            })
        })
    }

    /**
     * Changes the sort state
     * @param fieldToSort Field to sort
     */
    handleSort (fieldToSort) {
        const tableControl = this.state.tableControl
        // If the user has selected other column for sorting...
        if (tableControl.sortField !== fieldToSort) {
            tableControl.sortField = fieldToSort
            tableControl.sortOrderAscendant = true
        } else {
            tableControl.sortOrderAscendant = !tableControl.sortOrderAscendant
        }

        this.setState({ tableControl }, this.getData)
    }

    /**
     * Generates Form's inputs from the custom filters passed by props
     * @returns Array with input components
     */
    generateCustomFiltersForm (): JSX.Element[] {
        const customFiltersArray = this.props.customFilters ?? []
        return customFiltersArray.map((filter) => (
            <Form.Select
                key={filter.keyForServer}
                label={filter.label}
                placeholder={filter.placeholder}
                options={filter.options}
                name={filter.keyForServer}
                value={this.state.tableControl.filters[filter.keyForServer]}
                disabled={filter.disabledFunction ? filter.disabledFunction(this.state.tableControl.filters) : false}
                onChange={(_, { value }) => {
                    this.handleTableControlChanges(filter.keyForServer, value, true, true)
                }}
            />
        ))
    }

    /**
     * Instantiates a Websocket Client
     */
    initializeWebsocketClient () {
        if (this.props.updateWSKey) {
            const websocketConfig: WebsocketConfig = {
                channelUrl: this.props.wsChannelUrl ?? `/ws/users/${currentUserId}/`,
                commandsToAttend: [
                    {
                        key: this.props.updateWSKey,
                        functionToExecute: this.getData
                    }
                ]
            }
            this.websocketClient = new WebsocketClientCustom(websocketConfig)
        }
    }

    render () {
        const tableControl = this.state.tableControl

        // Applies map function
        const tableBody = this.state.elements.length > 0
            ? this.state.elements.map(this.props.mapFunction) : <NoDataRow colspan={this.props.headers.length} />

        // Computes some extra parameters
        const totalPages = Math.max(1, Math.ceil(tableControl.totalRowCount as number / tableControl.pageSize))
        const sortOrder = tableControl.sortOrderAscendant ? 'ascending' : 'descending'

        // Renders customInputs
        const customFilters = this.generateCustomFiltersForm()

        return (
            <Grid padded stackable textAlign='center' divided>
                <Grid.Row>
                    {/* Predicted table */}
                    <Grid.Column textAlign='left' width={this.props.width ?? 16}>
                        <Header as='h4' textAlign='left'>
                            {this.props.headerTitle}
                        </Header>

                        {this.props.infoPopupContent &&
                            <InfoPopup
                                content={this.props.infoPopupContent}
                                extraClassName='no-margin-right pull-right info-popup-paginated-table'
                                onTop={false}
                            />
                        }

                        <Form>
                            <Form.Group>
                                {this.props.customElements}

                                {/* Search input */ }
                                {this.props.showSearchInput &&
                                    <Form.Input
                                        width={3}
                                        icon='search' iconPosition='left'
                                        label={this.props.searchLabel ?? 'Name/Description'}
                                        placeholder={this.props.searchPlaceholder ?? 'Search by name/description'}
                                        name='textFilter'
                                        value={tableControl.textFilter}
                                        onChange={(_, { name, value }) => {
                                            this.handleTableControlChanges(name, value)
                                        }}
                                    />
                                }

                                {customFilters}

                                {/* Page size */}
                                <Form.Select
                                    label='Entries'
                                    options={getDefaultPageSizeOption()}
                                    name='pageSize'
                                    value={tableControl.pageSize}
                                    onChange={(_, { name, value }) => {
                                        this.handleTableControlChanges(name, value)
                                    }}
                                />
                            </Form.Group>
                        </Form>

                        {/* Table */}
                        <Table celled sortable>
                            {/* Header */}
                            <Table.Header>
                                <Table.Row>
                                    {this.props.headers.map((header) => {
                                        const sorted = tableControl.sortField === header.serverCodeToSort ? sortOrder : undefined

                                        // If the column is not sortable the there's not callback
                                        // Uses '!==' as it could be 'undefined' and that would mean that is sortable
                                        const onClickCallback = (header.serverCodeToSort)
                                            ? () => this.handleSort(header.serverCodeToSort)
                                            : null

                                        return (
                                            <Table.HeaderCell
                                                key={header.name}
                                                sorted={sorted}
                                                width={header.width}
                                                onClick={onClickCallback}
                                            >
                                                {header.name}

                                                {header.infoPopupContent &&
                                                    <InfoPopup
                                                        onTop={false}
                                                        onEvent='hover'
                                                        extraClassName='pull-right'
                                                        content={header.infoPopupContent}
                                                    />
                                                }
                                            </Table.HeaderCell>
                                        )
                                    })}
                                </Table.Row>
                            </Table.Header>

                            {/* Body */}
                            <Table.Body>
                                {tableBody}
                            </Table.Body>
                        </Table>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    {/* Pagination control */}
                    <Pagination
                        activePage={tableControl.pageNumber}
                        onPageChange={(_, { activePage }) => {
                            this.handleTableControlChanges('pageNumber', activePage, false)
                        }}
                        size='mini'
                        totalPages={totalPages}
                    />
                </Grid.Row>
            </Grid>
        )
    }
}

export { PaginatedTable, DefaultSortProp, PaginationCustomFilter }
