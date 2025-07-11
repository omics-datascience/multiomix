import React, { useContext } from 'react'
import { Icon } from 'semantic-ui-react'
import { DjangoExperiment, ExperimentState } from '../../../utils/django_interfaces'
import { CurrentUserContext } from '../../Base'

interface Props {
    editExperiment: (experiment: DjangoExperiment) => void,
    experiment: DjangoExperiment,
    ownerId: number,
}

export const EditExperimentIcon = (props: Props) => {
    const currentUser = useContext(CurrentUserContext)

    if (props.ownerId !== currentUser?.id) {
        return <></>
    }

    return (
        <Icon
            name='pencil'
            className='clickable margin-left-5'
            color='yellow'
            title='Edit'
            onClick={() => props.editExperiment(props.experiment)}
            disabled={props.experiment.state !== ExperimentState.COMPLETED}
        />
    )
}
