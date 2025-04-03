import React, { useContext, useState } from 'react'
import { Icon } from 'semantic-ui-react'
import { DjangoExperiment } from '../../../utils/django_interfaces'
import { CurrentUserContext } from '../../Base'
import { getDjangoHeader } from '../../../utils/util_functions'
import ky from 'ky'

declare const urlPostSwitchInstitutionPublicView

interface Props {
    experiment: DjangoExperiment
    handleChangeConfirmModalState: (setOption: boolean, headerText: string, contentText: string, onConfirm: () => void) => void;
}

export const PublicButtonExperiment = (props: Props) => {
    const currentUser = useContext(CurrentUserContext)
    const [isLoading, setIsLoading] = useState(false)

    /**
     * Function to switch visibility of experiment
     */
    const handleSwitchVisibility = () => {
        setIsLoading(true)
        const settings = {
            headers: getDjangoHeader(),
            json: {
                experimentId: props.experiment.id
            }
        }

        ky.post(urlPostSwitchInstitutionPublicView, settings).then((response) => {
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

    if (currentUser?.id !== props.experiment.user.id) {
        return <></>
    }

    return (
        <Icon
            name='external share'
            className='clickable margin-left-5'
            disabled={isLoading}
            color={props.experiment.is_public ? 'red' : 'teal'}
            title={props.experiment.is_public ? 'Make experiment private' : 'Make experiment public'}
            onClick={() => props.handleChangeConfirmModalState(true, props.experiment.is_public ? 'Make experiment private' : 'Make experiment public', props.experiment.is_public ? 'Are you sure to make the experiment private?' : 'Are you sure to make the experiment public', handleSwitchVisibility)}
        />
    )
}
