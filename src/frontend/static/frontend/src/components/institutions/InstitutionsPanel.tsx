import React from 'react'
import { Base } from '../Base'
import { Grid, Icon, Segment, Header, Table, Confirm } from 'semantic-ui-react'
import { DjangoInstitution, DjangoUserCandidates, DjangoUser } from '../../utils/django_interfaces'
import ky from 'ky'
import { getDjangoHeader } from '../../utils/util_functions'
import { ConfirmModal, CustomAlert, CustomAlertTypes, Nullable } from '../../utils/interfaces'
import { InfoPopup } from '../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { PaginatedTable } from '../common/PaginatedTable'
import { TableCellWithTitle } from '../common/TableCellWithTitle'
import InstitutionForm from './InstitutionForm'
import { InstitutionModal, InstitutionModalState } from './InstitutionModal'
import { Alert } from '../common/Alert'
import { useIntl, IntlShape } from 'react-intl'
// URLs defined in files.html
declare const urlGetUserInstitutions: string
declare const urlDeleteInstitution: string

/**
 * Component's state
 */
interface InstitutionsPanelState {
    institutions: DjangoInstitution[],
    selectedInstitution: Nullable<DjangoInstitution>,
    searchUserText: string,
    userCandidates: DjangoUserCandidates[],
    isFetchingUsersCandidates: boolean,
    selectedUserIdToAdd: Nullable<number>,
    addingRemovingUserToInstitution: boolean,
    removingUserFromInstitution: boolean,
    selectedUserToRemove: Nullable<DjangoUser>,
    showRemoveUserFromInstitutionModal: boolean,
    modalState: InstitutionModalState,
    institutionToEdit: Nullable<DjangoInstitution>,
    alert: CustomAlert,
    isDeletingInstitution: boolean,
    confirmModal: ConfirmModal,
}

export interface InstitutionTableData extends DjangoInstitution {
    is_user_admin: boolean
}

/** InstitutionsPanel props. */
interface InstitutionsPanelProps {
    intl: IntlShape
}

/**
 * Renders a manager to list, add, download and remove source files (which are used to make experiments).
 * Also, this component renders a CRUD of Tags for files
 */
class InstitutionsPanel extends React.Component<InstitutionsPanelProps, InstitutionsPanelState> {
    filterTimeout: number | undefined
    abortController = new AbortController()

    constructor (props) {
        super(props)

        this.state = {
            institutions: [],
            selectedInstitution: null,
            searchUserText: '',
            userCandidates: [],
            isFetchingUsersCandidates: false,
            selectedUserIdToAdd: null,
            addingRemovingUserToInstitution: false,
            removingUserFromInstitution: false,
            selectedUserToRemove: null,
            showRemoveUserFromInstitutionModal: false,
            modalState: this.defaultModalState(),
            institutionToEdit: null,
            alert: this.getDefaultAlertProps(),
            isDeletingInstitution: false,
            confirmModal: this.getDefaultConfirmModal()
        }
    }

    /**
     * Abort controller if component unmount
     */

    componentWillUnmount () {
        this.abortController.abort()
    }

    /**
     * Generates a default alert structure
     * @returns Default alert.
     */
    getDefaultAlertProps (): CustomAlert {
        return {
            message: '', // This have to change during cycle of component
            isOpen: false,
            type: CustomAlertTypes.SUCCESS,
            duration: 500
        }
    }

    /**
     * Default modal.
     * @returns Confirm modal struct.
     */
    getDefaultConfirmModal = (): ConfirmModal => {
        return {
            confirmModal: false,
            headerText: '',
            contentText: '',
            onConfirm: () => console.log('DefaultConfirmModalFunction, this should change during cycle of component')
        }
    }

    /**
     * Reset the confirm modal, to be used again
     */
    handleCancelConfirmModalState () {
        this.setState({ confirmModal: this.getDefaultConfirmModal() })
    }

    /**
     * Changes confirm modal state
     * @param setOption New state of option
     * @param headerText Optional text of header in confirm modal, by default will be empty
     * @param contentText optional text of content in confirm modal, by default will be empty
     * @param onConfirm Modal onConfirm callback
     */
    handleChangeConfirmModalState = (setOption: boolean, headerText: string, contentText: string, onConfirm: () => void) => {
        const confirmModal = this.state.confirmModal
        confirmModal.confirmModal = setOption
        confirmModal.headerText = headerText
        confirmModal.contentText = contentText
        confirmModal.onConfirm = onConfirm
        this.setState({ confirmModal })
    }

    /**
     * Update Alert
     * @param isOpen flag to open or close alert.
     * @param type type of alert.
     * @param message message of alert.
     * @param callback Callback function if is needed.
     * @param isEdit option if is in edit mode.
     */
    handleUpdateAlert (isOpen: boolean, type: CustomAlertTypes, message: string, callback: Nullable<() => void>, isEdit?: boolean) {
        const alert = this.state.alert
        alert.isOpen = isOpen
        alert.type = type
        alert.message = message
        let institutionToEdit = this.state.institutionToEdit

        if (isEdit) {
            institutionToEdit = null
        }

        if (callback) {
            callback()
            this.setState({ alert, institutionToEdit })
        } else {
            this.setState({ alert, institutionToEdit })
        }
    }

    /**
     * Reset the confirm modal, to be used again
     */
    handleCloseAlert = () => {
        const alert = this.state.alert
        alert.isOpen = false
        this.setState({ alert })
    }

    /**
     * Default modal attributes
     * @returns Default modal
     */
    defaultModalState (): InstitutionModalState {
        return {
            isOpen: false,
            institution: null
        }
    }

    /**
     * Close modal
     */
    handleCloseModal () {
        this.setState({ modalState: this.defaultModalState() })
    }

    /**
     * Open modal
     * @param institution institution for modal.
     */
    handleOpenModal (institution: InstitutionTableData) {
        const modalState = {
            isOpen: true,
            institution
        }
        this.setState({ modalState })
    }

    /**
     * Reset institution.
     * @param callbackToCancel callbackfunction.
     */
    handleResetInstitutionToEdit (callbackToCancel: () => void) {
        this.setState({ institutionToEdit: null })
        callbackToCancel()
    }

    /**
     * Set form to edit
     * @param institution institution for modal.
     */
    handleSetInstitutionToEdit (institution: InstitutionTableData) {
        this.setState({ institutionToEdit: institution })
    }

    /**
     * Delete institution.
     * @param institutionId id from institution to delete.
     */
    handleDeleteInstitution (institutionId: number) {
        const { intl } = this.props
        const url = `${urlDeleteInstitution}/${institutionId}/`
        const myHeaders = getDjangoHeader()
        ky.delete(url, { headers: myHeaders }).then((response) => {
            response.json().then(() => {
                this.handleUpdateAlert(true, CustomAlertTypes.SUCCESS, intl.formatMessage({ id: 'institutionsPanel.alert.successDelete' }), null)
            }).catch((err) => {
                this.handleUpdateAlert(true, CustomAlertTypes.ERROR, intl.formatMessage({ id: 'institutionsPanel.alert.errorDelete' }), null)
                console.error('Error parsing JSON ->', err)
            })
                .finally(() => {
                    const confirmModal = this.state.confirmModal
                    confirmModal.confirmModal = false
                    this.setState({ confirmModal })
                })
        }).catch((err) => {
            this.handleUpdateAlert(true, CustomAlertTypes.ERROR, intl.formatMessage({ id: 'institutionsPanel.alert.errorDelete' }), null)
            console.error('Error adding new Institution ->', err)
        }).finally(() => {
            const confirmModal = this.state.confirmModal
            confirmModal.confirmModal = false
            this.setState({ confirmModal })
        })
    }

    render () {
        const { intl } = this.props
        return (
            <Base activeItem='institutions' wrapperClass='institutionsWrapper'>
                <Grid columns={2} padded stackable divided stretched>
                    {/* List of institutions */}
                    <Grid.Column width={4} textAlign='left' stretched>
                        <Segment>
                            <Header textAlign='center'>
                                <Icon name='building' />
                                <Header.Content className='headerContent'><span>{intl.formatMessage({ id: 'institutionsPanel.header' })}</span>
                                    <div style={{ float: 'right', height: '10px' }}>
                                        <InfoPopup onTop={false} extraClassName='questionIcon' content={intl.formatMessage({ id: 'institutionsPanel.header.info' })} />
                                    </div>
                                </Header.Content>
                            </Header>
                            <InstitutionForm
                                institutionToEdit={this.state.institutionToEdit}
                                handleResetInstitutionToEdit={(callback) => this.handleResetInstitutionToEdit(callback)}
                                handleUpdateAlert={(isOpen: boolean, type: CustomAlertTypes, message: string, callback: Nullable<() => void>, isEdit?: boolean) => this.handleUpdateAlert(isOpen, type, message, callback, isEdit)}
                            />
                            {/* Todo: remove component
                              <InstitutionsList
                                institutions={this.state.institutions}
                                showUsers={this.showUsers}
                                selectedInstitution={this.state.selectedInstitution}
                            /> */}
                        </Segment>
                    </Grid.Column>

                    {/* Files overview panel */}
                    <Grid.Column width={12}>
                        <Segment>
                            <PaginatedTable<InstitutionTableData>
                                headerTitle={intl.formatMessage({ id: 'institutionsPanel.table.headerTitle' })}
                                headers={[
                                    { name: intl.formatMessage({ id: 'common.name' }), serverCodeToSort: 'name', width: 3 },
                                    { name: intl.formatMessage({ id: 'institutionsPanel.table.location' }), serverCodeToSort: 'location', width: 1 },
                                    { name: intl.formatMessage({ id: 'institutionsPanel.table.email' }), serverCodeToSort: 'email', width: 1 },
                                    { name: intl.formatMessage({ id: 'institutionsPanel.table.phoneNumber' }), serverCodeToSort: 'telephone_number', width: 1 },
                                    { name: intl.formatMessage({ id: 'common.actions' }), width: 1 }
                                ]}
                                defaultSortProp={{ sortField: 'upload_date', sortOrderAscendant: false }}
                                showSearchInput
                                searchLabel={intl.formatMessage({ id: 'common.name' })}
                                searchPlaceholder={intl.formatMessage({ id: 'institutionsPanel.search.placeholder' })}
                                urlToRetrieveData={urlGetUserInstitutions}
                                updateWSKey='update_institutions'
                                mapFunction={(institution: InstitutionTableData) => {
                                    return (
                                        <Table.Row key={institution.id as number}>
                                            <TableCellWithTitle value={institution.name} />
                                            <TableCellWithTitle value={institution.location} />
                                            <TableCellWithTitle value={institution.email} />
                                            <TableCellWithTitle value={institution.telephone_number} />
                                            <Table.Cell width={1}>
                                                {/* Details button */}
                                                <Icon
                                                    name='address book'
                                                    className='clickable'
                                                    color='blue'
                                                    title={intl.formatMessage({ id: 'common.details' })}
                                                    onClick={() => this.handleOpenModal(institution)}
                                                />

                                                {/* Edit button */}

                                                {
                                                    institution.is_user_admin && (
                                                        <Icon
                                                            name='pencil'
                                                            className='clickable margin-left-5'
                                                            color='yellow'
                                                            title={intl.formatMessage({ id: 'institutionsPanel.icon.edit' }, { name: institution.name })}
                                                            onClick={() => this.handleSetInstitutionToEdit(institution)}
                                                        />
                                                    )
                                                }
                                                {/* Delete button */}
                                                {institution.is_user_admin && (
                                                    <Icon
                                                        name='trash'
                                                        className='clickable margin-left-5'
                                                        color='red'
                                                        disabled={this.state.isDeletingInstitution}
                                                        title={intl.formatMessage({ id: 'institutionsPanel.icon.delete' })}
                                                        onClick={() => this.handleChangeConfirmModalState(true, intl.formatMessage({ id: 'institutionsPanel.confirm.delete.header' }), intl.formatMessage({ id: 'institutionsPanel.confirm.delete.content' }, { name: institution.name }), () => this.handleDeleteInstitution(institution.id as number))}
                                                    />
                                                )}
                                            </Table.Cell>
                                        </Table.Row>
                                    )
                                }}
                            />
                        </Segment>
                    </Grid.Column>
                </Grid>
                <InstitutionModal
                    handleUpdateAlert={(isOpen: boolean, type: CustomAlertTypes, message: string, callback: Nullable<() => void>) => this.handleUpdateAlert(isOpen, type, message, callback)}
                    handleChangeConfirmModalState={this.handleChangeConfirmModalState}
                    handleCloseModal={() => this.handleCloseModal()}
                    isOpen={this.state.modalState.isOpen} institution={this.state.modalState.institution}
                />
                <Alert
                    onClose={this.handleCloseAlert}
                    isOpen={this.state.alert.isOpen}
                    message={this.state.alert.message}
                    type={this.state.alert.type}
                    duration={this.state.alert.duration}
                />
                <Confirm
                    open={this.state.confirmModal.confirmModal}
                    header={this.state.confirmModal.headerText}
                    content={this.state.confirmModal.contentText}
                    size='large'
                    onCancel={() => this.handleCancelConfirmModalState()}
                    onConfirm={() => {
                        this.state.confirmModal.onConfirm()
                        const confirmModal = this.state.confirmModal
                        confirmModal.confirmModal = false
                        this.setState({ confirmModal })
                    }}
                />
            </Base>
        )
    }
}

/**
 * Functional wrapper to inject intl into the class component.
 * @param props Component props without intl.
 * @returns Component with intl props.
 */
const InstitutionsPanelWithIntl = (props: Omit<InstitutionsPanelProps, 'intl'>) => {
    const intl = useIntl()
    return <InstitutionsPanel {...props} intl={intl} />
}

export { InstitutionsPanelWithIntl as InstitutionsPanel }
