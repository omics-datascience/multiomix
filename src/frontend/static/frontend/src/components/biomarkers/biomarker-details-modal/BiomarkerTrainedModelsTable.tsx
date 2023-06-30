import React, { useState } from 'react'
import { PaginatedTable } from '../../common/PaginatedTable'
import { Biomarker, BiomarkerState, TrainedModel } from '../types'
import { Button, Form, Icon, Table } from 'semantic-ui-react'
import { TableCellWithTitle } from '../../common/TableCellWithTitle'
import { formatDateLocale } from '../../../utils/util_functions'
import { Nullable } from '../../../utils/interfaces'
import { biomarkerStateOptions, fitnessFunctionsOptions } from '../utils'
import { FitnessFunctionLabel } from '../labels/FitnessFunctionLabel'
import { NewTrainedModelModal } from './trained-models/NewTrainedModelModal'
import { TrainedModelStateLabel } from '../labels/TrainedModelStateLabel'

declare const urlBiomarkerTrainedModels: string

/** BiomarkerTrainedModelsTable props. */
interface BiomarkerTrainedModelsPanelProps {
    /** Selected Biomarker instance to retrieve its TrainedModel instances. */
    selectedBiomarker: Biomarker,
    /** If `true`, shows only the TrainedModel with state = `BiomarkerState.COMPLETED`. */
    showOnlyCompleted?: boolean,
    /** If `true`, shows a button to add a new TrainedModel. */
    allowFullManagement: boolean,
    /** Selected TrainedModel instance. */
    selectedTrainedModel?: Nullable<TrainedModel>,
    /** Callback to update the selected TrainedModel instance. */
    selectTrainedModel?: (newSelectedTrainedModel: TrainedModel) => void
}

/**
 * Renders a paginated table to select a TrainedModel instance.
 * @param props Component props.
 * @returns Component.
 */
export const BiomarkerTrainedModelsTable = (props: BiomarkerTrainedModelsPanelProps) => {
    const [showNewTrainedModelModal, setShowNewTrainedModelModal] = useState(false)

    const showOnlyCompleted = props.showOnlyCompleted ?? false
    let stateFilter
    let extraQueryParams
    if (showOnlyCompleted) {
        // In case of only showing completed, avoids showing a filter by TrainedModel's state
        stateFilter = []
        extraQueryParams = { state: BiomarkerState.COMPLETED }
    } else {
        stateFilter = [{ label: 'State', keyForServer: 'state', defaultValue: '', placeholder: 'State', options: biomarkerStateOptions }]
        extraQueryParams = {}
    }

    return (
        <>
            {/* New TrainedModel modal */}
            <NewTrainedModelModal
                showNewTrainedModelModal={showNewTrainedModelModal}
                setShowNewTrainedModelModal={setShowNewTrainedModelModal}
                selectedBiomarker={props.selectedBiomarker}
            />

            {/* TrainedModels table. */}
            <PaginatedTable<TrainedModel>
                headerTitle='Trained models'
                headers={[
                    { name: 'Name', serverCodeToSort: 'name', width: 3 },
                    { name: 'Description', serverCodeToSort: 'description', width: 4 },
                    { name: 'State', serverCodeToSort: 'state', width: 1 },
                    { name: 'Model', serverCodeToSort: 'fitness_function', width: 1 },
                    { name: 'Date', serverCodeToSort: 'created' },
                    { name: 'Metric', serverCodeToSort: 'fitness_metric' },
                    { name: 'Best CV metric', serverCodeToSort: 'best_fitness_value' }
                    // TODO: add actions column with an option to see the details of a trained model
                ]}
                defaultSortProp={{ sortField: 'created', sortOrderAscendant: false }}
                queryParams={{ biomarker_pk: props.selectedBiomarker.id, ...extraQueryParams }}
                customFilters={[
                    { label: 'Model type', keyForServer: 'fitness_function', defaultValue: '', placeholder: 'Model type', options: fitnessFunctionsOptions },
                    ...stateFilter
                ]}
                customElements={
                    props.allowFullManagement
                        ? [
                            <Form.Field key={1} className='biomarkers--button--modal' title='New trained model'>
                                <Button primary icon onClick={() => { setShowNewTrainedModelModal(true) }}>
                                    <Icon name='add' />
                                </Button>
                            </Form.Field>
                        ]
                        : undefined
                }
                showSearchInput
                searchLabel='Name'
                searchPlaceholder='Search by name or description'
                urlToRetrieveData={urlBiomarkerTrainedModels}
                updateWSKey='update_trained_models'
                mapFunction={(trainedModel: TrainedModel) => {
                    return (
                        <Table.Row
                            key={trainedModel.id as number}
                            className={props.selectTrainedModel ? 'clickable' : undefined}
                            active={trainedModel.id === props.selectedTrainedModel?.id}
                            onClick={() => {
                                if (props.selectTrainedModel) {
                                    props.selectTrainedModel(trainedModel)
                                }
                            }}
                        >
                            <TableCellWithTitle value={trainedModel.name} />
                            <TableCellWithTitle value={trainedModel.description ?? ''} />
                            <Table.Cell textAlign='center'>
                                {/* NOTE: trained models have the same states as Biomarker */}
                                <TrainedModelStateLabel trainedModelStateState={trainedModel.state} />
                            </Table.Cell>
                            <Table.Cell><FitnessFunctionLabel fitnessFunction={trainedModel.fitness_function} /></Table.Cell>
                            <TableCellWithTitle value={formatDateLocale(trainedModel.created as string, 'LLL')} />
                            <Table.Cell>{trainedModel.fitness_metric ?? '-'}</Table.Cell>
                            <Table.Cell>{trainedModel.best_fitness_value ? trainedModel.best_fitness_value.toFixed(4) : '-'}</Table.Cell>
                        </Table.Row>
                    )
                }}
            />
        </>
    )
}
