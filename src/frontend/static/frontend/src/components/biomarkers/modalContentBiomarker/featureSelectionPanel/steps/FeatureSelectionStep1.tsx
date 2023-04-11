import React from 'react'
import { Button, Table } from 'semantic-ui-react'
import { RowHeader } from '../../../../../utils/django_interfaces'
import { formatDateLocale } from '../../../../../utils/util_functions'
import { PaginatedTable, PaginationCustomFilter } from '../../../../common/PaginatedTable'
import { TableCellWithTitle } from '../../../../common/TableCellWithTitle'
import { TagLabel } from '../../../../common/TagLabel'
import { Biomarker, FeatureSelectionPanelData } from '../../../types'
import './../featureSelection.css'

interface Props {
    getDefaultHeaders: () => RowHeader<Biomarker>[],
    getDefaultFilters: PaginationCustomFilter[],
    urlBiomarkersCRUD: string,
    featureSelection: FeatureSelectionPanelData,
    markBiomarkerAsSelected: (biomarker: Biomarker) => void,
    handleCompleteStep1: (selectedBiomarker: Biomarker) => void,
}
export const FeatureSelectionStep1 = (props: Props) => {
    return (
        <>
            <div className='selection-step-container'>
                <PaginatedTable<Biomarker>
                    headerTitle='Biomarkers'
                    headers={props.getDefaultHeaders()}
                    customFilters={props.getDefaultFilters}
                    queryParams={{
                        onlySuccessful: true // Only show Biomarkers in COMPLETED state
                    }}
                    defaultSortProp={{ sortField: 'upload_date', sortOrderAscendant: false }}
                    showSearchInput
                    searchLabel='Name'
                    searchPlaceholder='Search by name'
                    urlToRetrieveData={props.urlBiomarkersCRUD}
                    updateWSKey='update_biomarkers'
                    mapFunction={(biomarker: Biomarker) => (
                        <Table.Row
                            active={biomarker.id === props.featureSelection.selectedBiomarker?.id}
                            onClick={() => props.markBiomarkerAsSelected(biomarker)}
                            onDoubleClick={() => props.handleCompleteStep1(biomarker)}
                            key={biomarker.id as number}
                            className='clickable'
                        >
                            <TableCellWithTitle value={biomarker.name} />
                            <TableCellWithTitle value={biomarker.description} />
                            <Table.Cell><TagLabel tag={biomarker.tag} /></Table.Cell>
                            <TableCellWithTitle value={formatDateLocale(biomarker.upload_date as string, 'LLL')} />
                            <Table.Cell>{biomarker.number_of_mrnas}</Table.Cell>
                            <Table.Cell>{biomarker.number_of_mirnas}</Table.Cell>
                            <Table.Cell>{biomarker.number_of_cnas}</Table.Cell>
                            <Table.Cell>{biomarker.number_of_methylations}</Table.Cell>
                        </Table.Row>
                    )}
                />
            </div>
            <div className='selections-buttons-container'>
                <Button
                    color="green"
                    onClick={() => props.handleCompleteStep1(props.featureSelection.selectedBiomarker as Biomarker)}
                    disabled={props.featureSelection.selectedBiomarker === null}
                >
                    Confirm
                </Button>
            </div>
        </>
    )
}
