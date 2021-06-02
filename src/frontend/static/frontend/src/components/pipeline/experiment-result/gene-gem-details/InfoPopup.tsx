import React from 'react'
import { Icon, Popup, PopupContentProps } from 'semantic-ui-react'
import { SemanticShorthandItem } from 'semantic-ui-react/dist/commonjs/generic'

/**
 * Component's props
 */
interface InfoPopupProps {
    /** Text/Component to show in the Popup */
    content: SemanticShorthandItem<PopupContentProps>,
    /** Event to trigger (default 'click') */
    onEvent?: 'click' | 'hover'
    /** True to show in the top-right corner of parent element (default true) */
    onTop?: boolean,
    /** Id of the element (in case is needed to generate some particular CSS) */
    id?: string
    /** Extra classnames to add */
    extraClassName?: string
}

/**
 * Renders a Popup with help
 * @param props Component's props
 * @returns Component
 */
export const InfoPopup = (props: InfoPopupProps) => {
    const mustAddOnTopClass = props.onTop ?? true
    const onTopClassName = mustAddOnTopClass ? 'info-popup-on-top' : ''
    const extraClassName = props.extraClassName ?? ''
    const id = props.id ?? ''
    const onEvent = props.onEvent ?? 'click'

    return (
        <Popup
            on={onEvent}
            basic
            trigger={
                <Icon
                    name='question'
                    color='blue'
                    size='small'
                    circular
                    id={id}
                    className={`${onTopClassName} ${extraClassName} clickable`}
                />
            }
            content={props.content}
        />
    )
}
