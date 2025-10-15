import React, { useState } from 'react'
import { Base } from '../Base'
import { DifferentialExpressionForm } from './DifferentialExpressionForm'
import { Confirm, DropdownItemProps, Grid, Icon, Table, TableCell } from 'semantic-ui-react'
import { PaginatedTable, PaginationCustomFilter } from '../common/PaginatedTable'
import { TableCellWithTitle } from '../common/TableCellWithTitle'
import { Alert } from '../common/Alert'
import { ConfirmModal, CustomAlert, CustomAlertTypes, GenesColors, Nullable } from '../../utils/interfaces'
import { DifferentialExpressionAnalysis, DifferentialExpressionAnalysisExperimentState } from './types'
import { formatDateLocale, getDefaultAlertProps, getDefaultConfirmModal, getDjangoHeader, getExperimentStateObj } from '../../utils/util_functions'
import { SourcePopup } from '../pipeline/all-experiments-view/SourcePopup'
import { PopupIcons } from '../common/PopupIcons'
import { DeleteButton } from '../common/DeleteButton'
import { SwitchPublicButton } from '../common/SwitchPublicButton'
import { StopExperimentButton } from '../pipeline/all-experiments-view/StopExperimentButton'
import ky from 'ky'
import { EditIcon } from '../common/EditIcon'

declare const urlDifferentialExpressionList:string
declare const urlDifferentialExpressionStop:string
declare const urlDeleteExperiment: string

interface DiferentialExpressionPanelState {
    alert: CustomAlert
    modal: ConfirmModal
    stoppingExperiment: boolean
    experimentToEdit: Nullable<DifferentialExpressionAnalysis>
}

export const DiferentialExpressionPanel = () => {
    const [state, setState] = useState<DiferentialExpressionPanelState>({
        alert: getDefaultAlertProps(),
        modal: getDefaultConfirmModal(),
        stoppingExperiment: false,
        experimentToEdit: null
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
        const methodsOptions: DropdownItemProps[] = [{ id: 1, name: 'Lima' }, { id: 2, name: 'Deseq2' }].map((tag) => {
            const id = tag.id as number
            return { key: id, value: id, text: tag.name }
        })

        methodsOptions.unshift({ key: 'no_method', text: 'No method' })

        return [
            { label: 'Method', keyForServer: 'method', defaultValue: '', placeholder: 'Select an existing method', options: methodsOptions, width: 3 }
        ]
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
                updateAlert(CustomAlertTypes.SUCCESS, 'Differential Expression experiment stopped successfully!')
            } else {
                updateAlert(CustomAlertTypes.ERROR, 'Error stopping Differential Expression experiment!')
            }
        }).catch((err) => {
            updateAlert(CustomAlertTypes.ERROR, 'Error stopping Differential Expression experiment!')
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
                updateAlert(CustomAlertTypes.SUCCESS, 'Differential Expression experiment deleted successfully!')
            } else {
                updateAlert(CustomAlertTypes.ERROR, 'Error deleting Differential Expression experiment!')
            }
        }).catch((err) => {
            updateAlert(CustomAlertTypes.ERROR, 'Error deleting Differential Expression experiment!')
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
                        headerTitle='Differential Expressions Analyses'
                        headers={[
                            { name: 'Name', serverCodeToSort: 'name', width: 3 },
                            { name: 'Description', serverCodeToSort: 'description', width: 4 },
                            { name: 'Date', serverCodeToSort: 'created_at' },
                            { name: 'State', serverCodeToSort: 'state', width: 1, textAlign: 'center' },
                            { name: 'Sources' },
                            { name: 'Public', width: 1 },
                            { name: 'Actions', width: 2 }
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
                        searchLabel='Name/Description'
                        searchPlaceholder='Search by name/description'
                        urlToRetrieveData={urlDifferentialExpressionList}
                        updateWSKey='update_differential_expression_experiments'
                        mapFunction={(differentialExpressionAnalysis: DifferentialExpressionAnalysis) => {
                            const isInProcess = differentialExpressionAnalysis.state === DifferentialExpressionAnalysisExperimentState.IN_PROCESS ||
                            differentialExpressionAnalysis.state === DifferentialExpressionAnalysisExperimentState.WAITING_FOR_QUEUE

                            const experimentState = getExperimentStateObj(differentialExpressionAnalysis.state as any)

                            return (
                                <Table.Row key={differentialExpressionAnalysis.id as number}>
                                    <TableCellWithTitle value={differentialExpressionAnalysis.name} />
                                    <TableCellWithTitle value={differentialExpressionAnalysis.description} />
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
                                        {
                                            differentialExpressionAnalysis.mrna_source.user_file && (
                                                <>
                                                    <SourcePopup
                                                        source={differentialExpressionAnalysis.mrna_source}
                                                        iconName='file'
                                                        iconColor={GenesColors.MRNA}
                                                        downloadButtonTitle='Download source mRNA file'
                                                    />

                                                    <SourcePopup
                                                        source={differentialExpressionAnalysis.clinical_source}
                                                        iconName='file alternate'
                                                        iconColor={GenesColors.CLINICAL}
                                                        downloadButtonTitle='Download Clinical source file'
                                                    />
                                                </>
                                            )
                                        }

                                    </TableCell>
                                    <TableCell textAlign='center'>
                                        {
                                            differentialExpressionAnalysis.is_public
                                                ? (
                                                    <Icon
                                                        title='All users of the platform can see this experiment'
                                                        name='check'
                                                        color='green'
                                                    />
                                                )
                                                : (
                                                    <Icon
                                                        title='If this is checked all the users in the platform can see (but not edit or remove) this element'
                                                        name='close'
                                                        color='red'
                                                    />
                                                )
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {/* See results button */}

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
                                                                title='Stop experiment'
                                                                onClick={() => handleChangeConfirmModalState(true, 'Stop Experiment', 'Are you sure to stop experiment?', () => confirmExperimentStop(differentialExpressionAnalysis.id))}
                                                                ownerId={differentialExpressionAnalysis.user.id as number}
                                                            />
                                                        )
                                                    }

                                                    {/* Delete button */}
                                                    {!isInProcess && !differentialExpressionAnalysis.is_public && (
                                                        <DeleteButton
                                                            title='Delete experiment'
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
        </Base>
    )
}
