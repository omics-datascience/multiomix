import React, { useState } from 'react'
import { Base } from '../Base'
import { DifferentialExpressionForm } from './DifferentialExpressionForm'
import { Confirm, DropdownItemProps, Grid, Icon, Table, TableCell } from 'semantic-ui-react'
import { PaginatedTable, PaginationCustomFilter } from '../common/PaginatedTable'
import { TableCellWithTitle } from '../common/TableCellWithTitle'
import { Alert } from '../common/Alert'
import { ConfirmModal, CustomAlert, CustomAlertTypes, GenesColors, Nullable } from '../../utils/interfaces'
import { DifferentialExpressionAnalysis, DifferentialExpressionAnalysisExperimentState } from './types'
import { formatDateLocale, getDefaultAlertProps, getDefaultConfirmModal, getDjangoHeader, getExperimentStateObjDiffExperiment } from '../../utils/util_functions'
import { SourcePopup } from '../pipeline/all-experiments-view/SourcePopup'
import { PopupIcons } from '../common/PopupIcons'
import { DeleteButton } from '../common/DeleteButton'
import { SwitchPublicButton } from '../common/SwitchPublicButton'
import { StopExperimentButton } from '../pipeline/all-experiments-view/StopExperimentButton'
import ky from 'ky'
import { EditIcon } from '../common/EditIcon'
import { DifferentialExpressionModalResults } from './DifferentialExpressionModalResults'
import { useIntl } from 'react-intl'

declare const urlDifferentialExpressionList:string
declare const urlDifferentialExpressionStop:string
declare const urlDeleteExperiment: string

interface DiferentialExpressionPanelState {
    alert: CustomAlert
    modal: ConfirmModal
    stoppingExperiment: boolean
    experimentToEdit: Nullable<DifferentialExpressionAnalysis>
    modalResult: {
        differentialExpressionAnalysis: DifferentialExpressionAnalysis | null
        isOpen: boolean
    }
}

/**
 *  Differential Expression Panel component
 * @returns JSX.Element
 */
export const DiferentialExpressionPanel = () => {
    const intl = useIntl()
    const [state, setState] = useState<DiferentialExpressionPanelState>({
        alert: getDefaultAlertProps(),
        modal: getDefaultConfirmModal(),
        stoppingExperiment: false,
        experimentToEdit: null,
        modalResult: {
            differentialExpressionAnalysis: null,
            isOpen: false
        }
    })

    const handleEdit = (differentialExpressionAnalysis: DifferentialExpressionAnalysis) => {
        setState(prevState => ({
            ...prevState,
            experimentToEdit: differentialExpressionAnalysis
        }))
    }

    /**
     * Reset the confirm modal, to be used again
     */
    const handleCloseAlert = () => {
        setState(prevState => ({ ...prevState, alert: { ...prevState.alert, isOpen: false } }))
    }

    /**
     * Updates the alert state to show a new alert
     * @param type Type of alert
     * @param msg Message to show in the alert
     */
    const updateAlert = (type: CustomAlertTypes, msg: string) => {
        setState(prevState => ({
            ...prevState,
            alert: {
                ...prevState.alert,
                isOpen: true,
                type,
                message: msg,
            }

        }))
    }

    /**
     * Generates default table's Filters.
     * @returns Default object for table's Filters
     */
    const getDefaultFilters = (): PaginationCustomFilter[] => {
        const methodsOptions: DropdownItemProps[] = [{ id: 'LIMMA', name: 'Lima' }, { id: 'DESEQ', name: 'Deseq2' }].map((tag) => {
            const id = tag.id
            return { key: id, value: id, text: tag.name }
        })

        methodsOptions.unshift({ key: 'no_method', text: intl.formatMessage({ id: 'differentialExpression.panel.noMethod' }) })

        return [
            { label: intl.formatMessage({ id: 'differentialExpression.panel.method' }), keyForServer: 'tool', defaultValue: '', placeholder: intl.formatMessage({ id: 'differentialExpression.panel.selectMethod' }), options: methodsOptions, width: 3 }
        ]
    }

    const openInferenceResult = (differentialExpressionAnalysis: DifferentialExpressionAnalysis) => {
        setState(prevState => ({
            ...prevState,
            modalResult: { differentialExpressionAnalysis, isOpen: true }
        }))
    }

    /**
     * Stop experiment
     * @param experimentId experiment to stop
     */
    const confirmExperimentStop = (experimentId: number) => {
        const myHeaders = getDjangoHeader()

        ky.get(urlDifferentialExpressionStop, {
            headers: myHeaders,
            searchParams: { experimentId }
        }).then((response) => {
            // If OK closes the modal
            if (response.ok) {
                updateAlert(CustomAlertTypes.SUCCESS, intl.formatMessage({ id: 'differentialExpression.panel.stopSuccess' }))
            } else {
                updateAlert(CustomAlertTypes.ERROR, intl.formatMessage({ id: 'differentialExpression.panel.stopError' }))
            }
        }).catch((err) => {
            updateAlert(CustomAlertTypes.ERROR, intl.formatMessage({ id: 'differentialExpression.panel.stopError' }))
            console.error('Error stopping FSExperiment ->', err)
        }).finally(() => {
            setState(prevState => ({ ...prevState, stoppingExperiment: false }))
        })
    }

    /**
     * Delete experiment
     * @param differentialExpressionAnalysis experiment to delete
     */
    const confirmExperimentDeletion = (differentialExpressionAnalysis: DifferentialExpressionAnalysis) => {
        const myHeaders = getDjangoHeader()

        ky.delete(urlDeleteExperiment + `/${differentialExpressionAnalysis.id}/`, {
            headers: myHeaders,
        }).then((response) => {
            if (response.ok) {
                updateAlert(CustomAlertTypes.SUCCESS, intl.formatMessage({ id: 'differentialExpression.panel.deleteSuccess' }))
            } else {
                updateAlert(CustomAlertTypes.ERROR, intl.formatMessage({ id: 'differentialExpression.panel.deleteError' }))
            }
        }).catch((err) => {
            updateAlert(CustomAlertTypes.ERROR, intl.formatMessage({ id: 'differentialExpression.panel.deleteError' }))
            console.error('Error deleting FSExperiment ->', err)
        })
    }

    /**
     * Reset the confirm modal, to be used again
     */
    const handleCancelConfirmModalState = () => {
        setState(prevState => ({
            ...prevState,
            modal: getDefaultConfirmModal()
        }))
    }

    /**
     * Changes confirm modal state
     * @param setOption New state of option
     * @param headerText Optional text of header in confirm modal, by default will be empty
     * @param contentText optional text of content in confirm modal, by default will be empty
     * @param onConfirm Modal onConfirm callback
     */
    const handleChangeConfirmModalState = (setOption: boolean, headerText: string, contentText: string, onConfirm: () => void) => {
        setState(prevState => ({
            ...prevState,
            modal: {
                ...prevState.modal,
                confirmModal: setOption,
                headerText,
                contentText,
                onConfirm
            }
        }))
    }

    const handleCleanExperimentToEdit = () => {
        setState(prevState => ({
            ...prevState,
            experimentToEdit: null
        }))
    }

    return (
        <Base activeItem='differential-expression' wrapperClass='wrapper'>
            <Grid columns={2} padded stackable divided className='biomarkers--modal--container'>
                <Grid.Column width={4} textAlign='center'>
                    <DifferentialExpressionForm
                        updateAlert={updateAlert}
                        experimentToEdit={state.experimentToEdit}
                        handleCleanExperimentToEdit={handleCleanExperimentToEdit}
                    />
                </Grid.Column>
                <Grid.Column width={12}>
                    <PaginatedTable<DifferentialExpressionAnalysis>
                        headerTitle={intl.formatMessage({ id: 'differentialExpression.panel.headerTitle' })}
                        headers={[
                            { name: intl.formatMessage({ id: 'common.name' }), serverCodeToSort: 'name', width: 2 },
                            { name: intl.formatMessage({ id: 'common.description' }), serverCodeToSort: 'description', width: 3 },
                            { name: intl.formatMessage({ id: 'differentialExpression.panel.method' }), serverCodeToSort: 'tool' },
                            { name: intl.formatMessage({ id: 'common.date' }), serverCodeToSort: 'created_at' },
                            { name: intl.formatMessage({ id: 'common.state' }), serverCodeToSort: 'state', width: 1, textAlign: 'center' },
                            { name: intl.formatMessage({ id: 'differentialExpression.panel.sources' }) },
                            { name: intl.formatMessage({ id: 'differentialExpression.panel.public' }), width: 1 },
                            { name: intl.formatMessage({ id: 'common.actions' }), width: 2 }
                        ]}
                        defaultSortProp={{ sortField: 'created_at', sortOrderAscendant: false }}
                        customFilters={getDefaultFilters()}
                        showSearchInput
                        customElements={[
                            /*  <Form.Field key={1} className='custom-table-field' title='Add new Biomarker'>
                                <Button
                                    primary
                                    icon
                                    onClick={() => this.setState({ formBiomarker: this.getDefaultFormBiomarker(), openCreateEditBiomarkerModal: true })}
                                >
                                    <Icon name='add' />
                                </Button>
                            </Form.Field> */
                        ]}
                        searchLabel={intl.formatMessage({
                            id: 'differentialExpression.panel.nameDescription'
                        })}
                        searchPlaceholder='Search by name/description'
                        urlToRetrieveData={urlDifferentialExpressionList}
                        updateWSKey='update_differential_expression_experiments'
                        mapFunction={(differentialExpressionAnalysis: DifferentialExpressionAnalysis) => {
                            const isInProcess = differentialExpressionAnalysis.state === DifferentialExpressionAnalysisExperimentState.IN_PROCESS ||
                            differentialExpressionAnalysis.state === DifferentialExpressionAnalysisExperimentState.WAITING_FOR_QUEUE
                            const experimentState = getExperimentStateObjDiffExperiment(differentialExpressionAnalysis.state as any)

                            return (
                                <Table.Row key={differentialExpressionAnalysis.id as number}>
                                    <TableCellWithTitle value={differentialExpressionAnalysis.name} />
                                    <TableCellWithTitle value={differentialExpressionAnalysis.description} />
                                    <TableCellWithTitle value={differentialExpressionAnalysis.tool} />
                                    <TableCellWithTitle value={formatDateLocale(differentialExpressionAnalysis.created_at as string, 'L')} />
                                    <TableCell textAlign='center'>
                                        <Icon
                                            title={experimentState.title}
                                            className={experimentState.className}
                                            name={experimentState.iconName}
                                            color={experimentState.color}
                                            loading={experimentState.loading}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {/* Download mRNA */}
                                        <>
                                            <SourcePopup
                                                source={differentialExpressionAnalysis.mrna_source}
                                                iconName='file'
                                                iconColor={GenesColors.MRNA}
                                                downloadButtonTitle={intl.formatMessage({
                                                    id: 'differentialExpression.panel.downloadMrnaSource'
                                                })}
                                            />

                                            <SourcePopup
                                                source={differentialExpressionAnalysis.clinical_source}
                                                iconName='file alternate'
                                                iconColor={GenesColors.CLINICAL}
                                                downloadButtonTitle={intl.formatMessage({
                                                    id: 'differentialExpression.panel.downloadClinicalSource'
                                                })}
                                            />
                                        </>

                                    </TableCell>
                                    <TableCell textAlign='center'>
                                        {
                                            differentialExpressionAnalysis.is_public
                                                ? (
                                                    <Icon
                                                        title={intl.formatMessage({
                                                            id: 'differentialExpression.panel.publicVisible'
                                                        })}
                                                        name='check'
                                                        color='green'
                                                    />
                                                )
                                                : (
                                                    <Icon
                                                        title={intl.formatMessage({
                                                            id: 'differentialExpression.panel.publicHidden'
                                                        })}
                                                        name='close'
                                                        color='red'
                                                    />
                                                )
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {/* See results button */}
                                        {
                                            differentialExpressionAnalysis.state === DifferentialExpressionAnalysisExperimentState.COMPLETED && (
                                                <Icon
                                                    name='chart area'
                                                    onClick={() => { openInferenceResult(differentialExpressionAnalysis) }}
                                                    className='clickable'
                                                    color='blue'
                                                    title={intl.formatMessage({
                                                        id: 'differentialExpression.panel.seeResults'
                                                    })}
                                                />
                                            )
                                        }
                                        {/* Edit button */}
                                        <EditIcon
                                            editExperiment={() => handleEdit(differentialExpressionAnalysis)}
                                            ownerId={differentialExpressionAnalysis.user.id}
                                            disabled={differentialExpressionAnalysis.state === DifferentialExpressionAnalysisExperimentState.COMPLETED}
                                        />

                                        <PopupIcons
                                            content={(
                                                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
                                                    {/* Stop button */}
                                                    {
                                                        isInProcess && (
                                                            <StopExperimentButton
                                                                title={intl.formatMessage({
                                                                    id: 'differentialExpression.panel.stopExperiment'
                                                                })}
                                                                onClick={() => handleChangeConfirmModalState(true, intl.formatMessage({ id: 'differentialExpression.panel.stopExperimentTitle' }), intl.formatMessage({ id: 'differentialExpression.panel.stopExperimentConfirm' }), () => confirmExperimentStop(differentialExpressionAnalysis.id))}
                                                                ownerId={differentialExpressionAnalysis.user.id as number}
                                                            />
                                                        )
                                                    }

                                                    {/* Delete button */}
                                                    {(!isInProcess && !differentialExpressionAnalysis.is_public) && (
                                                        <DeleteButton
                                                            title={intl.formatMessage({
                                                                id: 'differentialExpression.panel.deleteExperiment'
                                                            })}
                                                            onClick={() => confirmExperimentDeletion(differentialExpressionAnalysis)}
                                                            ownerId={differentialExpressionAnalysis.user.id}
                                                        />
                                                    )}

                                                    {/* Public switch */}
                                                    <SwitchPublicButton
                                                        publicButtonEntity={{
                                                            id: differentialExpressionAnalysis.id as number,
                                                            user: { id: differentialExpressionAnalysis.user.id ?? 0 },
                                                            is_public: differentialExpressionAnalysis.is_public
                                                        }}
                                                        publicKey='experimentId'
                                                        nameEntity='experiment'
                                                        handleChangeConfirmModalState={handleChangeConfirmModalState}
                                                    />
                                                </div>
                                            )}
                                        />
                                    </TableCell>
                                </Table.Row>
                            )
                        }}
                    />
                </Grid.Column>
            </Grid>
            <Alert
                onClose={handleCloseAlert}
                isOpen={state.alert.isOpen}
                message={state.alert.message}
                type={state.alert.type}
                duration={state.alert.duration}
            />
            <Confirm
                open={state.modal.confirmModal}
                header={state.modal.headerText}
                content={state.modal.contentText}
                size='large'
                onCancel={() => handleCancelConfirmModalState()}
                onConfirm={() => {
                    state.modal.onConfirm()
                    setState(prevState => ({
                        ...prevState,
                        modal: {
                            ...prevState.modal,
                            confirmModal: false
                        }
                    }))
                }}
            />
            <DifferentialExpressionModalResults
                isOpen={state.modalResult.isOpen} differentialExpressionAnalysis={state.modalResult.differentialExpressionAnalysis}
                closeModal={() => setState(prevState => ({
                    ...prevState,
                    modalResult: { differentialExpressionAnalysis: null, isOpen: false }
                }))}
            />
        </Base>
    )
}
