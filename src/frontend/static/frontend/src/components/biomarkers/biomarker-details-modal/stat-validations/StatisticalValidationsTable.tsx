import React, { useState } from 'react'
import { PaginatedTable } from '../../../common/PaginatedTable'
import { Biomarker, BiomarkerState, StatisticalValidationForTable } from '../../types'
import { Button, Form, Header, Icon, Modal, Table } from 'semantic-ui-react'
import { TableCellWithTitle } from '../../../common/TableCellWithTitle'
import { alertGeneralError, formatDateLocale, getDjangoHeader } from '../../../../utils/util_functions'
import { FitnessFunctionLabel } from '../../labels/FitnessFunctionLabel'
import { BiomarkerStateLabel } from '../../labels/BiomarkerStateLabel'
import ky from 'ky'
import { StopExperimentButton } from '../../../pipeline/all-experiments-view/StopExperimentButton'
import { Nullable } from '../../../../utils/interfaces'
import { DeleteButton } from '../../../common/DeleteButton'
import { TableCellSources } from '../../../common/TableCellSources'
import { useIntl } from 'react-intl'

declare const urlBiomarkerStatisticalValidations: string
declare const urlStopStatisticalValidation: string

/** StatisticalValidationsTable props. */
interface StatisticalValidationsTableProps {
    /** Selected Biomarker instance to get its statistical validations. */
    selectedBiomarker: Biomarker,
    /** Callback to open the modal to add a new statistical validation analysis. */
    setOpenModalNewStatValidation: (openModalNewStatValidation: boolean) => void,
    /** Callback to open the modal with the results for a StatisticalValidation instance. */
    openStatResult: (statisticalValidation: StatisticalValidationForTable) => void
}

/**
 * Renders a table with all the statistical validations for a specific Biomarker.
 * @param props Component props.
 * @returns Component.
 */
export const StatisticalValidationsTable = (props: StatisticalValidationsTableProps) => {
    const intl = useIntl()
    const [stoppingStatValidation, setStoppingStatValidation] = useState(false)
    const [statValidationToStop, setStatValidationToStop] = useState<Nullable<StatisticalValidationForTable>>(null)

    const [deletingStatValidation, setDeletingStatValidation] = useState(false)
    const [statValidationToRemove, setStatValidationToRemove] = useState<Nullable<StatisticalValidationForTable>>(null)

    /** Makes a request to stop an StatisticalValidation. */
    const stopStatValidationExperiment = () => {
        if (statValidationToStop === null) {
            return
        }

        setStoppingStatValidation(true)

        // Sets the Request's Headers
        const myHeaders = getDjangoHeader()
        const statValidationId = statValidationToStop.id as number // This is safe

        ky.get(urlStopStatisticalValidation, { headers: myHeaders, searchParams: { statValidationId } }).then((response) => {
            // If OK closes the modal
            if (response.ok) {
                handleCloseStopStatValidation()
            } else {
                alertGeneralError()
            }
        }).catch((err) => {
            alertGeneralError()
            console.log('Error stopping StatisticalValidation:', err)
        }).finally(() => {
            setStoppingStatValidation(false)
        })
    }

    /** Makes a request to delete a StatisticalValidation. */
    const deleteStatValidation = () => {
        // Sets the Request's Headers
        if (!statValidationToRemove) {
            return
        }

        setDeletingStatValidation(true)

        const myHeaders = getDjangoHeader()
        const deleteURL = `${urlBiomarkerStatisticalValidations}/${statValidationToRemove.id}/`
        ky.delete(deleteURL, { headers: myHeaders }).then((response) => {
            // If OK is returned refresh the tags
            if (response.ok) {
                handleCloseRemoveStatValidation()
            }
        }).catch((err) => {
            alertGeneralError()
            console.log('Error deleting StatisticalValidation:', err)
        }).finally(() => {
            setDeletingStatValidation(false)
        })
    }

    /** Sets the statValidationToStop to null to close the modal to confirm the action. */
    const handleCloseStopStatValidation = () => {
        setStatValidationToStop(null)
    }

    /** Sets the statValidationToRemove to null to close the modal to confirm the action. */
    const handleCloseRemoveStatValidation = () => {
        setStatValidationToRemove(null)
    }

    /**
     * Generates the modal to confirm an Experiment stopping
     * @returns Modal component. Null if no Experiment was selected to stop
     */
    const getExperimentStopConfirmModals = () => {
        if (!statValidationToStop) {
            return null
        }

        return (
            <Modal size='small' open={statValidationToStop !== null} onClose={handleCloseStopStatValidation} centered={false}>
                <Header icon='stop' content={intl.formatMessage({ id: 'statValidationsTable.stopValidation.header' })} />
                <Modal.Content>
                    {intl.formatMessage({ id: 'statValidationsTable.stopValidation.confirm' }, { name: statValidationToStop.name })}?
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={handleCloseStopStatValidation}>
                        {intl.formatMessage({ id: 'common.cancel' })}
                    </Button>
                    <Button
                        color='red'
                        onClick={stopStatValidationExperiment}
                        loading={stoppingStatValidation}
                        disabled={stoppingStatValidation}
                    >
                        {intl.formatMessage({ id: 'common.stop' })}
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
        if (!statValidationToRemove) {
            return null
        }

        return (
            <Modal size='small' open={statValidationToRemove !== null} onClose={handleCloseRemoveStatValidation} centered={false}>
                <Header icon='trash' content={intl.formatMessage({ id: 'statValidationsTable.deleteValidation.header' })} />
                <Modal.Content>
                    {intl.formatMessage({ id: 'statValidationsTable.deleteValidation.confirm' }, { name: statValidationToRemove.name })}?
                </Modal.Content>
                <Modal.Actions>
                    <Button onClick={handleCloseRemoveStatValidation}>
                        {intl.formatMessage({ id: 'common.cancel' })}
                    </Button>
                    <Button color='red' onClick={deleteStatValidation} loading={deletingStatValidation} disabled={deletingStatValidation}>
                        {intl.formatMessage({ id: 'common.delete' })}
                    </Button>
                </Modal.Actions>
            </Modal>
        )
    }

    return (
        <>
            {/* Modal to confirm stopping the StatisticalValidation */}
            {getExperimentStopConfirmModals()}

            {/* Modal to confirm deleting the StatisticalValidation */}
            {getDeletionConfirmModal()}

            {/* Table */}
            <PaginatedTable<StatisticalValidationForTable>
                headerTitle={intl.formatMessage({ id: 'statValidationsTable.headerTitle' })}
                headers={[
                    { name: intl.formatMessage({ id: 'statValidationsTable.headers.name' }), serverCodeToSort: 'name', width: 3 },
                    { name: intl.formatMessage({ id: 'statValidationsTable.headers.description' }), serverCodeToSort: 'description', width: 4 },
                    { name: intl.formatMessage({ id: 'statValidationsTable.headers.state' }), serverCodeToSort: 'state', textAlign: 'center' },
                    { name: intl.formatMessage({ id: 'statValidationsTable.headers.model' }), textAlign: 'center', width: 2 },
                    { name: intl.formatMessage({ id: 'statValidationsTable.headers.date' }), serverCodeToSort: 'created' },
                    { name: intl.formatMessage({ id: 'statValidationsTable.headers.datasets' }) },
                    { name: 'Actions' }
                ]}
                queryParams={{ biomarker_pk: props.selectedBiomarker.id }}
                defaultSortProp={{ sortField: 'created', sortOrderAscendant: false }}
                showSearchInput
                searchLabel={intl.formatMessage({ id: 'statValidationsTable.search.label' })}
                searchPlaceholder={intl.formatMessage({ id: 'statValidationsTable.search.placeholder' })}
                urlToRetrieveData={urlBiomarkerStatisticalValidations}
                customElements={[
                    <Form.Field key={1} className='custom-table-field' title={intl.formatMessage({ id: 'statValidationsTable.newStatValidation' })}>
                        <Button primary icon onClick={() => { props.setOpenModalNewStatValidation(true) }}>
                            <Icon name='add' />
                        </Button>
                    </Form.Field>
                ]}
                updateWSKey='update_statistical_validations'
                mapFunction={(statisticalValidation: StatisticalValidationForTable) => {
                    const isInProcess = statisticalValidation.state === BiomarkerState.IN_PROCESS ||
                        statisticalValidation.state === BiomarkerState.WAITING_FOR_QUEUE

                    return (
                        <Table.Row key={statisticalValidation.id as number}>
                            <TableCellWithTitle value={statisticalValidation.name} />
                            <TableCellWithTitle value={statisticalValidation.description ?? ''} />
                            <Table.Cell textAlign='center'>
                                {/* NOTE: statistical validations have the same states as Biomarker */}
                                <BiomarkerStateLabel biomarkerState={statisticalValidation.state} />
                            </Table.Cell>
                            <Table.Cell textAlign='center'>
                                <FitnessFunctionLabel fitnessFunction={statisticalValidation.fitness_function} />
                            </Table.Cell>
                            <TableCellWithTitle value={formatDateLocale(statisticalValidation.created as string, 'L')} />
                            <Table.Cell>
                                <TableCellSources
                                    clinical_source={statisticalValidation.clinical_source}
                                    methylation_source={statisticalValidation.mrna_source}
                                    mrna_source={statisticalValidation.mirna_source}
                                    cna_source={statisticalValidation.cna_source}
                                    mirna_source={statisticalValidation.methylation_source}
                                />
                            </Table.Cell>
                            <Table.Cell width={1}>
                                {statisticalValidation.state === BiomarkerState.COMPLETED && (
                                    <Icon
                                        name='chart area'
                                        onClick={() => { props.openStatResult(statisticalValidation) }}
                                        className='clickable'
                                        color='blue'
                                        title={intl.formatMessage({ id: 'statValidationsTable.actions.seeResults' })}
                                    />
                                )}

                                {/* Stop button */}
                                {isInProcess && (
                                    <StopExperimentButton
                                        title={intl.formatMessage({ id: 'statValidationsTable.actions.stopValidation' })}
                                        onClick={() => setStatValidationToStop(statisticalValidation)}
                                    />
                                )}

                                {/* Delete button */}
                                {/** Todo: revisar ownerId */}
                                {!isInProcess && (
                                    <DeleteButton
                                        title={intl.formatMessage({ id: 'statValidationsTable.actions.deleteValidation' })}
                                        onClick={() => setStatValidationToRemove(statisticalValidation)}
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
