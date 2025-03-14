import React, { useContext, useEffect, useRef, useState } from 'react'
import { Button, Grid, GridColumn, Icon, List, ListContent, ListHeader, ListItem, Modal, ModalContent, ModalHeader, Segment, Select } from 'semantic-ui-react'
import { CurrentUserContext } from '../../Base'
import { getDjangoHeader } from '../../../utils/util_functions'
import ky from 'ky'
import { SemanticListItem } from '../../../utils/interfaces'

declare const urlGetSharedUsers: string
declare const urlPostRemoveUser: string
declare const urlGetUsersNonInExperiment: string
declare const urlShareExperimentToUser: string

export interface SharedUsersProps {
    isOpen: boolean,
    users: { id: number, name: string }[],
    experimentId: number,
    isAdding: boolean,
    user: { id: number, username: string }
}
interface Props extends SharedUsersProps {
    handleClose: VoidFunction,
    handleChangeConfirmModalState: (setOption: boolean, headerText: string, contentText: string, onConfirm: Function) => void,
}

export const SharedUsers = (props: Props) => {
    const [isLoadingUser, setIsLoadingUser] = useState<boolean>(false)
    const currentUser = useContext(CurrentUserContext)
    const [activeUser, setActiveUser] = useState<{ id: number, username: string }>({ id: 0, username: '' })
    const abortController = useRef(new AbortController())
    const [usersList, setUsersList] = useState<{ id: number, username: string }[]>([])
    const [listOfUsersNonPart, setListOfUsersPart] = useState<SemanticListItem[]>([])
    const [userIdToAdd, setUserIdToAdd] = useState<number>(0)

    /**
     * Function to search users that are not in experiment.
     */
    const usersListNonExperiment = () => {
        const myHeaders = getDjangoHeader()

        const url = `${urlGetUsersNonInExperiment}/${props.experimentId}/`

        ky.get(url, { headers: myHeaders, signal: abortController.current.signal }).then((response) => {
            response.json().then((jsonResponse: { id: number, username: string }[]) => {
                setListOfUsersPart(jsonResponse.map(institution => ({ key: institution.id.toString(), value: institution.id.toString(), text: institution.username })))
            }).catch((err) => {
                console.error('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.error('Error getting users ->', err)
        })
    }

    /**
     * Function to search users.
     */
    const usersListInstitution = () => {
        const myHeaders = getDjangoHeader()

        const url = `${urlGetSharedUsers}/${props.experimentId}/`

        ky.get(url, { headers: myHeaders, signal: abortController.current.signal }).then((response) => {
            response.json().then((jsonResponse: { id: number, username: string }[]) => {
                setUsersList(jsonResponse)

                if (!(jsonResponse.map(item => item.id).includes(activeUser.id))) {
                    setActiveUser(jsonResponse.length ? jsonResponse[0] : { id: 0, username: '' })
                }
            }).catch((err) => {
                console.error('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.error('Error getting users ->', err)
        })
    }

    /**
     * Function to add user to experiment.
     */
    const handleAddInstitution = () => {
        if (userIdToAdd) {
            setIsLoadingUser(true)
            const myHeaders = getDjangoHeader()
            const body = {
                userId: userIdToAdd,
                experimentId: props.experimentId
            }
            ky.post(urlShareExperimentToUser, { headers: myHeaders, signal: abortController.current.signal, json: body }).then((response) => {
                response.json().then(() => {
                    usersListNonExperiment()
                    usersListInstitution()
                }).catch((err) => {
                    console.error('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                console.error('Error getting users ->', err)
            }).finally(() => setIsLoadingUser(false))
        }
    }

    /**
     * Remove a user from shared
     * @param userId user id to remove
     */
    const handleRemoveInstitution = (userId: number) => {
        setIsLoadingUser(true)
        const settings = {
            headers: getDjangoHeader(),
            json: {
                experimentId: props.experimentId,
                userId
            }
        }

        ky.post(urlPostRemoveUser, settings).then((response) => {
            response.json().then(() => {
            }).catch((err) => {
                console.error('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.error('Error removing institution ->', err)
        }).finally(() => {
            setIsLoadingUser(false)
            usersListNonExperiment()
            usersListInstitution()
        })
    }

    useEffect(() => {
        if (props.experimentId) {
            usersListNonExperiment()
            usersListInstitution()
        }
    }, [props.experimentId])
    return (
        <Modal
            onClose={() => props.handleClose()}
            open={props.isOpen}
            closeIcon={<Icon name='close' size='large' onClick={() => props.handleClose()} />}
            style={{ width: '80%' }}
        >
            <ModalHeader>Shared users</ModalHeader>
            <ModalContent>
                {
                    props.user.id === currentUser?.id &&
                    (
                        <>
                            <Select
                                placeholder='Select a user to share'
                                options={listOfUsersNonPart}
                                value={userIdToAdd.toString()}
                                onChange={(_e, { value }) => setUserIdToAdd(Number(value))}
                            />
                            <Button
                                className='margin-left-5'
                                disabled={!userIdToAdd || isLoadingUser}
                                onClick={() => props.handleChangeConfirmModalState(true, 'Share experiment', 'Are you sure to share experiment to user?', handleAddInstitution)}
                            >
                                Add user
                            </Button>
                        </>
                    )
                }

                <Segment>
                    <Grid columns={1}>
                        <GridColumn>
                            <List selection verticalAlign='middle'>
                                <div
                                    style={{
                                        maxHeight: '400px',
                                        overflowY: 'auto'
                                    }}
                                >
                                    {usersList.map(institution => (
                                        <ListItem key={institution.id} active={activeUser.id === institution.id}>
                                            <div style={{ display: 'flex', alignContent: 'center', flexDirection: 'row' }}>
                                                <div style={{ flex: 1 }}>
                                                    <ListContent onClick={() => setActiveUser(institution)}>
                                                        <ListHeader>
                                                            {institution.username}
                                                        </ListHeader>
                                                    </ListContent>
                                                </div>
                                                {currentUser?.id === props.user.id &&
                                                    (
                                                        <Icon
                                                            name='trash'
                                                            className='clickable'
                                                            disabled={isLoadingUser}
                                                            color='red'
                                                            title='Remove institution'
                                                            onClick={() => props.handleChangeConfirmModalState(true, 'Stop sharing to user', 'Are you sure to stop sharing experiment to user?', () => handleRemoveInstitution(institution.id))}
                                                        />
                                                    )
                                                }
                                            </div>
                                        </ListItem>
                                    ))}
                                </div>
                            </List>
                        </GridColumn>
                    </Grid>
                </Segment>
            </ModalContent>
        </Modal>
    )
}
