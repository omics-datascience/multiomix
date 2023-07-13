import React from 'react'
import { Table } from 'semantic-ui-react'
import { RowHeader } from '../../../../../utils/django_interfaces'
import { formatDateLocale } from '../../../../../utils/util_functions'
import { PaginatedTable, PaginationCustomFilter } from '../../../../common/PaginatedTable'
import { TableCellWithTitle } from '../../../../common/TableCellWithTitle'
import { TagLabel } from '../../../../common/TagLabel'
import { Biomarker, FeatureSelectionPanelData } from '../../../types'
import './../featureSelection.css'

declare const urlBiomarkersCRUD: string

interface FeatureSelectionStep1Props {
    /** Filters to show in the table. */
    customFilters: PaginationCustomFilter[],
    /** Feature selection data. */
    featureSelectionData: FeatureSelectionPanelData,
    defaultHeaders: RowHeader<Biomarker>[],
    markBiomarkerAsSelected: (biomarker: Biomarker) => void,
    handleCompleteStep1: (selectedBiomarker: Biomarker) => void,
}

export const FeatureSelectionStep1 = (props: FeatureSelectionStep1Props) => {
    const {
        customFilters,
        featureSelectionData,
        defaultHeaders,
        markBiomarkerAsSelected,
        handleCompleteStep1
    } = props

    return (
        <PaginatedTable<Biomarker>
            headerTitle='Biomarkers'
            headers={defaultHeaders}
            customFilters={customFilters}
            queryParams={{
                onlySuccessful: true // Only show Biomarkers in COMPLETED state
            }}
            defaultSortProp={{ sortField: 'upload_date', sortOrderAscendant: false }}
            showSearchInput
            searchLabel='Name'
            searchPlaceholder='Search by name'
            urlToRetrieveData={urlBiomarkersCRUD}
            updateWSKey='update_biomarkers'
            mapFunction={(biomarker: Biomarker) => (
                <Table.Row
                    active={biomarker.id === featureSelectionData.selectedBiomarker?.id}
                    onClick={() => markBiomarkerAsSelected(biomarker)}
                    onDoubleClick={() => handleCompleteStep1(biomarker)}
                    key={biomarker.id as number}
                    className='clickable'
                >
                    <TableCellWithTitle value={biomarker.name} />
                    <TableCellWithTitle value={biomarker.description} />
                    <Table.Cell><TagLabel tag={biomarker.tag} /></Table.Cell>
                    <TableCellWithTitle value={formatDateLocale(biomarker.upload_date as string, 'L')} />
                    <Table.Cell>{biomarker.number_of_mrnas}</Table.Cell>
                    <Table.Cell>{biomarker.number_of_mirnas}</Table.Cell>
                    <Table.Cell>{biomarker.number_of_cnas}</Table.Cell>
                    <Table.Cell>{biomarker.number_of_methylations}</Table.Cell>
                </Table.Row>
            )}
        />
    )
}
