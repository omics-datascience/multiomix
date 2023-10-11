import React from 'react'
import { Base } from '../Base'
import { Grid, Icon, Segment, Header, Form, DropdownItemProps } from 'semantic-ui-react'
import { DjangoInstitution, DjangoUserCandidates, DjangoCommonResponse, DjangoAddRemoveUserToInstitutionInternalCode, DjangoResponseCode, DjangoUser } from '../../utils/django_interfaces'
import ky from 'ky'
import { alertGeneralError, getDjangoHeader } from '../../utils/util_functions'
import { InstitutionsList } from './InstitutionsList'
import { InstitutionUsersInfo } from './InstitutionUsersInfo'
import { RemoveUserFromInstitutionModal } from './RemoveUserFromInstitutionModal'
import { Nullable } from '../../utils/interfaces'
import { InfoPopup } from '../pipeline/experiment-result/gene-gem-details/InfoPopup'

// URLs defined in files.html
declare const urlUserInstitutionsAsAdmin: string
declare const urlGetUsersCandidates: string
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
            showRemoveUserFromInstitutionModal: false
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
    componentDidMount () { this.getUserInstitutions() }

    /**
     * Abort controller if component unmount
     */

    componentWillUnmount () {
        this.abortController.abort()
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
     * Fetches the User's uploaded files
     */
    searchUsers = () => {
        this.setState({ isFetchingUsersCandidates: true }, () => {
            const searchParams = {
                querySearch: this.state.searchUserText
            }
            ky.get(urlGetUsersCandidates, { searchParams, signal: this.abortController.signal }).then((response) => {
                this.setState({ isFetchingUsersCandidates: false })
                response.json().then((userCandidates: DjangoUserCandidates[]) => {
                    this.setState({ userCandidates })
                }).catch((err) => {
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                if (!this.abortController.signal.aborted) {
                    this.setState({ isFetchingUsersCandidates: false })
                }

                console.log("Error getting user's datasets ->", err)
            })
        })
    }

    /**
     * Handles search user input changes
     * @param value Value to assign to the specified field
     */
    handleInputChange = (value: string) => {
        this.setState({ searchUserText: value }, () => {
            clearTimeout(this.filterTimeout)
            this.filterTimeout = window.setTimeout(this.searchUsers, 300)
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
        const userOptions: DropdownItemProps[] = this.state.userCandidates.map((userCandidate) => {
            return {
                key: userCandidate.id,
                text: `${userCandidate.username} (${userCandidate.email})`,
                value: userCandidate.id
            }
        })

        const formIsDisabled = this.formIsDisabled()

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
                            <Header textAlign="center" >
                                <Icon name='building' />
                                <Header.Content className='headerContent'><span>My institutions</span>
                                    <div style={{ float: 'right', height: '10px' }}>
                                        <InfoPopup onTop={false} extraClassName='questionIcon' content='In this form you can add institutions and colleagues to collaborate sharing datasets (and experiment results in a near future)'/>
                                    </div>
                                </Header.Content>
                            </Header>

                            <InstitutionsList
                                institutions={this.state.institutions}
                                showUsers={this.showUsers}
                                selectedInstitution={this.state.selectedInstitution}
                            />
                        </Segment>
                    </Grid.Column>

                    {/* Files overview panel */}
                    <Grid.Column width={12}>
                        <Segment>
                            <Grid stretched={true} >
                                <Grid.Column width={16} textAlign='left' stretched={true}>
                                    <Header textAlign="center">
                                        <Icon name='key' />
                                        <Header.Content>Manage access</Header.Content>
                                    </Header>

                                    <Form unstackable={true}>
                                        <Form.Group fluid >
                                            {/* User Search */}
                                            <Form.Dropdown
                                                fluid
                                                width={12}
                                                selection
                                                search
                                                options={userOptions}
                                                value={this.state.selectedUserIdToAdd as number}
                                                placeholder='Add Users'
                                                onChange={(_e, { value }) => this.selectUser(value)}
                                                onSearchChange={(_e, { searchQuery }) => this.handleInputChange(searchQuery)}
                                                disabled={formIsDisabled}
                                                loading={this.state.isFetchingUsersCandidates || this.state.addingRemovingUserToInstitution}
                                            />

                                            <Form.Button
                                                color='green'
                                                onClick={this.addUserToInstitution}
                                                disabled={formIsDisabled || !this.state.selectedUserIdToAdd}
                                                loading={this.state.addingRemovingUserToInstitution}
                                            >
                                                Add user
                                            </Form.Button>
                                        </Form.Group>
                                    </Form>

                                </Grid.Column>
                                <Grid.Column width={12} stretched={true}>
                                    {/* Institution's Users info */}
                                    <InstitutionUsersInfo
                                        selectedInstitution={this.state.selectedInstitution}
                                        confirmFileDeletion={this.confirmFileDeletion}
                                    />
                                </Grid.Column>
                            </Grid>
                        </Segment>
                    </Grid.Column>
                </Grid>
            </Base>
        )
    }
}
