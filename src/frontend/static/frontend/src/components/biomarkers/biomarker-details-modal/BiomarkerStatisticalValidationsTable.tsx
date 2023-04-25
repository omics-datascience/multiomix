import React from 'react'
import { PaginatedTable } from '../../common/PaginatedTable'
import { Biomarker, StatisticalValidation } from '../types'
import { Button, Form, Icon, Table } from 'semantic-ui-react'
import { TableCellWithTitle } from '../../common/TableCellWithTitle'
import { formatDateLocale } from '../../../utils/util_functions'

declare const urlBiomarkerStatisticalValidations: string

/** BiomarkerStatisticalValidationsTable props. */
interface BiomarkerStatisticalValidationsTableProps {
    /** Selected Biomarker instance to get its statistical validations. */
    selectedBiomarker: Biomarker,
    /** Callback to open the modal to add a new statistical validation analysis. */
    setOpenModalNewStatValidation: (openModalNewStatValidation: boolean) => void
}

/**
 * Renders a table with all the statistical validations for a specific Biomarker.
 * @param props Component props.
 * @returns Component.
 */
export const BiomarkerStatisticalValidationsTable = (props: BiomarkerStatisticalValidationsTableProps) => {
    // TODO: implement filter by type
    return (
        <PaginatedTable<StatisticalValidation>
            headerTitle='Statistical validations'
            headers={[
                { name: 'Name', serverCodeToSort: 'name', width: 3 },
                { name: 'Description', serverCodeToSort: 'description', width: 4 },
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
            // updateWSKey='' // TODO: implement
            mapFunction={(biomarkerTrainedModel: StatisticalValidation) => {
                return (
                    <Table.Row key={biomarkerTrainedModel.id as number}>
                        <TableCellWithTitle value={biomarkerTrainedModel.name} />
                        <TableCellWithTitle value={biomarkerTrainedModel.description} />
                        <TableCellWithTitle value={formatDateLocale(biomarkerTrainedModel.created as string, 'LLL')} />
                        <Table.Cell width={1}>
                            <React.Fragment>
                                <Icon
                                    name={'chart bar'}
                                    className='clickable'
                                    color='blue'
                                    title='Details'
                                />
                            </React.Fragment>
                        </Table.Cell>
                    </Table.Row>
                )
            }}
        />
    )
}
