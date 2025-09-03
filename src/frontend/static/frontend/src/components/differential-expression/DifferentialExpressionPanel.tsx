import React from 'react'
import { Base } from '../Base'
import { DifferentialExpressionForm } from './DifferentialExpressionForm'
import { DropdownItemProps, Grid, Icon, Table, TableCell } from 'semantic-ui-react'
import { PaginatedTable, PaginationCustomFilter } from '../common/PaginatedTable'
import { TableCellWithTitle } from '../common/TableCellWithTitle'
import { Alert } from '../common/Alert'
import { CustomAlert, CustomAlertTypes, GenesColors } from '../../utils/interfaces'
import { DifferentialExpressionAnalysis, DifferentialExpressionAnalysisExperimentState } from './types'
import { formatDateLocale, getExperimentStateObj } from '../../utils/util_functions'
import { SourcePopup } from '../pipeline/all-experiments-view/SourcePopup'
import { PopupIcons } from '../common/PopupIcons'
import { DeleteButton } from '../common/DeleteButton'
import { SwitchPublicButton } from '../common/SwitchPublicButton'
import { StopExperimentButton } from '../pipeline/all-experiments-view/StopExperimentButton'

declare const urlDifferentialExpressionList:string

export const DiferentialExpressionPanel = () => {
    /**
     * Generates a default alert structure
     * @returns Default the default Alert
     */
    const getDefaultAlertProps = (): CustomAlert => {
        return {
            message: '', // This have to change during cycle of component
            isOpen: false,
            type: CustomAlertTypes.SUCCESS,
            duration: 500
        }
    }

    const [state, setState] = React.useState({
        alert: getDefaultAlertProps()
    })

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
        const tagOptions: DropdownItemProps[] = [{ id: 1, name: 'asd' }].map((tag) => {
            const id = tag.id as number
            return { key: id, value: id, text: tag.name }
        })

        tagOptions.unshift({ key: 'no_tag', text: 'No tag' })

        return [
            { label: 'Tag', keyForServer: 'tag', defaultValue: '', placeholder: 'Select an existing Tag', options: tagOptions, width: 3 }
        ]
    }

    const confirmExperimentStop = (differentialExpressionAnalysis: DifferentialExpressionAnalysis) => {
        // To implement
        console.log(differentialExpressionAnalysis)
    }

    const confirmExperimentDeletion = (differentialExpressionAnalysis: DifferentialExpressionAnalysis) => {
        // To implement
        console.log(differentialExpressionAnalysis)
    }

    const handleChangeConfirmModalState = () => {
        // To implement
    }

    return (
        <Base activeItem='differential-expression' wrapperClass='wrapper'>
            <Grid columns={2} padded stackable divided className='biomarkers--modal--container'>
                <Grid.Column width={4} textAlign='center'>

                    <DifferentialExpressionForm updateAlert={updateAlert} />

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
                        defaultSortProp={{ sortField: 'upload_date', sortOrderAscendant: false }}
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
                        searchLabel='Name'
                        searchPlaceholder='Search by name'
                        urlToRetrieveData={urlDifferentialExpressionList}
                        updateWSKey='update_biomarkers'
                        mapFunction={(differentialExpressionAnalysis: DifferentialExpressionAnalysis) => {
                            console.log(differentialExpressionAnalysis)
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
                                        {/* <SourcePopup
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
                                        /> */}
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
                                        {/* <EditExperimentIcon
                                            editExperiment={this.props.editExperiment}
                                            experiment={experiment}
                                            ownerId={experiment.user.id}
                                        /> */}

                                        <PopupIcons
                                            content={(
                                                <div style={{ display: 'flex', flexDirection: 'row', gap: '8px' }}>
                                                    {/* Stop button */}
                                                    <StopExperimentButton
                                                        title='Stop experiment'
                                                        onClick={() => confirmExperimentStop(differentialExpressionAnalysis)}
                                                        ownerId={differentialExpressionAnalysis.user.id as number}
                                                    />

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
        </Base>
    )
}
