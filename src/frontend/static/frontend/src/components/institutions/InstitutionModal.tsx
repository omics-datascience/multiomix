import React, { useContext, useEffect, useRef, useState } from 'react'
import {
    ModalHeader,
    ModalContent,
    Modal,
    Icon,
    Segment,
    Table,
    Button,
    Select
} from 'semantic-ui-react'
import { DjangoInstitutionUser } from '../../utils/django_interfaces'
import { CustomAlertTypes, Nullable, SemanticListItem } from '../../utils/interfaces'
import { PaginatedTable } from '../common/PaginatedTable'
import { TableCellWithTitle } from '../common/TableCellWithTitle'
import { InstitutionTableData } from './InstitutionsPanel'
import ky from 'ky'
import { getDjangoHeader } from '../../utils/util_functions'
import { CurrentUserContext } from '../Base'
import { useIntl } from 'react-intl'

declare const urlGetUsersCandidates: string
declare const urlEditInstitutionAdmin: string
declare const urlNonUserListInstitution: string
declare const urlAddRemoveUserToInstitution: string

export interface InstitutionModalState {
    isOpen: boolean,
    institution: Nullable<InstitutionTableData>
}

interface Props extends InstitutionModalState {
    /* Close modal function */
    handleCloseModal: VoidFunction,
    handleChangeConfirmModalState: (setOption: boolean, headerText: string, contentText: string, onConfirm: () => void) => void,
    handleUpdateAlert(isOpen: boolean, type: CustomAlertTypes, message: string, callback: Nullable<() => void>): void,
}

/**
 *  Institution modal
 * @param props  Props for component
 * @returns Component
 */
export const InstitutionModal = (props: Props) => {
    const intl = useIntl()
    const [userIdToAdd, setUserIdToAdd] = useState<number>(0)
    const [userList, setUserList] = useState<SemanticListItem[]>([])
    const abortController = useRef(new AbortController())
    const currentUser = useContext(CurrentUserContext)

    /**
     * Function to add user to institution.
     */
    const handleAddUser = () => {
        if (userIdToAdd) {
            const myHeaders = getDjangoHeader()
            const body = {
                userId: userIdToAdd,
                isAdding: true,
                institutionId: props.institution?.id
            }
            ky.post(urlAddRemoveUserToInstitution, { headers: myHeaders, signal: abortController.current.signal, json: body }).then((response) => {
                response.json().then(() => {
                    usersListNonInInstitution()
                }).catch((err) => {
                    console.error('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                console.error('Error getting users ->', err)
            })
        }
    }

    /**
     * Function to remove user from institution.
     * @param idUserCandidate user id to remove from institution.
     */
    const handleRemoveUser = (idUserCandidate: number) => {
        const myHeaders = getDjangoHeader()
        const body = {
            userId: idUserCandidate,
            isAdding: false,
            institutionId: props.institution?.id
        }
        ky.post(urlAddRemoveUserToInstitution, { headers: myHeaders, signal: abortController.current.signal, json: body }).then((response) => {
            response.json().then(() => {
                usersListNonInInstitution()
            }).catch((err) => {
                console.error('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.error('Error getting users ->', err)
        })
    }

    /**
     * Function to manage admin.
     * @param adminSwitched switch if true is going to be admin, false if going to be normal user
     * @param idInstitution institution id.
     */
    const handleSwitchUserAdmin = (adminSwitched: boolean, idInstitution: number) => {
        const myHeaders = getDjangoHeader()
        const editUrl = `${urlEditInstitutionAdmin}/${idInstitution}/`

        ky.patch(editUrl, { headers: myHeaders }).then((response) => {
            response.json().then(() => {
                props.handleUpdateAlert(true, CustomAlertTypes.SUCCESS, adminSwitched ? intl.formatMessage({ id: 'institutionModal.userIsAdmin' }) : intl.formatMessage({ id: 'institutionModal.userIsNotAdmin' }), null)
            }).catch((err) => {
                props.handleUpdateAlert(true, CustomAlertTypes.ERROR, intl.formatMessage({ id: 'institutionModal.switchRoleError' }), null)
                console.error('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            props.handleUpdateAlert(true, CustomAlertTypes.ERROR, intl.formatMessage({ id: 'institutionModal.switchRoleError' }), null)
            console.error('Error adding new Institution ->', err)
        })
    }

    /**
     * Function to search users that are not in institution.
     */
    const usersListNonInInstitution = () => {
        const myHeaders = getDjangoHeader()

        const editUrl = `${urlNonUserListInstitution}/${props.institution?.id}/`
        ky.get(editUrl, { headers: myHeaders, signal: abortController.current.signal }).then((response) => {
            response.json<{ id: number, username: string }[]>().then((jsonResponse) => {
                setUserList(jsonResponse.map(user => ({ key: user.id.toString(), value: user.id.toString(), text: user.username })))
            }).catch((err) => {
                console.error('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.error('Error getting users ->', err)
        })
    }

    useEffect(() => {
        if (props.institution?.is_user_admin && props.institution?.id) {
            usersListNonInInstitution()
        }

        return () => {
            if (props.institution?.is_user_admin && props.institution?.id) {
                abortController.current.abort()
            }
        }
    }, [props.institution?.id])

    return (
        <Modal
            onClose={props.handleCloseModal}
            open={props.isOpen && props.institution !== null}
            closeIcon={<Icon name='close' size='large' />}
        >
            <ModalHeader>{props.institution?.name}</ModalHeader>
            <ModalContent>
                <Segment>
                    <Select
                        placeholder={intl.formatMessage({ id: 'institutionModal.selectUser' })}
                        options={userList}
                        value={userIdToAdd.toString()}
                        onChange={(_e, { value }) => setUserIdToAdd(Number(value))}
                    />
                    <Button
                        className='margin-left-5'
                        disabled={!userIdToAdd}
                        onClick={() => props.handleChangeConfirmModalState(true, intl.formatMessage({ id: 'institutionModal.addUserInstitution.title' }), intl.formatMessage({ id: 'institutionModal.addUserInstitution.confirm' }), handleAddUser)}

                    >
                        {intl.formatMessage({ id: 'institutionModal.addUser' })}
                    </Button>
                    <PaginatedTable<DjangoInstitutionUser>
                        headerTitle={intl.formatMessage(
                            { id: 'institutionModal.usersTitle' },
                            { institutionName: props.institution?.name }
                        )}
                        headers={props.institution?.is_user_admin
                            ? [
                                { name: intl.formatMessage({ id: 'institutionModal.userName' }), serverCodeToSort: 'user__username' as any, width: 3 },
                                { name: intl.formatMessage({ id: 'institutionModal.admin' }), width: 1 },
                                { name: intl.formatMessage({ id: 'common.actions' }), width: 1 }
                            ]
                            : [
                                { name: intl.formatMessage({ id: 'institutionModal.userName' }), serverCodeToSort: 'user__username' as any, width: 3 },
                                { name: intl.formatMessage({ id: 'institutionModal.admin' }), width: 1 }
                            ]}
                        showSearchInput
                        searchLabel={intl.formatMessage({ id: 'institutionModal.userName' })}
                        searchPlaceholder={intl.formatMessage({ id: 'institutionModal.searchPlaceholder' })}
                        urlToRetrieveData={urlGetUsersCandidates + '/' + props.institution?.id + '/'}
                        updateWSKey='update_user_for_institution'
                        mapFunction={(userCandidate: DjangoInstitutionUser) => {
                            return (
                                <Table.Row key={userCandidate.user.id}>
                                    <TableCellWithTitle value={userCandidate.user.username} />
                                    <Table.Cell value={userCandidate.is_institution_admin ? 'true' : 'false'}>
                                        {
                                            userCandidate.is_institution_admin
                                                ? (
                                                    <Icon
                                                        name='check'
                                                        className='clickable margin-left-5'
                                                        color='teal'
                                                        title={intl.formatMessage({ id: 'institutionModal.institutionAdmin' })}
                                                    />
                                                )
                                                : (
                                                    <Icon
                                                        name='close'
                                                        className='clickable margin-left-5'
                                                        color='red'
                                                        title={intl.formatMessage({ id: 'institutionModal.nonInstitutionAdmin' })}
                                                    />
                                                )
                                        }
                                    </Table.Cell>
                                    {props.institution?.is_user_admin && (
                                        <Table.Cell width={1}>
                                            {/* Edit button */}
                                            {
                                                userCandidate.user.id !== currentUser?.id && userCandidate.is_institution_admin
                                                    ? (
                                                        <Icon
                                                            name='close'
                                                            className='clickable margin-left-5'
                                                            color='olive'
                                                            title={intl.formatMessage({ id: 'institutionModal.switchToNonAdmin' })}
                                                            onClick={() => props.handleChangeConfirmModalState(true, intl.formatMessage({ id: 'institutionModal.manageAdmin' }), intl.formatMessage({ id: 'institutionModal.removeAdminConfirm' }), () => handleSwitchUserAdmin(false, userCandidate.id))}
                                                        />
                                                    )
                                                    : (
                                                        <Icon
                                                            name='star'
                                                            className='clickable margin-left-5'
                                                            color='teal'
                                                            title={intl.formatMessage({ id: 'institutionModal.switchToAdmin' })}
                                                            onClick={() => props.handleChangeConfirmModalState(true, intl.formatMessage({ id: 'institutionModal.manageAdmin' }), intl.formatMessage({ id: 'institutionModal.makeAdminConfirm' }), () => handleSwitchUserAdmin(true, userCandidate.id))}
                                                        />
                                                    )
                                            }

                                            {
                                                (props.institution?.is_user_admin && userCandidate.user.id !== currentUser?.id) && (
                                                    <Icon
                                                        name='close'
                                                        className='clickable margin-left-5'
                                                        color='red'
                                                        onClick={() => props.handleChangeConfirmModalState(true, intl.formatMessage({ id: 'institutionModal.removeUser' }), intl.formatMessage({ id: 'institutionModal.removeUserConfirm' }), () => handleRemoveUser(userCandidate.user.id))}
                                                        title={intl.formatMessage({ id: 'institutionModal.removeUser' })}
                                                    />
                                                )
                                            }
                                        </Table.Cell>
                                    )}
                                </Table.Row>
                            )
                        }}
                    />
                </Segment>
            </ModalContent>
        </Modal>
    )
}
