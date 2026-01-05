import React, { useMemo } from 'react'
import { Table, Icon, TableCell, Form, Button } from 'semantic-ui-react'
import { PaginatedTable } from '../common/PaginatedTable'
import { DiffExpExperimentDetail } from './types'
import { TableCellWithTitle } from '../common/TableCellWithTitle'
declare const urlDifferentialExpressionExperimentResults: string
declare const urlDownloadDifferentialExpressionResults: string

interface DifferentialExpressionModalResultsProps {
    differentialExpressionAnalysisId?: number;
}

export const DifferentialExpressionModalResultsTableView = (props: DifferentialExpressionModalResultsProps) => {
    const downloadUrl = useMemo(() => {
        const searchParams = new URLSearchParams()

        return `${urlDownloadDifferentialExpressionResults}/${props.differentialExpressionAnalysisId}?${searchParams.toString()}`
    }, [props.differentialExpressionAnalysisId])

    const onDownload = () => {
        window.open(downloadUrl, '_blank', 'noopener,noreferrer')
    }

    return (
        <>
            <PaginatedTable<DiffExpExperimentDetail>
                headerTitle='Differential Expressions experiment result'
                headers={[
                    { name: 'Gene', serverCodeToSort: 'gene' },
                    { name: 'adj_p_val', serverCodeToSort: 'adj_p_val' },
                    { name: 'ave_expr', serverCodeToSort: 'ave_expr' },
                    { name: 'b_statistic', serverCodeToSort: 'b_statistic' },
                    { name: 'log_fc', serverCodeToSort: 'log_fc' },
                    { name: 'is_significant', serverCodeToSort: 'is_significant' },
                    { name: 'p_value', serverCodeToSort: 'p_value' },
                    { name: 't_statistic', serverCodeToSort: 't_statistic' },
                ]}
                defaultSortProp={{ sortField: 'created_at', sortOrderAscendant: false }}
                customFilters={undefined}
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
                        <TableCell>{differentialExpressionAnalysis.ave_expr}</TableCell>
                        <TableCell>
                            {differentialExpressionAnalysis.b_statistic}
                        </TableCell>
                        <TableCell>{differentialExpressionAnalysis.log_fc}</TableCell>
                        <TableCell textAlign='center'>
                            {differentialExpressionAnalysis.is_significant
                                ? (
                                    <Icon title='Is significant' name='check' color='green' />
                                )
                                : (
                                    <Icon title='Is not significant' name='close' color='red' />
                                )}
                        </TableCell>
                        <TableCell>{differentialExpressionAnalysis.p_value}</TableCell>
                        <TableCell>
                            {differentialExpressionAnalysis.t_statistic}
                        </TableCell>
                    </Table.Row>
                )}
            />
        </>
    )
}
