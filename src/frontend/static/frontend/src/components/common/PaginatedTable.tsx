import ky from 'ky'
import React, { ReactElement } from 'react'
import { Checkbox, DropdownItemProps, Form, Grid, Header, Icon, Pagination, SemanticWIDTHS, SemanticWIDTHSNUMBER, Table } from 'semantic-ui-react'
import { RowHeader } from '../../utils/django_interfaces'
import { GeneralTableControl, Nullable, ResponseRequestWithPagination, WebsocketConfig } from '../../utils/interfaces'
import { getDefaultGeneralTableControl, getDefaultPageSizeOption, alertGeneralError, generatesOrderingQuery } from '../../utils/util_functions'
import { WebsocketClientCustom } from '../../websockets/WebsocketClient'
import { InfoPopup } from '../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { NoDataRow } from '../pipeline/experiment-result/gene-gem-details/NoDataRow'
import { InputLabel } from './InputLabel'
import isEqual from 'lodash/isEqual'

// Styles
import './commonStyles.css'

declare const currentUserId: string

/** Structure in which the retrieved filter must be. */
type FilterRetrievedOptions = {
    /** Value for the DropDownItem */
    value: string,
    /** Label for the DropDownItem */
    text: string,
}

/**
 * Type of sorting settings.
 * TODO: make this generics with keyof to prevent issues with unknown fields.
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
    placeholder?: string,
    /** Width for component */
    width?: SemanticWIDTHS,
    /** Type of the filter. By default is 'select' */
    type?: 'select' | 'checkbox',
    /** Indicates if 0 as filter value is accepted */
    allowZero?: boolean,
    /** `clearable` prop of the `Form.Select`. `true` by default. Only used if type === 'select'. */
    clearable?: boolean,
    /** Form.Select options. If undefined, checks the `urlToRetrieveOptions` parameter. */
    options?: DropdownItemProps[],
    /**
     * In case `options` is `undefined`, this parameter is checked. If it's `undefined` gets uniques values from the data using the field `keyForServer`.
     * Otherwise, gets the options from the URL specified in this parameter, that endpoint must return a list of objects with the following structure:
     * ```
     * {
     *    value: string,
     *    text: string
     * }
     * ```
     */
    urlToRetrieveOptions?: string,
    /** Receives all the current custom filter's values and must return the current `disabled` prop of the filter */
    disabledFunction?: (actualValues: {[key: string]: any}) => boolean
}

/**
 * Component's props
 */
interface PaginatedTableProps<T> {
    /** Title above the table */
    headerTitle?: string,
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
    /** Default page size props. If not specified, uses `10` by default. */
    defaultPageSize?: number,
    /** To show or not an input to fires a search against the backend */
    showSearchInput?: boolean,
    /** Search input's label */
    searchLabel?: string,
    /** Search input's placeholder */
    searchPlaceholder?: string,
    /** Search input's width */
    searchWidth?: SemanticWIDTHS,
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
    /** Dict with all the retrieved options for the custom filters that have the parameter `urlToRetrieveOptions` */
    retrievedOptions: {
        [key: string]: {
            data: DropdownItemProps[],
            loading: boolean
        }
    },
    elements: T[],
    gettingData: boolean
}

/**
 * A general component to handle pagination
 * @param props Component's props
 * @returns Component
 */
class PaginatedTable<T> extends React.Component<PaginatedTableProps<T>, PaginatedTableState<T>> {
    private filterTimeout: number | undefined
    websocketClient: WebsocketClientCustom
    abortController = new AbortController()
    constructor (props: PaginatedTableProps<T>) {
        super(props)

        // Initializes the websocket client
        this.initializeWebsocketClient()

        // Generates TableControl
        const generalTableControl = getDefaultGeneralTableControl()

        if (props.defaultSortProp !== undefined) {
            generalTableControl.sortField = props.defaultSortProp.sortField
            generalTableControl.sortOrderAscendant = props.defaultSortProp.sortOrderAscendant
        }

        if (props.defaultPageSize !== undefined) {
            generalTableControl.pageSize = props.defaultPageSize
        }

        // Generates custom filters
        if (props.customFilters) {
            generalTableControl.filters = {}
            props.customFilters.forEach((filter) => {
                generalTableControl.filters[filter.keyForServer] = {
                    allowZero: filter.allowZero ?? false,
                    value: filter.defaultValue
                }
            })
        }

        this.state = {
            elements: [],
            tableControl: generalTableControl,
            retrievedOptions: {},
            gettingData: false
        }
    }

    /**
     * Fires request to retrieve data from custom URL
     */
    componentDidMount () {
        this.getData()

        this.getFiltersOptions()
    }

    /**
     * Abort controller if component unmount
     */
    componentWillUnmount () {
        this.abortController.abort()
    }

    /**
     * When changes the 'queryParams' prop refresh the table.
     * @param prevProps Previous props.
     */
    componentDidUpdate (prevProps: PaginatedTableProps<T>) {
        if (!isEqual(prevProps.queryParams, this.props.queryParams)) {
            this.getData()

            this.getFiltersOptions()
        }
    }

    /** Retrieves the filters options for all the custom filters that have the parameter `urlToRetrieveOptions` */
    getFiltersOptions = () => {
        const { customFilters } = this.props

        if (customFilters) {
            customFilters.forEach((filter) => {
                if (filter.urlToRetrieveOptions) {
                    const retrievedOptions = this.state.retrievedOptions
                    retrievedOptions[filter.keyForServer] = {
                        data: [],
                        loading: true
                    }
                    this.setState({ retrievedOptions })

                    ky.get(filter.urlToRetrieveOptions, { signal: this.abortController.signal, timeout: 60000 }).then((response) => {
                        response.json().then((jsonResponse: FilterRetrievedOptions[]) => {
                            retrievedOptions[filter.keyForServer].data = jsonResponse.map((option) => {
                                return {
                                    key: option.value,
                                    value: option.value,
                                    text: option.text
                                }
                            })
                            this.setState({ retrievedOptions })
                        }).catch((err) => {
                            console.log('Error parsing JSON ->', err)
                        })
                    }).catch((err) => {
                        console.log(`Error getting filters for ${filter.keyForServer} in URL "${filter.urlToRetrieveOptions}"->`, err)
                    }).finally(() => {
                        if (this.abortController.signal.aborted) {
                            retrievedOptions[filter.keyForServer].loading = false
                            this.setState({ retrievedOptions })
                        }
                    })
                }
            })
        }
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
            tableControl.filters[name].value = value
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

        this.setState({ gettingData: true }, () => {
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
                Object.entries(tableControl.filters).forEach(([key, { allowZero, value }]) => {
                    if ((!allowZero && value) ||
                    ((allowZero && value !== null && value !== undefined && value !== ''))) {
                        searchParams[key] = value
                    }
                })
            }

            ky.get(this.props.urlToRetrieveData, { signal: this.abortController.signal, searchParams, timeout: 60000 }).then((response) => {
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
                if (!this.abortController.signal.aborted) {
                    alertGeneralError()
                }

                console.log('Error getting data ->', err)
            }).finally(() => {
                if (!this.abortController.signal.aborted) {
                    this.setState({ gettingData: false })
                }
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
    generateCustomFiltersForm (): Nullable<JSX.Element>[] {
        const customFiltersArray = this.props.customFilters ?? []
        return customFiltersArray.map((filter) => {
            const filterType = filter.type ?? 'select'

            if (filterType === 'select') {
                // If 'options' is undefined, gets the unique values from data
                let options: DropdownItemProps[]

                if (filter.options !== undefined) {
                    options = filter.options
                } else {
                    // First, checks retrieved options
                    if (this.state.retrievedOptions[filter.keyForServer]) {
                        options = this.state.retrievedOptions[filter.keyForServer].data
                    } else {
                        // As the last resource, gets the unique values from data
                        const uniqueValues = [...new Set(this.state.elements.map((elem) => elem[filter.keyForServer]))].sort()
                        options = uniqueValues.map((value) => ({ key: value, text: value, value }))
                    }
                }

                return (
                    <Form.Select
                        width={filter.width ?? 6}
                        fluid
                        key={filter.keyForServer}
                        label={filter.label}
                        selectOnBlur={false}
                        clearable={filter.clearable ?? true}
                        placeholder={filter.placeholder}
                        options={options}
                        name={filter.keyForServer}
                        value={this.state.tableControl.filters[filter.keyForServer].value}
                        disabled={filter.disabledFunction ? filter.disabledFunction(this.state.tableControl.filters) : false}
                        onChange={(_, { value }) => {
                            this.handleTableControlChanges(filter.keyForServer, value, true, true)
                        }}
                    />
                )
            } else {
                // Checkbox needs special structure to prevent displaying all the label and the checkbox in the same line
                return (
                    <Form.Group key={filter.keyForServer} style={{ display: 'block' }}>
                        <Form.Field>
                            <InputLabel label={filter.label} />
                        </Form.Field>

                        <Form.Field className='align-center margin-top-10'>
                            <Checkbox
                                toggle
                                fitted
                                name={filter.keyForServer}
                                checked={this.state.tableControl.filters[filter.keyForServer].value}
                                disabled={filter.disabledFunction ? filter.disabledFunction(this.state.tableControl.filters) : false}
                                onChange={(_, { checked }) => {
                                    this.handleTableControlChanges(filter.keyForServer, checked, true, true)
                                }}
                            />
                        </Form.Field>
                    </Form.Group>
                )
            }
        })
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
            ? (
                <Table.Body>
                    {this.state.elements.map(this.props.mapFunction)}
                </Table.Body>
            )
            : (
                <Table.Body>
                    <NoDataRow colspan={this.props.headers.length} />
                </Table.Body>
            )

        // Computes some extra parameters
        const totalPages = Math.max(1, Math.ceil(tableControl.totalRowCount as number / tableControl.pageSize))
        const sortOrder = tableControl.sortOrderAscendant ? 'ascending' : 'descending'

        // Renders customInputs
        const customFilters = this.generateCustomFiltersForm()

        const bodyContent = this.state.gettingData
            ? (
                <Table.Body>
                    <Table.Row>
                        <Table.Cell colSpan={this.props.headers.length}>
                            <Header as='h4' textAlign='center'>
                                <Icon name='spinner' loading /> Loading...
                            </Header>
                        </Table.Cell>
                    </Table.Row>
                </Table.Body>
            )
            : tableBody

        return (
            <Grid padded stackable textAlign='center' divided>
                <Grid.Row>
                    {/* Predicted table */}
                    <Grid.Column textAlign='left' width={this.props.width ?? 16}>
                        {this.props.headerTitle &&
                            <Header as='h4' textAlign='left'>
                                {this.props.headerTitle}
                            </Header>
                        }

                        {this.props.infoPopupContent &&
                            <InfoPopup
                                content={this.props.infoPopupContent}
                                extraClassName='no-margin-right pull-right info-popup-paginated-table'
                                onTop={false}
                            />
                        }
                    </Grid.Column>
                    <Grid.Column width={16}>
                        <Form>
                            <Form.Group className='custom-form'>
                                {this.props.customElements}

                                {/* Search input */}
                                {this.props.showSearchInput &&
                                        <Form.Input
                                            width={this.props.searchWidth ?? 3}
                                            icon='search' iconPosition='left'
                                            label={this.props.searchLabel ?? 'Name/Description'}
                                            title={this.props.searchPlaceholder}
                                            placeholder={this.props.searchPlaceholder}
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
                                    className='entries-select-table'
                                    selectOnBlur={false}
                                    options={getDefaultPageSizeOption()}
                                    name='pageSize'
                                    value={tableControl.pageSize}
                                    onChange={(_, { name, value }) => {
                                        this.handleTableControlChanges(name, value)
                                    }}
                                />
                            </Form.Group>
                        </Form>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row>
                    <Grid.Column>
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
                                                title={header.title}
                                                textAlign={header.textAlign}
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
                            {bodyContent}
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
