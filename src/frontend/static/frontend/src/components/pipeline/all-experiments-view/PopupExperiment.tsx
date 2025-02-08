import React, { useContext } from 'react'
import { Icon, Popup, PopupContentProps, SemanticShorthandItem } from 'semantic-ui-react'
import { CurrentUserContext } from '../../Base'

interface Props{
    content: SemanticShorthandItem<PopupContentProps>,

}

export const PopupExperiment = (props:Props) => {
    const currentUser = useContext(CurrentUserContext)

    return (
        <Popup
            on={'click'}
            basic
            trigger={
                <Icon
                    name='ellipsis vertical'
                    color='blue'
                    size='small'
                    className='clickable'
                />
            }
            content={props.content} />

    )
}
