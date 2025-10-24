import React from 'react'
import { DifferentialExpressionAnalysis } from './types'
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
            <PaginatedTable<DifferentialExpressionAnalysis>
                headerTitle='Differential Expressions experiment result'
                headers={[
                    { name: 'Name', serverCodeToSort: 'name', width: 3 },
                    { name: 'Description', serverCodeToSort: 'description', width: 4 },
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
                searchLabel='Name/Description'
                searchPlaceholder='Search by name/description'
                urlToRetrieveData={urlDifferentialExpressionExperimentResults + props.differentialExpressionAnalysis?.id + '/'}
                updateWSKey='update_differential_expression_experiments'
                mapFunction={(differentialExpressionAnalysis: any) => {
                    return (
                        <Table.Row key={differentialExpressionAnalysis.id as number}>
                            <TableCellWithTitle value='differentialExpressionAnalysis.name' />
                            <TableCellWithTitle value={differentialExpressionAnalysis.description} />
                            <TableCell>
                                <>hola</>
                            </TableCell>
                        </Table.Row>
                    )
                }}
            />
        </Modal>
    )
}
