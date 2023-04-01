import React from 'react'
import { Icon } from 'semantic-ui-react'
import { BiomarkerState } from './types'
import { StateIconInfo } from '../../utils/interfaces'

/** BiomarkerStateLabel props. */
interface BiomarkerStateLabelProps {
    /** Biomarker's state. */
    biomarkerState: BiomarkerState
}

/**
 * Renders a Label for the Biomarker's state
 * @param props Component props.
 * @returns Component.
 */
export const BiomarkerStateLabel = (props: BiomarkerStateLabelProps) => {
    let stateIcon: StateIconInfo
    switch (props.biomarkerState) {
        case BiomarkerState.CREATED:
            stateIcon = {
                iconName: 'check',
                color: 'green',
                loading: false,
                title: 'The experiment is complete'
            }
            break
        case BiomarkerState.FAILED:
            stateIcon = {
                iconName: 'times',
                color: 'red',
                loading: false,
                title: 'The experiment has finished with errors. Try again'
            }
            break
        case BiomarkerState.PROCESSING:
            stateIcon = {
                iconName: 'sync alternate',
                color: 'yellow',
                loading: true,
                title: 'The experiment is being processed'
            }
            break
    }

    return (
        <Icon
            title={stateIcon.title}
            className={stateIcon.className}
            name={stateIcon.iconName}
            color={stateIcon.color}
            loading={stateIcon.loading}
        />
    )
}
