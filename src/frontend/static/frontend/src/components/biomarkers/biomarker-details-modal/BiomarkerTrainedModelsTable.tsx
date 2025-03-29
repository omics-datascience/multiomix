import React, { useState } from 'react'
import { PaginatedTable, PaginationCustomFilter } from '../../common/PaginatedTable'
import { Biomarker, BiomarkerState, TrainedModelForTable, TrainedModelState } from '../types'
import { Button, Form, Header, Icon, Modal, Table } from 'semantic-ui-react'
import { TableCellWithTitle } from '../../common/TableCellWithTitle'
import { alertGeneralError, formatDateLocale, getDjangoHeader } from '../../../utils/util_functions'
import { Nullable } from '../../../utils/interfaces'
import { biomarkerStateOptions, fitnessFunctionsOptions } from '../utils'
import { FitnessFunctionLabel } from '../labels/FitnessFunctionLabel'
import { NewTrainedModelModal } from './trained-models/NewTrainedModelModal'
import { TrainedModelStateLabel } from '../labels/TrainedModelStateLabel'
import ky from 'ky'
import { StopExperimentButton } from '../../pipeline/all-experiments-view/StopExperimentButton'
import { DeleteExperimentButton } from '../../pipeline/all-experiments-view/DeleteExperimentButton'
import { TableCellSources } from '../../common/TableCellSources'

declare const urlBiomarkerTrainedModels: string
declare const urlStopTrainedModel: string

/** BiomarkerTrainedModelsTable props. */
interface BiomarkerTrainedModelsPanelProps {
    /** Selected Biomarker instance to retrieve its TrainedModel instances. */
    selectedBiomarker: Biomarker,
    /** If `true`, shows only the TrainedModel with state = `BiomarkerState.COMPLETED`. */
    showOnlyCompleted?: boolean,
    /** If `true`, shows a button to add a new TrainedModel and the column of actions. */
    allowFullManagement: boolean,
    /** Selected TrainedModel instance. */
    selectedTrainedModel?: Nullable<TrainedModelForTable>,
    /** Callback to update the selected TrainedModel instance. */
    selectTrainedModel?: (newSelectedTrainedModel: TrainedModelForTable) => void
}

/**
 * Renders a paginated table to select a TrainedModel instance.
 * @param props Component props.
 * @returns Component.
 */
export const BiomarkerTrainedModelsTable = (props: BiomarkerTrainedModelsPanelProps) => {
    const [showNewTrainedModelModal, setShowNewTrainedModelModal] = useState(false)

    const [stoppingTrainedModel, setStoppingTrainedModel] = useState(false)
    const [trainedModelToStop, setTrainedModelToStop] = useState<Nullable<TrainedModelForTable>>(null)

    const [deletingTrainedModel, setDeletingTrainedModel] = useState(false)
    const [trainedModelToRemove, setTrainedModelToRemove] = useState<Nullable<TrainedModelForTable>>(null)

    /** Makes a request to stop an FSExperiment. */
    const stopFSExperiment = () => {
        if (trainedModelToStop === null) {
            return
        }

        setStoppingTrainedModel(true)

        // Sets the Request's Headers
        const myHeaders = getDjangoHeader()
        const trainedModelId = trainedModelToStop.id as number // This is safe

        ky.get(urlStopTrainedModel, { headers: myHeaders, searchParams: { trainedModelId } }).then((response) => {
            // If OK closes the modal
            if (response.ok) {
                handleCloseStopTrainedModel()
            } else {
                alertGeneralError()
            }
        }).catch((err) => {
            alertGeneralError()
            console.log('Error stopping TrainedModel:', err)
        }).finally(() => {
            setStoppingTrainedModel(false)
        })
    }

    /** Makes a request to delete a TrainedModel. */
    const deleteTrainedModel = () => {
        // Sets the Request's Headers
        if (!trainedModelToRemove) {
            return
        }

        setDeletingTrainedModel(true)

        const myHeaders = getDjangoHeader()
        const deleteURL = `${urlBiomarkerTrainedModels}/${trainedModelToRemove.id}/`
        ky.delete(deleteURL, { headers: myHeaders }).then((response) => {
            // If OK is returned refresh the tags
            if (response.ok) {
                handleCloseRemoveTrainedModel()
            }
        }).catch((err) => {
            alertGeneralError()
            console.log('Error deleting TrainedModel:', err)
        }).finally(() => {
            setDeletingTrainedModel(false)
        })
    }

    /** Sets the trainedModelToStop to null to close the modal to confirm the action. */
    const handleCloseStopTrainedModel = () => {
        setTrainedModelToStop(null)
    }

    /** Sets the trainedModelToRemove to null to close the modal to confirm the action. */
    const handleCloseRemoveTrainedModel = () => {
        setTrainedModelToRemove(null)
    }

    /**
     * Generates the modal to confirm an Experiment stopping
     * @returns Modal component. Null if no Experiment was selected to stop
     */
    const getExperimentStopConfirmModals = () => {
        if (!trainedModelToStop) {
            return null
        }

        return (
            <Modal size='small' open={trainedModelToStop !== null} onClose={handleCloseStopTrainedModel} centered={false}>
                <Header icon='stop' content='Stop training' />
                <Modal.Content>
                    Are you sure you want to stop the training of model <strong>{trainedModelToStop.name}</strong>?
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={handleCloseStopTrainedModel}>
                        Cancel
                    </Button>
                    <Button
                        color='red'
                        onClick={stopFSExperiment}
                        loading={stoppingTrainedModel}
                        disabled={stoppingTrainedModel}
                    >
                        Stop
                    </Button>
                </Modal.Actions>
            </Modal>
        )
    }

    /**
     * Generates the modal to confirm a biomarker deletion
     * @returns Modal component. Null if no Tag was selected to delete
     */
    const getDeletionConfirmModal = () => {
        if (!trainedModelToRemove) {
            return null
        }

        return (
            <Modal size='small' open={trainedModelToRemove !== null} onClose={handleCloseRemoveTrainedModel} centered={false}>
                <Header icon='trash' content='Delete Biomarker' />
                <Modal.Content>
                    Are you sure you want to delete the Biomarker <strong>{trainedModelToRemove.name}</strong>?
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={handleCloseRemoveTrainedModel}>
                        Cancel
                    </Button>
                    <Button color='red' onClick={deleteTrainedModel} loading={deletingTrainedModel} disabled={deletingTrainedModel}>
                        Delete
                    </Button>
                </Modal.Actions>
            </Modal>
        )
    }

    const showOnlyCompleted = props.showOnlyCompleted ?? false
    let stateFilter
    let extraQueryParams

    if (showOnlyCompleted) {
        // In case of only showing completed, avoids showing a filter by TrainedModel's state
        stateFilter = []
        extraQueryParams = { state: BiomarkerState.COMPLETED }
    } else {
        const stateOption: PaginationCustomFilter = {
            label: 'State',
            keyForServer: 'state',
            defaultValue: '',
            placeholder: 'State',
            options: biomarkerStateOptions,
            width: 3
        }
        stateFilter = [stateOption]
        extraQueryParams = {}
    }

    const actionColumn = props.allowFullManagement ? [{ name: 'Actions' }] : []

    return (
        <>
            {/* New TrainedModel modal */}
            <NewTrainedModelModal
                showNewTrainedModelModal={showNewTrainedModelModal}
                setShowNewTrainedModelModal={setShowNewTrainedModelModal}
                selectedBiomarker={props.selectedBiomarker}
            />

            {/* Modal to confirm stopping the TrainedModel */}
            {getExperimentStopConfirmModals()}

            {/* Modal to confirm deleting the TrainedModel */}
            {getDeletionConfirmModal()}

            {/* TrainedModels table. */}
            <PaginatedTable<TrainedModelForTable>
                headerTitle='Trained models'
                headers={[
                    { name: 'Name', serverCodeToSort: 'name', width: 3 },
                    { name: 'Description', serverCodeToSort: 'description', width: 4 },
                    { name: 'State', serverCodeToSort: 'state', width: 1 },
                    { name: 'Model', serverCodeToSort: 'fitness_function', width: 1 },
                    { name: 'Date', serverCodeToSort: 'created' },
                    { name: 'Metric', serverCodeToSort: 'fitness_metric' },
                    { name: 'Best CV metric', serverCodeToSort: 'best_fitness_value' },
                    { name: 'Datasets' },
                    ...actionColumn
                ]}
                defaultSortProp={{ sortField: 'created', sortOrderAscendant: false }}
                queryParams={{ biomarker_pk: props.selectedBiomarker.id, ...extraQueryParams }}
                customFilters={[
                    {
                        label: 'Model type',
                        keyForServer: 'fitness_function',
                        defaultValue: '',
                        placeholder: 'Model type',
                        options: fitnessFunctionsOptions,
                        width: 3
                    },
                    ...stateFilter
                ]}
                customElements={
                    props.allowFullManagement
                        ? [
                            <Form.Field key={1} className='custom-table-field' title='New trained model'>
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
                searchWidth={4}
                entriesSelectWidth={2}
                urlToRetrieveData={urlBiomarkerTrainedModels}
                updateWSKey='update_trained_models'
                mapFunction={(trainedModel: TrainedModelForTable) => {
                    const isInProcess = trainedModel.state === TrainedModelState.IN_PROCESS ||
                        trainedModel.state === TrainedModelState.WAITING_FOR_QUEUE

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
                                <TrainedModelStateLabel trainedModelStateState={trainedModel.state} cvFoldsWereModified={trainedModel.cv_folds_modified} />
                            </Table.Cell>
                            <Table.Cell><FitnessFunctionLabel fitnessFunction={trainedModel.fitness_function} /></Table.Cell>
                            <TableCellWithTitle value={formatDateLocale(trainedModel.created as string, 'L')} />
                            <Table.Cell>{trainedModel.fitness_metric ?? '-'}</Table.Cell>
                            <Table.Cell>{trainedModel.best_fitness_value ? trainedModel.best_fitness_value.toFixed(4) : '-'}</Table.Cell>
                            <Table.Cell>
                                <TableCellSources
                                    clinical_source={trainedModel.clinical_source}
                                    methylation_source={trainedModel.mrna_source}
                                    mrna_source={trainedModel.mirna_source}
                                    cna_source={trainedModel.cna_source}
                                    mirna_source={trainedModel.methylation_source}
                                />
                            </Table.Cell>

                            {/* Actions column */}
                            {props.allowFullManagement &&
                                <Table.Cell width={1}>
                                    {/* Stop button */}
                                    {isInProcess &&
                                        <StopExperimentButton
                                            title='Stop trained model'
                                            onClick={() => setTrainedModelToStop(trainedModel)}
                                        />}

                                    {/* Delete button */}
                                    {!isInProcess &&
                                        <DeleteExperimentButton
                                            disabled={!trainedModel.can_be_deleted}
                                            title={trainedModel.can_be_deleted
                                                ? 'Delete trained model'
                                                : 'Trained model cannot be deleted as it has related statistical validations and/or inference experiments'}
                                            onClick={() => setTrainedModelToRemove(trainedModel)}
                                        />}
                                </Table.Cell>}
                        </Table.Row>
                    )
                }}
            />
        </>
    )
}
