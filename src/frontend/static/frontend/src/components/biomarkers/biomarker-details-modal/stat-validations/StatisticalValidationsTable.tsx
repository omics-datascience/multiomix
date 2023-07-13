import React from 'react'
import { PaginatedTable } from '../../../common/PaginatedTable'
import { Biomarker, BiomarkerState, StatisticalValidationForTable } from '../../types'
import { Button, Form, Icon, Table } from 'semantic-ui-react'
import { TableCellWithTitle } from '../../../common/TableCellWithTitle'
import { formatDateLocale } from '../../../../utils/util_functions'
import { FitnessFunctionLabel } from '../../labels/FitnessFunctionLabel'
import { BiomarkerStateLabel } from '../../labels/BiomarkerStateLabel'

declare const urlBiomarkerStatisticalValidations: string

/** StatisticalValidationsTable props. */
interface StatisticalValidationsTableProps {
    /** Selected Biomarker instance to get its statistical validations. */
    selectedBiomarker: Biomarker,
    /** Callback to open the modal to add a new statistical validation analysis. */
    setOpenModalNewStatValidation: (openModalNewStatValidation: boolean) => void,
    /** Callback to open the modal with the results for a StatisticalValidation instance. */
    openStatResult: (statisticalValidation: StatisticalValidationForTable) => void
}

/**
 * Renders a table with all the statistical validations for a specific Biomarker.
 * @param props Component props.
 * @returns Component.
 */
export const StatisticalValidationsTable = (props: StatisticalValidationsTableProps) => {
    return (
        <PaginatedTable<StatisticalValidationForTable>
            headerTitle='Statistical validations'
            headers={[
                { name: 'Name', serverCodeToSort: 'name', width: 3 },
                { name: 'Description', serverCodeToSort: 'description', width: 4 },
                { name: 'State', serverCodeToSort: 'state', textAlign: 'center' },
                { name: 'Model', textAlign: 'center', width: 2 },
                { name: 'Date', serverCodeToSort: 'created' },
                { name: 'Actions' }
            ]}
            queryParams={{ biomarker_pk: props.selectedBiomarker.id }}
            defaultSortProp={{ sortField: 'created', sortOrderAscendant: false }}
            showSearchInput
            searchLabel='Name'
            searchPlaceholder='Search by name or description'
            urlToRetrieveData={urlBiomarkerStatisticalValidations}
            customElements={[
                <Form.Field key={1} className='biomarkers--button--modal' title='New statistical validation'>
                    <Button primary icon onClick={() => { props.setOpenModalNewStatValidation(true) }}>
                        <Icon name='add' />
                    </Button>
                </Form.Field>
            ]}
            updateWSKey='update_statistical_validations'
            mapFunction={(statisticalValidation: StatisticalValidationForTable) => {
                return (
                    <Table.Row key={statisticalValidation.id as number}>
                        <TableCellWithTitle value={statisticalValidation.name} />
                        <TableCellWithTitle value={statisticalValidation.description ?? ''} />
                        <Table.Cell textAlign='center'>
                            {/* NOTE: statistical validations have the same states as Biomarker */}
                            <BiomarkerStateLabel biomarkerState={statisticalValidation.state} />
                        </Table.Cell>
                        <Table.Cell textAlign='center'>
                            <FitnessFunctionLabel fitnessFunction={statisticalValidation.fitness_function} />
                        </Table.Cell>
                        <TableCellWithTitle value={formatDateLocale(statisticalValidation.created as string, 'L')} />
                        <Table.Cell width={1}>
                            {statisticalValidation.state === BiomarkerState.COMPLETED &&
                                <Icon
                                    name='chart area'
                                    onClick={() => { props.openStatResult(statisticalValidation) }}
                                    className='clickable'
                                    color='blue'
                                    title='See results'
                                />
                            }
                        </Table.Cell>
                    </Table.Row>
                )
            }}
        />
    )
}
