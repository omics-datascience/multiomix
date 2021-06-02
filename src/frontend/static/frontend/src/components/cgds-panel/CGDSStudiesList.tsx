import React from 'react'
import { Table, Pagination, Icon, Form } from 'semantic-ui-react'
import { DjangoCGDSStudy, DjangoCGDSDataset, CGDSStudySynchronizationState, CGDSDatasetSynchronizationState, RowHeader } from '../../utils/django_interfaces'
import { GeneralTableControl, Nullable } from '../../utils/interfaces'
import { SemanticICONS, SemanticCOLORS } from 'semantic-ui-react/dist/commonjs/generic'
import { formatDateLocale } from '../../utils/util_functions'
import { TableCellWithTitle } from '../common/TableCellWithTitle'
import { InfoPopup } from '../pipeline/experiment-result/gene-gem-details/InfoPopup'

/**
 * Component's props
 */
interface CGDSStudiesListProps {
    CGDSStudies: DjangoCGDSStudy[],
    tableControl: GeneralTableControl,
    sendingSyncRequest: boolean,
    handleSort: (headerServerCodeToSort: string) => void,
    handleTableControlChanges: (name: string, value: any, resetPagination?: boolean) => void,
    confirmCGDSStudyDeletionOrSync: (CGDSStudy: DjangoCGDSStudy, isDeletion: boolean) => void,
    editCGDSStudy: (CGDSStudy: DjangoCGDSStudy) => void
}

/**
 * Component's state
 */
interface CGDSStudiesListState {
    headers: RowHeader<DjangoCGDSStudy>[]
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

/**
 * Renders a list of CGDS Studies
 * TODO: refactor component with paginated table!
 * TODO: make this a function instead a Class
 */
export class CGDSStudiesList extends React.Component<CGDSStudiesListProps, CGDSStudiesListState> {
    constructor (props: CGDSStudiesListProps) {
        super(props)

        this.state = {
            headers: [
                { name: 'Name', serverCodeToSort: 'name', width: 3 },
                { name: 'Description', serverCodeToSort: 'description', width: 2 },
                { name: 'Sync Date', serverCodeToSort: 'date_last_synchronization', width: 2 },
                { name: 'mRNA', serverCodeToSort: 'mrna_dataset', width: 1 },
                { name: 'miRNA', serverCodeToSort: 'mirna_dataset', width: 1 },
                { name: 'CNA', serverCodeToSort: 'cna_dataset', width: 1 },
                { name: 'Methylation', serverCodeToSort: 'methylation_dataset', width: 1 },
                { name: 'Clinical patients', serverCodeToSort: 'clinical_patient_dataset', width: 1 },
                { name: 'Clinical samples', serverCodeToSort: 'clinical_sample_dataset', width: 1 },
                { name: 'State', width: 1 },
                { name: 'Actions' }
            ]
        }
    }

    /**
     * Gets info about the state to display in the card
     * @param CGDSDataset CGDSDataset object
     * @param isClinicalData True if the dataset is about clinical data as its data is transposed
     * @returns The corresponding info of the current CGDS Dataset state
     */
    getCGDSDatasetStateObj (CGDSDataset: DjangoCGDSDataset, isClinicalData: boolean): CGDSStudyAndDatasetStateInfo {
        let stateIcon: CGDSStudyAndDatasetStateInfo
        switch (CGDSDataset.state) {
            case CGDSDatasetSynchronizationState.NOT_SYNCHRONIZED:
                stateIcon = {
                    iconName: 'circle',
                    color: 'grey',
                    loading: false,
                    title: 'The Dataset has not yet been synchronized'
                }
                break
            case CGDSDatasetSynchronizationState.SUCCESS: {
                let numberOfRowsAndSamplesMessage: string
                if (isClinicalData) {
                    // Case of clinical data where samples are as rows indexes
                    numberOfRowsAndSamplesMessage = `${CGDSDataset.number_of_rows} samples x ${CGDSDataset.number_of_samples} attributes`
                } else {
                    numberOfRowsAndSamplesMessage = `${CGDSDataset.number_of_rows} rows x ${CGDSDataset.number_of_samples} samples`
                }

                stateIcon = {
                    iconName: 'circle',
                    color: 'green',
                    loading: false,
                    title: `The Dataset was synchronized successfully: ${numberOfRowsAndSamplesMessage}`
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
    generateDatasetCell (CGDSDataset: Nullable<DjangoCGDSDataset>, isClinicalData: boolean = false): React.ReactNode {
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
     * Gets info about the state to display in the card
     * @param state CGDSStudy state
     * @returns The corresponding info of the current study's state
     */
    getStateObj (state: CGDSStudySynchronizationState | undefined): CGDSStudyAndDatasetStateInfo {
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

    render () {
        // Sets the order icon in Table's header
        const columnSorted = this.props.tableControl.sortField
        const sortOrder = this.props.tableControl.sortOrderAscendant ? 'ascending' : 'descending'

        const headers = this.state.headers.map((header) => {
            const sorted = columnSorted === header.serverCodeToSort ? sortOrder : undefined

            // If the column is not sortable the there's not callback
            // Uses '!==' as it could be 'undefined' and that would mean that is sortable
            const onClickCallback = (header.serverCodeToSort !== undefined)
                ? () => this.props.handleSort(header.serverCodeToSort as string)
                : null

            return (
                <Table.HeaderCell
                    key={header.name}
                    sorted={sorted}
                    width={header.width}
                    onClick={onClickCallback}
                >
                    {header.name}
                </Table.HeaderCell>
            )
        })

        const rows = this.props.CGDSStudies.map((CGDSStudy: DjangoCGDSStudy) => {
            const studyState = this.getStateObj(CGDSStudy.state)
            const studySyncDate = CGDSStudy.date_last_synchronization
                ? formatDateLocale(CGDSStudy.date_last_synchronization)
                : '-'
            return (
                <Table.Row key={CGDSStudy.id} className="clickable" onDoubleClick={() => {
                    if (!studyState.loading && !this.props.sendingSyncRequest) {
                        this.props.editCGDSStudy(CGDSStudy)
                    }
                }}>
                    <TableCellWithTitle value={CGDSStudy.name} className='ellipsis'/>
                    <TableCellWithTitle value={CGDSStudy.description} className='ellipsis'/>
                    <Table.Cell>{studySyncDate}</Table.Cell>
                    <Table.Cell>{this.generateDatasetCell(CGDSStudy.mrna_dataset)}</Table.Cell>
                    <Table.Cell>{this.generateDatasetCell(CGDSStudy.mirna_dataset)}</Table.Cell>
                    <Table.Cell>{this.generateDatasetCell(CGDSStudy.cna_dataset)}</Table.Cell>
                    <Table.Cell>{this.generateDatasetCell(CGDSStudy.methylation_dataset)}</Table.Cell>
                    <Table.Cell>{this.generateDatasetCell(CGDSStudy.clinical_patient_dataset, true)}</Table.Cell>
                    <Table.Cell>{this.generateDatasetCell(CGDSStudy.clinical_sample_dataset, true)}</Table.Cell>
                    <Table.Cell title={studyState.title}>
                        <Icon name={studyState.iconName} color={studyState.color} loading={studyState.loading}/>
                    </Table.Cell>
                    <Table.Cell>
                        {/* Sync button */}
                        <Icon
                            name='sync alternate'
                            color='blue'
                            className='clickable'
                            title='Sync study'
                            loading={studyState.loading}
                            disabled={studyState.loading || this.props.sendingSyncRequest}
                            onClick={() => this.props.confirmCGDSStudyDeletionOrSync(CGDSStudy, false)}
                        />

                        {/* Edit button */}
                        <Icon
                            name='pencil'
                            color='yellow'
                            className='clickable margin-left-30'
                            title='Edit study'
                            disabled={studyState.loading || this.props.sendingSyncRequest}
                            onClick={() => this.props.editCGDSStudy(CGDSStudy)}
                        />
                    </Table.Cell>
                </Table.Row>
            )
        })

        // Calculates total pages
        const totalPages = Math.max(1, Math.ceil(this.props.tableControl.totalRowCount as number / this.props.tableControl.pageSize))

        return (
            <div>
                {/* Table filters */}
                <Form>
                    <Form.Group>
                        {/* Page size */}
                        <Form.Select
                            label='Number of entries'
                            options={[
                                { key: '10', text: '10', value: 10 },
                                { key: '25', text: '25', value: 25 },
                                { key: '50', text: '50', value: 50 },
                                { key: '100', text: '100', value: 100 }
                            ]}
                            name='pageSize'
                            value={this.props.tableControl.pageSize}
                            onChange={(_, { name, value }) => this.props.handleTableControlChanges(name, value)}
                        />
                    </Form.Group>
                </Form>

                <InfoPopup
                    content='These are the available cBioPortal datasets to launch experiments, there are different icons that indicate the state of each dataset. Hover on them to get more information'
                />

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
                    activePage={this.props.tableControl.pageNumber}
                    onPageChange={(_, { activePage }) => this.props.handleTableControlChanges('pageNumber', activePage, false)}
                    size='mini'
                    totalPages={totalPages}
                />
            </div>
        )
    }
}
