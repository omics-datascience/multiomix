import React, { useState } from 'react'
import { PaginatedTable } from '../../../common/PaginatedTable'
import { Biomarker, BiomarkerState, InferenceExperimentForTable } from '../../types'
import { Button, Form, Header, Icon, Modal, Table } from 'semantic-ui-react'
import { TableCellWithTitle } from '../../../common/TableCellWithTitle'
import { alertGeneralError, formatDateLocale, getDjangoHeader } from '../../../../utils/util_functions'
import { FitnessFunctionLabel } from '../../labels/FitnessFunctionLabel'
import { BiomarkerStateLabel } from '../../labels/BiomarkerStateLabel'
import ky from 'ky'
import { Nullable } from '../../../../utils/interfaces'
import { StopExperimentButton } from '../../../pipeline/all-experiments-view/StopExperimentButton'
import { DeleteExperimentButton } from '../../../pipeline/all-experiments-view/DeleteExperimentButton'

declare const urlBiomarkerInferenceExperiments: string
declare const urlStopInferenceExperiment: string

/** InferenceExperimentsTable props. */
interface InferenceExperimentsTableProps {
    /** Selected Biomarker instance to get its inference experiments. */
    selectedBiomarker: Biomarker,
    /** Callback to open the modal to add a new inference experiment analysis. */
    setOpenModalNewInferenceExperiment: (openModalNewInferenceExperiment: boolean) => void,
    /** Callback to open the modal with the results for a InferenceExperiment instance. */
    openInferenceResult: (inferenceExperiment: InferenceExperimentForTable) => void
}

/**
 * Renders a table with all the inference experiments for a specific Biomarker.
 * @param props Component props.
 * @returns Component.
 */
export const InferenceExperimentsTable = (props: InferenceExperimentsTableProps) => {
    const [stoppingInferenceExperiment, setStoppingInferenceExperiment] = useState(false)
    const [inferenceExperimentToStop, setInferenceExperimentToStop] = useState<Nullable<InferenceExperimentForTable>>(null)

    const [deletingInferenceExperiment, setDeletingInferenceExperiment] = useState(false)
    const [inferenceExperimentToRemove, setInferenceExperimentToRemove] = useState<Nullable<InferenceExperimentForTable>>(null)

    /** Makes a request to stop an InferenceExperiment. */
    const stopInferenceExperiment = () => {
        if (inferenceExperimentToStop === null) {
            return
        }

        setStoppingInferenceExperiment(true)

        // Sets the Request's Headers
        const myHeaders = getDjangoHeader()
        const inferenceExperimentId = inferenceExperimentToStop.id as number // This is safe

        ky.get(urlStopInferenceExperiment, { headers: myHeaders, searchParams: { inferenceExperimentId } }).then((response) => {
            // If OK closes the modal
            if (response.ok) {
                handleCloseStopInferenceExperiment()
            } else {
                alertGeneralError()
            }
        }).catch((err) => {
            alertGeneralError()
            console.log('Error stopping InferenceExperiment:', err)
        }).finally(() => {
            setStoppingInferenceExperiment(false)
        })
    }

    /** Makes a request to delete a InferenceExperiment. */
    const deleteInferenceExperiment = () => {
        // Sets the Request's Headers
        if (!inferenceExperimentToRemove) {
            return
        }

        setDeletingInferenceExperiment(true)

        const myHeaders = getDjangoHeader()
        const deleteURL = `${urlBiomarkerInferenceExperiments}/${inferenceExperimentToRemove.id}/`
        ky.delete(deleteURL, { headers: myHeaders }).then((response) => {
            // If OK is returned refresh the tags
            if (response.ok) {
                handleCloseRemoveInferenceExperiment()
            }
        }).catch((err) => {
            alertGeneralError()
            console.log('Error deleting InferenceExperiment:', err)
        }).finally(() => {
            setDeletingInferenceExperiment(false)
        })
    }

    /** Sets the inferenceExperimentToStop to null to close the modal to confirm the action. */
    const handleCloseStopInferenceExperiment = () => {
        setInferenceExperimentToStop(null)
    }

    /** Sets the inferenceExperimentToRemove to null to close the modal to confirm the action. */
    const handleCloseRemoveInferenceExperiment = () => {
        setInferenceExperimentToRemove(null)
    }

    /**
     * Generates the modal to confirm an Experiment stopping
     * @returns Modal component. Null if no Experiment was selected to stop
     */
    const getExperimentStopConfirmModals = () => {
        if (!inferenceExperimentToStop) {
            return null
        }

        return (
            <Modal size='small' open={inferenceExperimentToStop !== null} onClose={handleCloseStopInferenceExperiment} centered={false}>
                <Header icon='stop' content='Stop inference experiment' />
                <Modal.Content>
                    Are you sure you want to stop the inference experiment <strong>{inferenceExperimentToStop.name}</strong>?
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={handleCloseStopInferenceExperiment}>
                        Cancel
                    </Button>
                    <Button
                        color='red'
                        onClick={stopInferenceExperiment}
                        loading={stoppingInferenceExperiment}
                        disabled={stoppingInferenceExperiment}
                    >
                        Stop
                    </Button>
                </Modal.Actions>
            </Modal>
        )
    }

    /**
     * Generates the modal to confirm a Inference experiment deletion
     * @returns Modal component. Null if no Tag was selected to delete
     */
    const getDeletionConfirmModal = () => {
        if (!inferenceExperimentToRemove) {
            return null
        }

        return (
            <Modal size='small' open={inferenceExperimentToRemove !== null} onClose={handleCloseRemoveInferenceExperiment} centered={false}>
                <Header icon='trash' content='Delete experiment' />
                <Modal.Content>
                    Are you sure you want to delete the inference experiment <strong>{inferenceExperimentToRemove.name}</strong>?
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={handleCloseRemoveInferenceExperiment}>
                        Cancel
                    </Button>
                    <Button color='red' onClick={deleteInferenceExperiment} loading={deletingInferenceExperiment} disabled={deletingInferenceExperiment}>
                        Delete
                    </Button>
                </Modal.Actions>
            </Modal>
        )
    }

    return (
        <>
            {/* Modal to confirm stopping the InferenceExperiment */}
            {getExperimentStopConfirmModals()}

            {/* Modal to confirm deleting the InferenceExperiment */}
            {getDeletionConfirmModal()}
            <PaginatedTable<InferenceExperimentForTable>
                headerTitle='Inference experiments'
                headers={[
                    { name: 'Name', serverCodeToSort: 'name', width: 3 },
                    { name: 'Description', serverCodeToSort: 'description', width: 4 },
                    { name: 'State', serverCodeToSort: 'state', textAlign: 'center' },
                    { name: 'Model', serverCodeToSort: 'model', width: 1 },
                    { name: 'Date', serverCodeToSort: 'created' },
                    { name: 'Actions' }
                ]}
                queryParams={{ biomarker_pk: props.selectedBiomarker.id }}
                defaultSortProp={{ sortField: 'created', sortOrderAscendant: false }}
                showSearchInput
                searchLabel='Name'
                searchPlaceholder='Search by name or description'
                urlToRetrieveData={urlBiomarkerInferenceExperiments}
                customElements={[
                    <Form.Field key={1} className='custom-table-field' title='New inference experiment'>
                        <Button primary icon onClick={() => { props.setOpenModalNewInferenceExperiment(true) }}>
                            <Icon name='add' />
                        </Button>
                    </Form.Field>
                ]}
                updateWSKey='update_prediction_experiment'
                mapFunction={(inferenceExperiment: InferenceExperimentForTable) => {
                    const isInProcess = inferenceExperiment.state === BiomarkerState.IN_PROCESS ||
                        inferenceExperiment.state === BiomarkerState.WAITING_FOR_QUEUE

                    return (
                        <Table.Row key={inferenceExperiment.id as number}>
                            <TableCellWithTitle value={inferenceExperiment.name} />
                            <TableCellWithTitle value={inferenceExperiment.description ?? ''} />
                            <Table.Cell textAlign='center'>
                                {/* NOTE: inference experiments have the same states as Biomarker */}
                                <BiomarkerStateLabel biomarkerState={inferenceExperiment.state} />
                            </Table.Cell>
                            <Table.Cell><FitnessFunctionLabel fitnessFunction={inferenceExperiment.model} /></Table.Cell>
                            <TableCellWithTitle value={formatDateLocale(inferenceExperiment.created as string, 'L')} />
                            <Table.Cell width={1}>
                                {inferenceExperiment.state === BiomarkerState.COMPLETED &&
                                    <Icon
                                        name='chart area'
                                        onClick={() => { props.openInferenceResult(inferenceExperiment) }}
                                        className='clickable'
                                        color='blue'
                                        title='See results'
                                    />
                                }

                                {/* Stop button */}
                                {isInProcess &&
                                    <StopExperimentButton
                                        title='Stop experiment'
                                        onClick={() => setInferenceExperimentToStop(inferenceExperiment)}
                                    />
                                }

                                {/* Delete button */}
                                {!isInProcess &&
                                    <DeleteExperimentButton
                                        title='Delete experiment'
                                        onClick={() => setInferenceExperimentToRemove(inferenceExperiment)}
                                    />
                                }
                            </Table.Cell>
                        </Table.Row>
                    )
                }}
            />
        </>
    )
}
