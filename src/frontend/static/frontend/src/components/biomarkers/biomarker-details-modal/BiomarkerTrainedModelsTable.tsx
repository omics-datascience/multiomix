import React from 'react'
import { PaginatedTable } from '../../common/PaginatedTable'
import { TrainedModel } from '../types'
import { Icon, Table } from 'semantic-ui-react'
import { TableCellWithTitle } from '../../common/TableCellWithTitle'
import { formatDateLocale } from '../../../utils/util_functions'

declare const urlBiomarkerTrainedModels: string

interface BiomarkerTrainedModelsProps {

}

export const BiomarkerTrainedModelsTable = (_props: BiomarkerTrainedModelsProps) => {
    return (
        <PaginatedTable<TrainedModel>
            headerTitle='Biomarkers'
            headers={[
                // { name: 'Name', serverCodeToSort: 'name', width: 3 },
                // { name: 'Description', serverCodeToSort: 'description', width: 4 },
                // { name: 'Tag', serverCodeToSort: 'tag' },
                // { name: 'State', serverCodeToSort: 'state', textAlign: 'center' },
                // { name: 'Origin', serverCodeToSort: 'origin', textAlign: 'center' },
                // { name: 'Date', serverCodeToSort: 'upload_date' },
                // { name: '# mRNAS', serverCodeToSort: 'number_of_mrnas', width: 1 },
                // { name: '# miRNAS', serverCodeToSort: 'number_of_mirnas', width: 1 },
                // { name: '# CNA', serverCodeToSort: 'number_of_cnas', width: 1 },
                // { name: '# Methylation', serverCodeToSort: 'number_of_methylations', width: 1 },
                { name: 'Actions' }
            ]}
            defaultSortProp={{ sortField: 'upload_date', sortOrderAscendant: false }}
            showSearchInput
            searchLabel='Name'
            searchPlaceholder='Search by name'
            urlToRetrieveData={urlBiomarkerTrainedModels}
            updateWSKey='update_biomarkers'
            mapFunction={(biomarkerTrainedModel: TrainedModel) => {
                return (
                    <Table.Row key={biomarkerTrainedModel.id as number}>
                        {/* <TableCellWithTitle value={biomarkerTrainedModel.name} /> */}
                        {/* <TableCellWithTitle value={biomarkerTrainedModel.description} /> */}
                        <Table.Cell value={biomarkerTrainedModel.best_fitness_value} />
                        <TableCellWithTitle value={formatDateLocale(biomarkerTrainedModel.created as string, 'LLL')} />
                        <Table.Cell width={1}>
                            {/* Users can modify or delete own biomarkers or the ones which the user is admin of */}
                            <React.Fragment>
                                {/* Details button */}
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
