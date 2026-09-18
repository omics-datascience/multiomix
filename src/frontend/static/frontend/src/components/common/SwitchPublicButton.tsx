import React, { useContext, useState } from 'react'
import { Icon } from 'semantic-ui-react'
import { CurrentUserContext } from '../Base'
import { getDjangoHeader } from '../../utils/util_functions'
import ky from 'ky'
import { useIntl } from 'react-intl'

declare const urlPostSwitchPublicView

interface Props {
    publicButtonEntity: { id: number, user: { id: number }, is_public: boolean }
    nameEntity: string
    publicKey: string
    handleChangeConfirmModalState: (setOption: boolean, headerText: string, contentText: string, onConfirm: () => void) => void;
}

/**
 * Component to switch visibility of experiment
 * @param props The properties for the SwitchPublicButton component.
 * @returns The rendered component.
 */
export const SwitchPublicButton = (props: Props) => {
    const currentUser = useContext(CurrentUserContext)
    const [isLoading, setIsLoading] = useState(false)
    const intl = useIntl()

    const makePrivateText = intl.formatMessage({ id: 'switchPublicButton.makePrivate' }, { nameEntity: props.nameEntity })
    const makePublicText = intl.formatMessage({ id: 'switchPublicButton.makePublic' }, { nameEntity: props.nameEntity })
    const confirmMakePrivateText = intl.formatMessage({ id: 'switchPublicButton.confirmMakePrivate' }, { nameEntity: props.nameEntity })
    const confirmMakePublicText = intl.formatMessage({ id: 'switchPublicButton.confirmMakePublic' }, { nameEntity: props.nameEntity })

    /**
     * Function to switch visibility of experiment
     */
    const handleSwitchVisibility = () => {
        setIsLoading(true)
        const settings = {
            headers: getDjangoHeader(),
            json: {
                [props.publicKey]: props.publicButtonEntity.id
            }
        }

        ky.post(urlPostSwitchPublicView, settings).then((response) => {
            response.json().then(() => {
            }).catch((err) => {
                console.error('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.error('Error switching public view ->', err)
        }).finally(() => {
            setIsLoading(false)
        })
    }

    if (currentUser?.id !== props.publicButtonEntity.user.id) {
        return <></>
    }

    return (
        <Icon
            name='external share'
            className='clickable margin-left-5'
            disabled={isLoading}
            color={props.publicButtonEntity.is_public ? 'red' : 'teal'}
            title={props.publicButtonEntity.is_public ? makePrivateText : makePublicText}
            onClick={() => props.handleChangeConfirmModalState(true,
                props.publicButtonEntity.is_public ? makePrivateText : makePublicText,
                props.publicButtonEntity.is_public ? confirmMakePrivateText : confirmMakePublicText,
                handleSwitchVisibility)}
        />
    )
}
