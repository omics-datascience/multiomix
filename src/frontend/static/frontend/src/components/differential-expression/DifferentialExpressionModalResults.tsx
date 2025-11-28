import React from 'react'
import { DifferentialExpressionAnalysis, DiffExpExperimentDetail } from './types'
import { Icon, Modal, Table, TableCell } from 'semantic-ui-react'
import { TableCellWithTitle } from '../common/TableCellWithTitle'
import { PaginatedTable } from '../common/PaginatedTable'

declare const urlDifferentialExpressionExperimentResults: string

interface DifferentialExpressionModalResultsProps {
    isOpen: boolean
    differentialExpressionAnalysis: DifferentialExpressionAnalysis | null
    closeModal: () => void
}

export const DifferentialExpressionModalResults = (props: DifferentialExpressionModalResultsProps) => {
    return (
        <Modal
            open={props.isOpen}
            closeIcon={<Icon name='close' size='large' />}
            closeOnEscape={false}
            closeOnDimmerClick={false}
            closeOnDocumentClick={false}
            className='space-modal large-modal'
            onClose={props.closeModal}
        >
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
                    /*  <Form.Field key={1} className='custom-table-field' title='Add new Biomarker'>
                        <Button
                            primary
                            icon
                            onClick={() => this.setState({ formBiomarker: this.getDefaultFormBiomarker(), openCreateEditBiomarkerModal: true })}
                        >
                            <Icon name='add' />
                        </Button>
                    </Form.Field> */
                ]}
                searchLabel='Gene'
                searchPlaceholder='Search by Gene'
                urlToRetrieveData={urlDifferentialExpressionExperimentResults + props.differentialExpressionAnalysis?.id + '/'}
                updateWSKey='update_differential_expression_experiments'
                mapFunction={(differentialExpressionAnalysis: DiffExpExperimentDetail) => {
                    return (
                        <Table.Row key={differentialExpressionAnalysis.id as number}>
                            <TableCellWithTitle value={differentialExpressionAnalysis.gene} />
                            <TableCellWithTitle value={differentialExpressionAnalysis.adj_p_val.toString()} />
                            <TableCell>
                                {differentialExpressionAnalysis.ave_expr}
                            </TableCell>
                            <TableCell>
                                {differentialExpressionAnalysis.b_statistic}
                            </TableCell>
                            <TableCell>
                                {differentialExpressionAnalysis.log_fc}
                            </TableCell>
                            <TableCell textAlign='center'>
                                {
                                    differentialExpressionAnalysis.is_significant
                                        ? (
                                            <Icon
                                                title='Is significant'
                                                name='check'
                                                color='green'
                                            />
                                        )
                                        : (
                                            <Icon
                                                title='Is not significant'
                                                name='close'
                                                color='red'
                                            />
                                        )
                                }
                            </TableCell>
                            <TableCell>
                                {differentialExpressionAnalysis.p_value}
                            </TableCell>
                            <TableCell>
                                {differentialExpressionAnalysis.t_statistic}
                            </TableCell>
                        </Table.Row>
                    )
                }}
            />
        </Modal>
    )
}
