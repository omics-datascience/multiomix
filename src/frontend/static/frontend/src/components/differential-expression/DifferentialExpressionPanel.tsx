import React from 'react'
import { Base } from '../Base'
import { DifferentialExpressionForm } from './DifferentialExpressionForm'
import { DropdownItemProps, Grid, Table } from 'semantic-ui-react'
import { PaginatedTable, PaginationCustomFilter } from '../common/PaginatedTable'
import { TableCellWithTitle } from '../common/TableCellWithTitle'

declare const urlDifferentialExpressionList:string

export const DiferentialExpressionPanel = () => {
    /**
     * Generates default table's Filters.
     * @returns Default object for table's Filters
     */
    const getDefaultFilters = (): PaginationCustomFilter[] => {
        const tagOptions: DropdownItemProps[] = [{ id: 1, name: 'asd' }].map((tag) => {
            const id = tag.id as number
            return { key: id, value: id, text: tag.name }
        })

        tagOptions.unshift({ key: 'no_tag', text: 'No tag' })

        return [
            { label: 'Tag', keyForServer: 'tag', defaultValue: '', placeholder: 'Select an existing Tag', options: tagOptions, width: 3 }
        ]
    }

    return (
        <Base activeItem='differential-expression' wrapperClass='wrapper'>
            <Grid columns={2} padded stackable divided className='biomarkers--modal--container'>
                <Grid.Column width={4} textAlign='center'>

                    <DifferentialExpressionForm />

                </Grid.Column>
                <Grid.Column width={12}>
                    <PaginatedTable<any>
                        headerTitle='Biomarkers'
                        headers={[
                            { name: 'Name', serverCodeToSort: 'name', width: 3 },
                            { name: 'Description', serverCodeToSort: 'description', width: 4 },
                            { name: 'Tag', serverCodeToSort: 'tag' },
                            { name: 'State', serverCodeToSort: 'state', textAlign: 'center' },
                            { name: 'Origin', serverCodeToSort: 'origin', textAlign: 'center' },
                            { name: 'Date', serverCodeToSort: 'upload_date' },
                            { name: '# mRNAS', serverCodeToSort: 'number_of_mrnas', width: 1 },
                            { name: '# miRNAS', serverCodeToSort: 'number_of_mirnas', width: 1 },
                            { name: '# CNA', serverCodeToSort: 'number_of_cnas', width: 1 },
                            { name: '# Methylation', serverCodeToSort: 'number_of_methylations', width: 1 },
                            { name: 'Public', width: 1 },
                            { name: 'Shared', width: 1 },
                            { name: 'Actions', width: 2 }
                        ]}
                        defaultSortProp={{ sortField: 'upload_date', sortOrderAscendant: false }}
                        customFilters={getDefaultFilters()}
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
                        searchLabel='Name'
                        searchPlaceholder='Search by name'
                        urlToRetrieveData={urlDifferentialExpressionList}
                        updateWSKey='update_biomarkers'
                        mapFunction={(experiment: any) => {
                            console.log(experiment)
                            return (
                                <Table.Row key={experiment.id as number}>
                                    <TableCellWithTitle value={experiment.name} />
                                </Table.Row>
                            )
                        }}
                    />
                </Grid.Column>
            </Grid>
        </Base>
    )
}
