import React, { useContext, useState } from 'react'
import { Icon } from 'semantic-ui-react'
import ky from 'ky'
import { CurrentUserContext } from '../Base'
import { BiomarkerSimple } from './types'
import { getDjangoHeader } from '../../utils/util_functions'

declare const urlPostSwitchBiomarkerPublicView

interface Props {
    biomarker: BiomarkerSimple
    handleChangeConfirmModalState: (setOption: boolean, headerText: string, contentText: string, onConfirm: () => void) => void;
}

export const PublicButtonBiomarker = (props: Props) => {
    const currentUser = useContext(CurrentUserContext)
    const [isLoading, setIsLoading] = useState(false)

    /**
     * Function to switch visibility of biomarker
     */
    const handleSwitchVisibility = () => {
        setIsLoading(true)
        const settings = {
            headers: getDjangoHeader(),
            json: {
                biomarkerId: props.biomarker.id
            }
        }

        ky.post(urlPostSwitchBiomarkerPublicView, settings).then((response) => {
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

    if (currentUser?.id !== props.biomarker.user.id) {
        return <></>
    }

    return (
        <Icon
            name='external share'
            className='clickable margin-left-5'
            disabled={isLoading}
            color={props.biomarker.is_public ? 'red' : 'teal'}
            title={props.biomarker.is_public ? 'Make biomarker private' : 'Make biomarker public'}
            onClick={() => props.handleChangeConfirmModalState(true, props.biomarker.is_public ? 'Make biomarker private' : 'Make biomarker public', props.biomarker.is_public ? 'Are you sure to make the biomarker private?' : 'Are you sure to make the biomarker public', handleSwitchVisibility)}
        />
    )
}
