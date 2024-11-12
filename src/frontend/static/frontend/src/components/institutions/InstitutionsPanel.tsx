import React from 'react'
import { Base } from '../Base'
import { Grid, Icon, Segment, Header, Table } from 'semantic-ui-react'
import { DjangoInstitution, DjangoUserCandidates, DjangoCommonResponse, DjangoAddRemoveUserToInstitutionInternalCode, DjangoResponseCode, DjangoUser } from '../../utils/django_interfaces'
import ky from 'ky'
import { alertGeneralError, getDjangoHeader } from '../../utils/util_functions'
/* import { InstitutionsList } from './InstitutionsList'
import { InstitutionUsersInfo } from './InstitutionUsersInfo' */
import { RemoveUserFromInstitutionModal } from './RemoveUserFromInstitutionModal'
import { Nullable } from '../../utils/interfaces'
import { InfoPopup } from '../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { PaginatedTable } from '../common/PaginatedTable'
import { TableCellWithTitle } from '../common/TableCellWithTitle'
import InstitutionForm from './InstitutionForm'
import { InstitutionModal, InstitutionModalActions, InstitutionModalState } from './InstitutionModal'

// URLs defined in files.html
declare const urlUserInstitutionsAsAdmin: string
declare const urlAddRemoveUserToInstitution: string

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
}

/**
 * Renders a manager to list, add, download and remove source files (which are used to make experiments).
 * Also, this component renders a CRUD of Tags for files
 */
export class InstitutionsPanel extends React.Component<{}, InstitutionsPanelState> {
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
            modalState: this.defaultModalState()
        }
    }

    selectedInstitutionChanged (institution: DjangoInstitution) {
        this.setState({
            selectedInstitution: institution
        })
    }

    /**
     * When the component has been mounted, It requests for
     * tags and files
     */
    componentDidMount () { /* this.getUserInstitutions() */ }

    /**
     * Abort controller if component unmount
     */

    componentWillUnmount () {
        this.abortController.abort()
    }

    /**
     * Default modal attributes
     * @returns {InstitutionModalState} Default modal
     */
    defaultModalState (): InstitutionModalState {
        return {
            isOpen: false,
            action: InstitutionModalActions.READ,
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
     * @param {InstitutionModalActions} action action type for modal.
     * @param {DjangoInstitution} institution institution for modal.
     */
    handleOpenModal (action: InstitutionModalActions, institution: DjangoInstitution) {
        const modalState = {
            isOpen: true,
            action,
            institution
        }
        this.setState({ modalState })
    }

    /**
     * Fetches the Institutions which the current user belongs to
     */
    getUserInstitutions () {
        ky.get(urlUserInstitutionsAsAdmin, { signal: this.abortController.signal }).then((response) => {
            response.json().then((institutions: DjangoInstitution[]) => {
                // If it's showing an institution, refresh it's state
                // For example, in the case of adding or removing a user to/from an Institution
                let newSelectedInstitution: Nullable<DjangoInstitution> = null

                if (this.state.selectedInstitution !== null) {
                    newSelectedInstitution = institutions.find((institution) => {
                        return institution.id === this.state.selectedInstitution?.id
                    }) ?? null
                }

                this.setState({ institutions, selectedInstitution: newSelectedInstitution })
            }).catch((err) => {
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.log("Error getting user's datasets ->", err)
        })
    }

    /**
     * Set a selected Institution in state to show it users
     * @param selectedInstitution Selected Institution to show users
     */
    showUsers = (selectedInstitution: DjangoInstitution) => { this.setState({ selectedInstitution }) }

    /**
     * Cleans the inputs for adding a user to an Institution
     */
    cleanSearchAndCandidates () {
        this.setState({
            userCandidates: [],
            selectedUserIdToAdd: null,
            searchUserText: ''
        })
    }

    /**
     * Sets as selected a new user to add him to an Institution,
     * @param selectedUserId Id of the selected user in the Dropdown
     */
    selectUser (selectedUserId) { this.setState({ selectedUserIdToAdd: selectedUserId }) }

    /**
     * Makes a request to the server to add/remove a User to/from an Institution
     * @param userId Id of the user to add or remove
     * @param isAdding True if want to add, false if want to remove
     */
    addOrRemoveUserToInstitution = (userId: number, isAdding: boolean) => {
        // Sets the Request's Headers
        const myHeaders = getDjangoHeader()

        const params = {
            userId,
            institutionId: this.state.selectedInstitution?.id,
            isAdding
        }

        const loadingFlag = isAdding ? 'addingRemovingUserToInstitution' : 'removingUserFromInstitution'

        this.setState<never>({ [loadingFlag]: true }, () => {
            ky.post(urlAddRemoveUserToInstitution, { headers: myHeaders, json: params }).then((response) => {
                this.setState<never>({ [loadingFlag]: false })
                response.json().then((jsonResponse: DjangoCommonResponse<DjangoAddRemoveUserToInstitutionInternalCode>) => {
                    this.cleanSearchAndCandidates()

                    if (jsonResponse.status.code === DjangoResponseCode.SUCCESS) {
                        this.getUserInstitutions()
                        this.handleClose()
                    } else {
                        if (jsonResponse.status.internal_code === DjangoAddRemoveUserToInstitutionInternalCode.CANNOT_REMOVE_YOURSELF) {
                            alert('You cannot remove yourself from the Institution!')
                        } else {
                            alertGeneralError()
                        }
                    }
                }).catch((err) => {
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                this.setState<never>({ [loadingFlag]: false })
                console.log("Error getting user's datasets ->", err)
            })
        })
    }

    /**
     * Makes a request to the server to add a User from an Institution
     */
    addUserToInstitution = () => {
        if (this.state.selectedUserIdToAdd !== null) {
            this.addOrRemoveUserToInstitution(this.state.selectedUserIdToAdd, true)
        }
    }

    /**
     * Makes a request to the server to remove a User from an Institution
     */
    removeUserFromInstitution = () => {
        if (this.state.selectedUserToRemove?.id) {
            this.addOrRemoveUserToInstitution(this.state.selectedUserToRemove.id, false)
        }
    }

    /**
     * Show a modal to confirm a removal of an User from an Institution
     * @param institutionUser Selected User to remove
     */
    confirmFileDeletion = (institutionUser: DjangoUser) => {
        this.setState({
            selectedUserToRemove: institutionUser,
            showRemoveUserFromInstitutionModal: true
        })
    }

    /**
     * Closes the removal confirm modals
     */
    handleClose = () => { this.setState({ showRemoveUserFromInstitutionModal: false }) }

    /**
     * Checks if search input should be enabled or not
     * @returns True if user can choose a user to add to an Institution, false otherwise
     */
    formIsDisabled = (): boolean => !this.state.selectedInstitution || this.state.addingRemovingUserToInstitution

    render () {
        /*        const userOptions: DropdownItemProps[] = this.state.userCandidates.map((userCandidate) => {
                   return {
                       key: userCandidate.id,
                       text: `${userCandidate.username} (${userCandidate.email})`,
                       value: userCandidate.id
                   }
               }) */

        /*         const formIsDisabled = this.formIsDisabled()
         */
        return (
            <Base activeItem='institutions' wrapperClass='institutionsWrapper'>
                {/* Modal to confirm User removal from an Institution */}
                <RemoveUserFromInstitutionModal
                    selectedUserToRemove={this.state.selectedUserToRemove}
                    selectedInstitution={this.state.selectedInstitution}
                    showRemoveUserModal={this.state.showRemoveUserFromInstitutionModal}
                    removingUserFromInstitution={this.state.removingUserFromInstitution}
                    handleClose={this.handleClose}
                    removeUser={this.removeUserFromInstitution}
                />
                <Grid columns={2} padded stackable divided stretched={true}>
                    {/* List of institutions */}
                    <Grid.Column width={4} textAlign='left' stretched={true}>
                        <Segment>
                            <Header textAlign="center">
                                <Icon name='building' />
                                <Header.Content className='headerContent'><span>My institutions</span>
                                    <div style={{ float: 'right', height: '10px' }}>
                                        <InfoPopup onTop={false} extraClassName='questionIcon' content='In this form you can add institutions and colleagues to collaborate sharing datasets (and experiment results in a near future)' />
                                    </div>
                                </Header.Content>
                            </Header>
                            <InstitutionForm />
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
                            <PaginatedTable<DjangoInstitution>
                                headerTitle='Institutions'
                                headers={[
                                    { name: 'Name', serverCodeToSort: 'name', width: 3 },
                                    { name: 'Location', serverCodeToSort: 'location', width: 1 },
                                    { name: 'Email', width: 1 },
                                    { name: 'Phone number', width: 1 },
                                    { name: 'Actions', width: 1 }
                                ]}
                                defaultSortProp={{ sortField: 'upload_date', sortOrderAscendant: false }}
                                showSearchInput
                                searchLabel='Name'
                                searchPlaceholder='Search by name'
                                urlToRetrieveData={urlUserInstitutionsAsAdmin}
                                updateWSKey='institutionsList'
                                mapFunction={(institution: DjangoInstitution) => {
                                    return (
                                        <Table.Row key={institution.id as number}>
                                            <TableCellWithTitle value={institution.name} />
                                            <TableCellWithTitle value={institution.location} />
                                            <TableCellWithTitle value={institution.email} />
                                            <TableCellWithTitle value={institution.telephone_number} />
                                            <Table.Cell width={1}>
                                                {/* Details button */}
                                                <Icon
                                                    name='chart bar'
                                                    className='clickable'
                                                    color='blue'
                                                    title='Details'
                                                    onClick={() => this.handleOpenModal(InstitutionModalActions.READ, institution)}
                                                />

                                                {/* Edit button */}
                                                <Icon
                                                    name='pencil'
                                                    className='clickable margin-left-5'
                                                    color={/* canEditMolecules ? */ 'yellow' /* : 'orange' */}
                                                    title={`Edit (${institution.name}`}
                                                    onClick={() => this.handleOpenModal(InstitutionModalActions.EDIT, institution)}
                                                />
                                            </Table.Cell>
                                        </Table.Row>
                                    )
                                }}
                            />
                        </Segment>
                    </Grid.Column>
                </Grid>
                <InstitutionModal handleCloseModal={() => this.handleCloseModal()} action={this.state.modalState.action} isOpen={this.state.modalState.isOpen} institution={this.state.modalState.institution} />
            </Base>
        )
    }
}
