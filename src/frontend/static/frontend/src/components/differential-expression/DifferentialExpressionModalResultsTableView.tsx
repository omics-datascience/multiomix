import React, { useState } from 'react'
import { Table, Icon, TableCell, Form, Button } from 'semantic-ui-react'
import { PaginatedTable, PaginationCustomFilter } from '../common/PaginatedTable'
import { DiffExpExperimentDetail } from './types'
import { TableCellWithTitle } from '../common/TableCellWithTitle'
declare const urlDifferentialExpressionExperimentResults: string
declare const urlDownloadDifferentialExpressionResults: string

interface DifferentialExpressionModalResultsProps {
    differentialExpressionAnalysisId?: number;
}

export const DifferentialExpressionModalResultsTableView = (props: DifferentialExpressionModalResultsProps) => {
    const [pValueFilter, setPValueFilter] = useState<number>(0.05)
    const [logFilter, setLogFilter] = useState<number>(1)

    const downloadUrl = () => {
        const searchParams = new URLSearchParams({
            adj_p_val: pValueFilter.toString(),
            log_fc: logFilter.toString(),
        })

        return `${urlDownloadDifferentialExpressionResults}/${props.differentialExpressionAnalysisId}?${searchParams.toString()}`
    }

    const onDownload = () => {
        window.open(downloadUrl(), '_blank', 'noopener,noreferrer')
    }

    const customInputs: PaginationCustomFilter[] = [
        {
            label: 'Log fold change threshold',
            keyForServer: 'fc_threshold',
            defaultValue: 1,
            width: 2,
            options: [
                { key: 'no_log', text: 'No Log Fold' },
                { key: '1', text: '1', value: 1 },
                { key: '2', text: '2', value: 2 },
                { key: '3', text: '3', value: 3 },
                { key: '4', text: '4', value: 4 },
                { key: '5', text: '5', value: 5 },
            ],
            onChangeFilterEvent: (value) => setLogFilter(value),
        },
        {
            label: 'P-value threshold',
            keyForServer: 'p_threshold',
            defaultValue: 0.05,
            width: 2,
            options: [
                { key: 'no_p_val', text: 'No P-value' },
                { key: '0.05', text: '0.05', value: 0.05 },
                { key: '0.01', text: '0.01', value: 0.01 },
            ],
            onChangeFilterEvent: (value) => setPValueFilter(value),
        },
    ]

    return (
        <>
            <PaginatedTable<DiffExpExperimentDetail>
                headerTitle='Experiment results'
                headers={[
                    { name: 'Gene', serverCodeToSort: 'gene' },
                    { name: 'Adjusted p-value', serverCodeToSort: 'adj_p_val' },
                    { name: 'Average expression', serverCodeToSort: 'ave_expr' },
                    { name: 'B statistic', serverCodeToSort: 'b_statistic' },
                    { name: 'Log Fold Change', serverCodeToSort: 'log_fc' },
                    { name: 'P-value', serverCodeToSort: 'p_value' },
                    { name: 'T statistic', serverCodeToSort: 't_statistic' },
                ]}
                defaultSortProp={{ sortField: 'created_at', sortOrderAscendant: false }}
                customFilters={customInputs}
                showSearchInput
                customElements={[
                    <Form.Field key='download-csv-button' className='custom-table-field' title='Download results in a CSV file'>
                        <Button
                            color='green'
                            icon
                            type='button'
                            onClick={onDownload}
                            title='Download results in a CSV file'
                        >
                            <Icon name='file excel' />
                        </Button>
                    </Form.Field>
                ]}
                searchLabel='Gene'
                searchPlaceholder='Search by Gene'
                urlToRetrieveData={urlDifferentialExpressionExperimentResults + props.differentialExpressionAnalysisId + '/'}
                updateWSKey='update_differential_expression_experiments'
                mapFunction={(differentialExpressionAnalysis: DiffExpExperimentDetail) => (
                    <Table.Row key={differentialExpressionAnalysis.id as number}>
                        <TableCellWithTitle value={differentialExpressionAnalysis.gene} />
                        <TableCellWithTitle
                            value={differentialExpressionAnalysis.adj_p_val.toString()}
                        />
                        <TableCell>{differentialExpressionAnalysis.ave_expr.toFixed(4)}</TableCell>
                        <TableCell>
                            {differentialExpressionAnalysis.b_statistic.toFixed(4)}
                        </TableCell>
                        <TableCell>{differentialExpressionAnalysis.log_fc.toFixed(4)}</TableCell>
                        <TableCell>{differentialExpressionAnalysis.p_value}</TableCell>
                        <TableCell>
                            {differentialExpressionAnalysis.t_statistic.toFixed(4)}
                        </TableCell>
                    </Table.Row>
                )}
            />
        </>
    )
}
