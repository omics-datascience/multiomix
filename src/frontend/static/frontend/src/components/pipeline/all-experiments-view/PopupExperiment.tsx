import React from 'react'
import { Icon, Popup, PopupContentProps, SemanticShorthandItem } from 'semantic-ui-react'

interface Props{
    content: SemanticShorthandItem<PopupContentProps>,
}

export const PopupExperiment = (props: Props) => {
    return (
        <Popup
            on='click'
            basic
            trigger={
                <Icon
                    name='ellipsis vertical'
                    color='blue'
                    size='small'
                    className='clickable'
                />
            }
            content={props.content}
        />
    )
}
