import React, { useEffect, useState } from 'react'
import { PaginatedTable } from '../../common/PaginatedTable'
import { Biomarker, TrainedModel } from '../types'
import { Button, Form, Icon, Table } from 'semantic-ui-react'
import { TableCellWithTitle } from '../../common/TableCellWithTitle'
import { formatDateLocale } from '../../../utils/util_functions'
import { Nullable } from '../../../utils/interfaces'
import { fitnessFunctionsOptions } from '../utils'
import { FitnessFunctionLabel } from '../labels/FitnessFunctionLabel'
import { NewTrainedModelModal } from './trained-models/NewTrainedModelModal'

declare const urlBiomarkerTrainedModels: string

/** BiomarkerTrainedModelsTable props. */
interface BiomarkerTrainedModelsProps {
    /** Selected Biomarker instance to retrieve its TrainedModel instances. */
    selectedBiomarker: Biomarker,
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
export const BiomarkerTrainedModelsTable = (props: BiomarkerTrainedModelsProps) => {
    const [showNewTrainedModelModal, setShowNewTrainedModelModal] = useState(false)

    // TODO: remove this block
    useEffect(() => {
        setTimeout(() => {
            setShowNewTrainedModelModal(true)
        }, 500)
    }, [])

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
                    { name: 'Date', serverCodeToSort: 'created' },
                    { name: 'Model', serverCodeToSort: 'fitness_function' },
                    { name: 'Best fitness', serverCodeToSort: 'best_fitness_value' }
                ]}
                defaultSortProp={{ sortField: 'upload_date', sortOrderAscendant: false }}
                queryParams={{ biomarker_pk: props.selectedBiomarker.id }}
                customFilters={[
                    { label: 'Model type', keyForServer: 'fitness_function', defaultValue: '', placeholder: 'Model type', options: fitnessFunctionsOptions }
                ]}
                customElements={
                    props.allowFullManagement
                        ? [
                            <Form.Field key={1} className='biomarkers--button--modal' title='Add new Biomarker'>
                                <Button primary icon onClick={() => { setShowNewTrainedModelModal(true) }}>
                                    <Icon name='add' />
                                </Button>
                            </Form.Field>
                        ] : undefined
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
                            <TableCellWithTitle value={formatDateLocale(trainedModel.created as string, 'LLL')} />
                            <Table.Cell><FitnessFunctionLabel fitnessFunction={trainedModel.fitness_function} /></Table.Cell>
                            <Table.Cell>{trainedModel.best_fitness_value.toFixed(4)}</Table.Cell>
                        </Table.Row>
                    )
                }}
            />
        </>
    )
}
