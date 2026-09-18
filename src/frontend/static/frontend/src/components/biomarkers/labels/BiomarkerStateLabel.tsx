import React from 'react'
import { Icon } from 'semantic-ui-react'
import { StateIconInfo } from '../../../utils/interfaces'
import { BiomarkerState } from '../types'
import { useIntl } from 'react-intl'

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
    const intl = useIntl()
    let stateIcon: StateIconInfo

    switch (props.biomarkerState) {
        case BiomarkerState.COMPLETED:
            stateIcon = {
                iconName: 'check',
                color: 'green',
                loading: false,
                title: intl.formatMessage({ id: 'biomarkerState.completed' })
            }
            break
        case BiomarkerState.FINISHED_WITH_ERROR:
            stateIcon = {
                iconName: 'times',
                color: 'red',
                loading: false,
                title: intl.formatMessage({ id: 'biomarkerState.finishedWithError' })
            }
            break
        case BiomarkerState.WAITING_FOR_QUEUE:
            stateIcon = {
                iconName: 'wait',
                color: 'yellow',
                loading: false,
                title: intl.formatMessage({ id: 'biomarkerState.waitingForQueue' })

            }
            break
        case BiomarkerState.NO_SAMPLES_IN_COMMON:
            stateIcon = {
                iconName: 'user outline',
                color: 'red',
                loading: false,
                title: intl.formatMessage({ id: 'biomarkerState.noSamplesInCommon' })
            }
            break
        case BiomarkerState.IN_PROCESS:
            stateIcon = {
                iconName: 'sync alternate',
                color: 'yellow',
                loading: true,
                title: intl.formatMessage({ id: 'biomarkerState.inProcess' })
            }
            break
        case BiomarkerState.STOPPING:
            stateIcon = {
                iconName: 'stop',
                loading: false,
                title: intl.formatMessage({ id: 'biomarkerState.stopping' }),
                className: 'experiment-stopping-icon'
            }
            break
        case BiomarkerState.STOPPED:
            stateIcon = {
                iconName: 'stop',
                color: 'red',
                loading: false,
                title: intl.formatMessage({ id: 'biomarkerState.stopped' })
            }
            break
        case BiomarkerState.REACHED_ATTEMPTS_LIMIT:
            stateIcon = {
                iconName: 'undo',
                color: 'red',
                loading: false,
                title: intl.formatMessage({ id: 'biomarkerState.reachedAttemptsLimit' })
            }
            break
        case BiomarkerState.NO_FEATURES_FOUND:
            stateIcon = {
                iconName: 'times rectangle',
                color: 'red',
                loading: false,
                title: intl.formatMessage({ id: 'biomarkerState.noFeaturesFound' })
            }
            break
        case BiomarkerState.EMPTY_DATASET:
            stateIcon = {
                iconName: 'user times',
                color: 'red',
                loading: false,
                title: intl.formatMessage({ id: 'biomarkerState.emptyDataset' })
            }
            break
        case BiomarkerState.NO_VALID_MOLECULES:
            stateIcon = {
                iconName: 'browser',
                color: 'red',
                loading: false,
                title: intl.formatMessage({ id: 'biomarkerState.noValidMolecules' })
            }
            break
        case BiomarkerState.NUMBER_OF_SAMPLES_FEWER_THAN_CV_FOLDS:
            stateIcon = {
                iconName: 'user times',
                color: 'red',
                loading: false,
                title: intl.formatMessage({ id: 'biomarkerState.numberOfSamplesFewerThanCvFolds' })
            }
            break
        case BiomarkerState.TIMEOUT_EXCEEDED:
            stateIcon = {
                iconName: 'wait',
                color: 'red',
                loading: false,
                title: intl.formatMessage({ id: 'biomarkerState.timeoutExceeded' })
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
