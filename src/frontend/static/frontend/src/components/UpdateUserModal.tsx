import ky from 'ky'
import React, { useState } from 'react'
import { Button, Divider, Icon, Input, Message, MessageHeader, Modal, ModalActions, ModalContent, ModalHeader, Segment } from 'semantic-ui-react'
import { getDjangoHeader } from '../utils/util_functions'
import { DjangoUser } from '../utils/django_interfaces'
import { CustomAlertTypes, Nullable } from '../utils/interfaces'

declare const urlUpdateUser: string

interface Props {
    isOpen: boolean,
    handleClose: VoidFunction,
    currentUser: DjangoUser,
    handleChangeConfirmModalState: (setOption: boolean, headerText: string, contentText: string, onConfirm: Function) => void,
    handleUpdateAlert: (isOpen: boolean, type: CustomAlertTypes, message: string, callback: Nullable<Function>) => void,
}

export const UpdateUserModal = (props: Props) => {
    const [isLoading, setIsLoading] = useState(false)
    const [firstName, setFirstName] = useState(props.currentUser.first_name)
    const [lastName, setLastName] = useState(props.currentUser.last_name)
    const [password, setPassword] = useState({ text: '', visibility: false })
    const [passwordCheck, setPasswordCheck] = useState({ text: '', visibility: false })
    const [textError, setTextError] = useState({ isOpen: false, title: '', body: '' })
    const handleUpdateUser = () => {
        const myHeaders = getDjangoHeader()
        let body

        if (password.text.length || passwordCheck.text.length) {
            if (password.text !== passwordCheck.text) {
                setTextError(prevState => ({ ...prevState, title: 'Both password have to be equal', isOpen: true, body: 'Ensure to both password being equal.' }))
                return
            }
    
            if (password.text.length < 8) {
                setTextError(prevState => ({ ...prevState, title: 'Password length', isOpen: true, body: 'Password has at lesat 8 characters.' }))
                return
            }
            body = {
                last_name: lastName.trim(),
                first_name: firstName.trim(),
                password: password.text.trim()
            }
        } else {
            body = {
                "last_name": lastName.trim(),
                "first_name": firstName.trim()
            }
        }
        setIsLoading(true)
        ky.patch(urlUpdateUser, { headers: myHeaders, json: body }).then((response) => {
            response.json().then((_: any) => {
                props.handleUpdateAlert(true, CustomAlertTypes.SUCCESS, 'Credentials changed!', () => {
                    setTextError({ isOpen: false, title: '', body: '' })
                    setPassword(prevState => ({ ...prevState, text: '' }))
                    setPasswordCheck(prevState => ({ ...prevState, text: '' }))
                    window.location.reload();
                })
            })
        }).catch((err) => {
            console.error('Error parsing JSON ->', err)
            props.handleUpdateAlert(true, CustomAlertTypes.ERROR, 'Error updating credentials!', null)
        }).catch((err) => {
            console.error('Error updating profile ->', err)
            props.handleUpdateAlert(true, CustomAlertTypes.ERROR, 'Error updating credentials!', null)
        }).finally(() => {
            setIsLoading(false)
        })
    }
    return (
        <Modal
            open={props.isOpen}
            closeIcon={<Icon name='close' size='large' onClick={props.handleClose} />}
            style={{ width: '30%' }}
        >
            <ModalHeader>Edit {props.currentUser.username} information</ModalHeader>

            <ModalContent>
                <Segment>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className='padding-vertical-1'>
                            <h6 style={{ fontSize: '18px', margin: 1 }}>
                                Email:
                            </h6>
                            <Input value={props.currentUser.email} disabled />
                        </div>
                        <div>
                            <h6 style={{ fontSize: '16px', margin: 1 }}>
                                First name:
                            </h6>
                            <Input placeholder='Enter first name' value={firstName} onChange={(e, { value }) => setFirstName(value)} />
                        </div>
                        <div className='padding-vertical-1'>
                            <h6 style={{ fontSize: '16px', margin: 1 }}>
                                Last name:
                            </h6>
                            <Input placeholder='Enter last name' value={lastName} onChange={(e, { value }) => setLastName(value)} />
                        </div>
                    </div>
                    <Divider />
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div className='padding-vertical-1'>

                            <h6 style={{ fontSize: '16px', margin: 1 }}>
                                Reset password:
                            </h6>
                            <Input
                                type={password.visibility ? 'text' : 'password'}
                                icon={
                                    <Button
                                        icon
                                        onClick={(_) => setPassword(prevState => ({ ...prevState, visibility: !prevState.visibility }))}
                                    >
                                        <Icon
                                            name={password.visibility ? 'eye slash' : 'eye'}
                                        />
                                    </Button>
                                }
                                value={password.text}
                                onChange={(e, { value }) => setPassword(prevState => ({ ...prevState, text: value.trim() }))}
                            />
                        </div>
                        <div className='padding-vertical-1'>
                            <p>Repeat password:</p>
                            <Input
                                type={passwordCheck.visibility ? 'text' : 'password'}
                                icon={
                                    <Button
                                        icon
                                        onClick={(_) => setPasswordCheck(prevState => ({ ...prevState, visibility: !prevState.visibility }))}
                                    >
                                        <Icon
                                            name={passwordCheck.visibility ? 'eye slash' : 'eye'}
                                        />
                                    </Button>
                                }
                                value={passwordCheck.text}
                                onChange={(e, { value }) => setPasswordCheck(prevState => ({ ...prevState, text: value.trim() }))}
                            />
                            {textError.isOpen &&
                                <Message negative>
                                    <MessageHeader>{textError.title}</MessageHeader>
                                    <p>{textError.body}</p>
                                </Message>
                            }
                        </div>
                    </div>
                </Segment>
            </ModalContent>
            <ModalActions>
                <Button onClick={props.handleClose} disabled={isLoading}>
                    Cancel
                </Button>
                <Button
                    color="green"
                    loading={isLoading}
                    disabled={isLoading}
                    onClick={!password.text.length && !passwordCheck.text.length ? () => handleUpdateUser() : () => props.handleChangeConfirmModalState(true, 'Change profile', 'Are you sure to change your profile? You have to reaload de app.', handleUpdateUser)}
                >
                    Confirm
                </Button>
            </ModalActions>
        </Modal>
    )
}
