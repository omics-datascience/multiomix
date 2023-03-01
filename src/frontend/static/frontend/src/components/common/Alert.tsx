import React from 'react'
import { Icon, TransitionablePortal } from 'semantic-ui-react'
import { CustomAlert, CustomAlertTypes } from '../../utils/interfaces'
import './../../css/alert.css'

interface AlertProps extends CustomAlert {
    onClose: () => void,
}
const colorsPallete = {
    [CustomAlertTypes.warning]: '#fbbd08',
    [CustomAlertTypes.error]: '#db2828',
    [CustomAlertTypes.success]: '#21ba45'
}
export const Alert = ({
    onClose,
    isOpen,
    message,
    type,
    duration
}: AlertProps) => {
    return (
        <TransitionablePortal
            onClose={onClose}
            open={isOpen}
            transition={{ duration }}
        >
            <div className='alert--container--transition'>
                <div className='alert--container--alert' style={{
                    border: `1px solid ${colorsPallete[type]}`
                }}>
                    {
                        type === CustomAlertTypes.success && <Icon className='alert--icon' style={{ color: `${colorsPallete[CustomAlertTypes.success]}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }} name='check' />
                    }
                    {
                        type === CustomAlertTypes.error && <Icon className='alert--icon' style={{ color: `${colorsPallete[CustomAlertTypes.error]}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }} name='close' />
                    }
                    {
                        type === CustomAlertTypes.warning && <Icon className='alert--icon' style={{ color: `${colorsPallete[CustomAlertTypes.warning]}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }} name='exclamation' />
                    }
                    <p>{message}</p>
                </div>
            </div>
        </TransitionablePortal >
    )
}
