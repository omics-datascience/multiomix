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
import { DeleteButton } from '../../../common/DeleteButton'
import { TableCellSources } from '../../../common/TableCellSources'
import { useIntl } from 'react-intl'

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
    const intl = useIntl()
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
                <Header icon='stop' content={intl.formatMessage({ id: 'inference.stop.title' })} />
                <Modal.Content>
                    {intl.formatMessage({ id: 'inference.stop.confirm' }, { name: inferenceExperimentToStop.name })}
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={handleCloseStopInferenceExperiment}>
                        {intl.formatMessage({ id: 'common.cancel' })}
                    </Button>
                    <Button
                        color='red'
                        onClick={stopInferenceExperiment}
                        loading={stoppingInferenceExperiment}
                        disabled={stoppingInferenceExperiment}
                    >
                        {intl.formatMessage({ id: 'common.stop' })}
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
                <Header icon='trash' content={intl.formatMessage({ id: 'inference.delete.title' })} />
                <Modal.Content>
                    {intl.formatMessage({ id: 'inference.delete.confirm' }, { name: inferenceExperimentToRemove.name })}
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={handleCloseRemoveInferenceExperiment}>
                        {intl.formatMessage({ id: 'common.cancel' })}
                    </Button>
                    <Button color='red' onClick={deleteInferenceExperiment} loading={deletingInferenceExperiment} disabled={deletingInferenceExperiment}>
                        {intl.formatMessage({ id: 'common.delete' })}
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
                headerTitle={intl.formatMessage({ id: 'inference.experiments.table.title' })}
                headers={[
                    { name: intl.formatMessage({ id: 'common.name' }), serverCodeToSort: 'name', width: 3 },
                    { name: intl.formatMessage({ id: 'common.description' }), serverCodeToSort: 'description', width: 4 },
                    { name: intl.formatMessage({ id: 'common.state' }), serverCodeToSort: 'state', textAlign: 'center' },
                    { name: intl.formatMessage({ id: 'inference.table.columns.model' }), serverCodeToSort: 'model', width: 1 },
                    { name: intl.formatMessage({ id: 'common.date' }), serverCodeToSort: 'created' },
                    { name: intl.formatMessage({ id: 'inference.table.columns.dataset' }) },
                    { name: intl.formatMessage({ id: 'common.actions' }) }

                ]}
                queryParams={{ biomarker_pk: props.selectedBiomarker.id }}
                defaultSortProp={{ sortField: 'created', sortOrderAscendant: false }}
                showSearchInput
                searchLabel={intl.formatMessage({ id: 'common.name' })}
                searchPlaceholder={intl.formatMessage({ id: 'inference.search.placeholder' })}
                urlToRetrieveData={urlBiomarkerInferenceExperiments}
                customElements={[
                    <Form.Field key={1} className='custom-table-field' title={intl.formatMessage({ id: 'inference.new.title' })}>
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
                            <Table.Cell>
                                <TableCellSources
                                    clinical_source={inferenceExperiment.clinical_source}
                                    methylation_source={inferenceExperiment.mrna_source}
                                    mrna_source={inferenceExperiment.mirna_source}
                                    cna_source={inferenceExperiment.cna_source}
                                    mirna_source={inferenceExperiment.methylation_source}
                                />
                            </Table.Cell>
                            <Table.Cell width={1}>
                                {inferenceExperiment.state === BiomarkerState.COMPLETED && (
                                    <Icon
                                        name='chart area'
                                        onClick={() => { props.openInferenceResult(inferenceExperiment) }}
                                        className='clickable'
                                        color='blue'
                                        title={intl.formatMessage({ id: 'inference.results.tooltip' })}

                                    />
                                )}

                                {/* Stop button */}
                                {isInProcess && (
                                    <StopExperimentButton
                                        title={intl.formatMessage({ id: 'inference.stop.title' })}
                                        onClick={() => setInferenceExperimentToStop(inferenceExperiment)}
                                    />
                                )}

                                {/* Delete button */}
                                {/* Todo: Revisar ownerid */}
                                {!isInProcess && (
                                    <DeleteButton
                                        title={intl.formatMessage({ id: 'inference.delete.title' })}
                                        onClick={() => setInferenceExperimentToRemove(inferenceExperiment)}
                                        ownerId={null}
                                    />
                                )}
                            </Table.Cell>
                        </Table.Row>
                    )
                }}
            />
        </>
    )
}
