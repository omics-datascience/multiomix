import React from 'react'
import { PaginatedTable } from '../../common/PaginatedTable'
import { Biomarker, TrainedModel } from '../types'
import { Icon, Table } from 'semantic-ui-react'
import { TableCellWithTitle } from '../../common/TableCellWithTitle'
import { formatDateLocale } from '../../../utils/util_functions'
import { Nullable } from '../../../utils/interfaces'

declare const urlBiomarkerTrainedModels: string

/** BiomarkerTrainedModelsTable props. */
interface BiomarkerTrainedModelsProps {
    /** Selected Biomarker instance to retrieve its TrainedModel instances. */
    selectedBiomarker: Biomarker,
    /** Selected TrainedModel instance. */
    selectedTrainedModel: Nullable<TrainedModel>,
    /** Callback to update the selected TrainedModel instance. */
    selectTrainedModel: (newSelectedTrainedModel: TrainedModel) => void
}

/**
 * Renders a paginated table to select a TrainedModel instance.
 * @param props Component props.
 * @returns Component.
 */
export const BiomarkerTrainedModelsTable = (props: BiomarkerTrainedModelsProps) => {
    // TODO: parametrize the column of actions. It's not useful in the StatisticalValidations panel.
    return (
        <PaginatedTable<TrainedModel>
            headerTitle='Trained models'
            headers={[
                { name: 'Name', serverCodeToSort: 'name', width: 3 },
                { name: 'Description', serverCodeToSort: 'description', width: 4 },
                { name: 'Date', serverCodeToSort: 'created' },
                { name: 'Best fitness', serverCodeToSort: 'best_fitness_value' },
                { name: 'Actions' }
            ]}
            defaultSortProp={{ sortField: 'upload_date', sortOrderAscendant: false }}
            showSearchInput
            queryParams={{ biomarker_pk: props.selectedBiomarker.id }}
            searchLabel='Name'
            searchPlaceholder='Search by name'
            urlToRetrieveData={urlBiomarkerTrainedModels}
            updateWSKey='update_biomarkers'
            mapFunction={(biomarkerTrainedModel: TrainedModel) => {
                return (
                    <Table.Row
                        key={biomarkerTrainedModel.id as number}
                        className="clickable"
                        active={biomarkerTrainedModel.id === props.selectedTrainedModel?.id}
                        onClick={() => { props.selectTrainedModel(biomarkerTrainedModel) }}
                    >
                        <TableCellWithTitle value={biomarkerTrainedModel.name} />
                        <TableCellWithTitle value={biomarkerTrainedModel.description ?? ''} />
                        <TableCellWithTitle value={formatDateLocale(biomarkerTrainedModel.created as string, 'LLL')} />
                        <Table.Cell>{biomarkerTrainedModel.best_fitness_value.toFixed(4)}</Table.Cell>
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
