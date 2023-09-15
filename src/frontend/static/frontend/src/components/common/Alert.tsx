import React from 'react'
import { Icon, SemanticICONS, TransitionablePortal } from 'semantic-ui-react'
import { CustomAlert, CustomAlertTypes } from '../../utils/interfaces'
import './../../css/alert.css'

/** Alert's props. */
interface AlertProps extends CustomAlert {
    onClose: () => void,
}

/** Color and icon for the Alert. */
type AlertStyle = {
    [key: string]: {
        color: string,
        iconName: SemanticICONS
    }
}

const alertStyles: AlertStyle = {
    [CustomAlertTypes.WARNING]: {
        color: '#fbbd08',
        iconName: 'check'
    },
    [CustomAlertTypes.ERROR]: {
        color: '#db2828',
        iconName: 'close'
    },
    [CustomAlertTypes.SUCCESS]: {
        color: '#21ba45',
        iconName: 'exclamation'
    }
}

/**
 * Renders a custom Alert which can fadeout on click or on timeout.
 * @param props Component's props.
 * @returns Component.
 */
export const Alert = (props: AlertProps) => {
    const {
        onClose,
        isOpen,
        message,
        type,
        duration
    } = props
    const { color, iconName } = alertStyles[type]

    return (
        <TransitionablePortal
            onClose={onClose}
            open={isOpen}
            transition={{ duration }}
        >
            <div className='alert--container--transition' style={{ zIndex: 10000 }}>
                <div className='alert--container--alert' style={{ border: `1px solid ${color}` }}>
                    <Icon
                        className='alert--icon'
                        style={{ color }}
                        name={iconName}
                    />
                    <p className='alert--message'>{message}</p>
                </div>
            </div>
        </TransitionablePortal>
    )
}
