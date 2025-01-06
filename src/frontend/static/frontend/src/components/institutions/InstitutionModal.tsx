import React, { useState } from 'react'
import {
    ModalHeader,
    ModalContent,
    Modal,
    Icon,
    Segment,
    Table,
    Input,
    Button
} from 'semantic-ui-react'
import { DjangoInstitutionUser, DjangoUserCandidates } from '../../utils/django_interfaces'
import { CustomAlertTypes, Nullable } from '../../utils/interfaces'
import { PaginatedTable } from '../common/PaginatedTable'
import { TableCellWithTitle } from '../common/TableCellWithTitle'
import { InstitutionTableData } from './InstitutionsPanel'
import ky from 'ky'
import { getDjangoHeader } from '../../utils/util_functions'

declare const urlGetUsersCandidates: string
declare const urlEditInstitutionAdmin: string

export interface InstitutionModalState {
    isOpen: boolean,
    institution: Nullable<InstitutionTableData>
}

interface Props extends InstitutionModalState {
    /* Close modal function */
    handleCloseModal: () => void,
    handleChangeConfirmModalState: (setOption: boolean, headerText: string, contentText: string, onConfirm: Function) => void,
    handleUpdateAlert(isOpen: boolean, type: CustomAlertTypes, message: string, callback: Nullable<Function>): void,
}

/**
 *  Institution modal
 * @param {Props} props  Props for component
 * @returns Component
 */
export const InstitutionModal = (props: Props) => {
    const [userInput, setUserInput] = useState('');

    const handleAddUser = () => {

    }
    const handleSwitchUserAdmin = (adminSwitched: boolean, id: number) => {

        const myHeaders = getDjangoHeader()

        const editUrl = `${urlEditInstitutionAdmin}/${id}/`


        ky.patch(editUrl, { headers: myHeaders }).then((response) => {
            response.json().then((jsonResponse: any) => {
                props.handleUpdateAlert(true, CustomAlertTypes.SUCCESS, adminSwitched ? 'User is admin!' : 'User is not admin!', null)
            }).catch((err) => {
                props.handleUpdateAlert(true, CustomAlertTypes.ERROR, 'Error for switch role!', null)
                console.error('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            props.handleUpdateAlert(true, CustomAlertTypes.ERROR, 'Error for switch role!', null)
            console.error('Error adding new Institution ->', err)
        })

    }

    return (
        <Modal
            onClose={props.handleCloseModal}
            open={props.isOpen && props.institution !== null}
            closeIcon={<Icon name='close' size='large' />}
        >
            <ModalHeader>{props.institution?.name}</ModalHeader>
            <ModalContent>
                <Segment>
                    <Input onChange={(_, { value }) => setUserInput(value)} placeholder='Username' />
                    <Button className='margin-left-5' disabled={!userInput.trim() ? true : false}>Add user</Button>
                    <PaginatedTable<DjangoInstitutionUser>
                        headerTitle={props.institution?.name + ' users'}
                        headers={props.institution?.is_user_admin ? [
                            { name: 'User name', serverCodeToSort: 'user__username' as any, width: 3 },
                            { name: 'Admin', width: 1 },
                            { name: 'Actions', width: 1 }
                        ] : [
                            { name: 'User name', serverCodeToSort: 'user__username' as any, width: 3 },
                            { name: 'Admin', width: 1 },
                        ]}
                        showSearchInput
                        searchLabel='User name'
                        searchPlaceholder='Search by User name'
                        urlToRetrieveData={urlGetUsersCandidates + '/' + props.institution?.id + '/'}
                        updateWSKey='update_user_for_institution'
                        mapFunction={(userCandidate: DjangoInstitutionUser) => {
                            return (
                                <Table.Row key={userCandidate.user.id}>
                                    <TableCellWithTitle value={userCandidate.user.username} />
                                    <Table.Cell value={userCandidate.is_institution_admin ? "true" : "false"}>
                                        {
                                            userCandidate.is_institution_admin ?
                                                <Icon
                                                    name='check'
                                                    className={`clickable margin-left-5`}
                                                    color='teal'
                                                    title={'Institution admin'}
                                                />
                                                :
                                                <Icon
                                                    name='close'
                                                    className={`clickable margin-left-5`}
                                                    color='red'
                                                    title={'Non Institution admin'}
                                                />
                                        }
                                    </Table.Cell>
                                    {props.institution?.is_user_admin &&
                                        <Table.Cell width={1}>
                                            {/* Edit button */}
                                            {
                                                userCandidate.is_institution_admin ?
                                                    <Icon
                                                        name='close'
                                                        className={`clickable margin-left-5`}
                                                        color='red'
                                                        title={'Switch to non Institution admin'}
                                                        onClick={() => handleSwitchUserAdmin(false, userCandidate.id)}
                                                    //onClick={() => props.handleChangeConfirmModalState(true, 'Manage admin', 'Are you sure to make user admin?', () => handleSwitchUserAdmin(false, 0))}
                                                    />
                                                    :
                                                    <Icon
                                                        name='star'
                                                        className={`clickable margin-left-5`}
                                                        color='teal'
                                                        title={'Switch to Institution admin'}
                                                        onClick={() => handleSwitchUserAdmin(true, userCandidate.id)}
                                                    // onClick={() => props.handleChangeConfirmModalState(true, 'Manage admin', 'Are you sure to make user admin?', () => handleSwitchUserAdmin(true, 0))}
                                                    />
                                            }
                                        </Table.Cell>
                                    }
                                </Table.Row>
                            )
                        }}
                    />
                </Segment>
            </ModalContent>
        </Modal >
    )
}
