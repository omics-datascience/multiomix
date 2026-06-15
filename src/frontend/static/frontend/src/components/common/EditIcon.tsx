import React, { useContext } from 'react'
import { Icon } from 'semantic-ui-react'
import { CurrentUserContext } from '../Base'
import { Nullable } from '../../utils/interfaces'
import { useIntl } from 'react-intl'

interface Props {
    editExperiment: () => void,
    ownerId: Nullable<number>,
    disabled: boolean
}

export const EditIcon = (props: Props) => {
    const currentUser = useContext(CurrentUserContext)
    const intl = useIntl()

    if (props.ownerId !== currentUser?.id) {
        return <></>
    }

    return (
        <Icon
            name='pencil'
            className='clickable margin-left-5'
            color='yellow'
            title={intl.formatMessage({ id: 'common.edit' })}
            onClick={props.editExperiment}
            disabled={props.disabled}
        />
    )
}
