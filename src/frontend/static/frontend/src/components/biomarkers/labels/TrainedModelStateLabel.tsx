import React from 'react'
import { Icon } from 'semantic-ui-react'
import { StateIconInfo } from '../../../utils/interfaces'
import { TrainedModelState } from '../types'
import { useIntl } from 'react-intl'

/** TrainedModelStateLabel props. */
interface TrainedModelStateLabelProps {
    /** TrainedModel's state. */
    trainedModelStateState: TrainedModelState,
    /** Indicates if the cross validation folds were modified to be stratified. */
    cvFoldsWereModified: boolean
}

/**
 * Renders a Label for the TrainedModel's state
 * @param props Component props.
 * @returns Component.
 */
export const TrainedModelStateLabel = (props: TrainedModelStateLabelProps) => {
    const intl = useIntl()
    let stateIcon: StateIconInfo

    switch (props.trainedModelStateState) {
        case TrainedModelState.COMPLETED:
            stateIcon = {
                iconName: 'check',
                color: props.cvFoldsWereModified ? 'orange' : 'green',
                loading: false,
                title: intl.formatMessage(
                    { id: 'trainedModelState.completed' },
                    { cvModified: props.cvFoldsWereModified }
                )

            }
            break
        case TrainedModelState.FINISHED_WITH_ERROR:
            stateIcon = {
                iconName: 'times',
                color: 'red',
                loading: false,
                title: intl.formatMessage({ id: 'trainedModelState.finishedWithError' })
            }
            break
        case TrainedModelState.WAITING_FOR_QUEUE:
            stateIcon = {
                iconName: 'wait',
                color: 'yellow',
                loading: false,
                title: intl.formatMessage({ id: 'trainedModelState.waitingForQueue' })

            }
            break
        case TrainedModelState.NO_SAMPLES_IN_COMMON:
            stateIcon = {
                iconName: 'user outline',
                color: 'red',
                loading: false,
                title: intl.formatMessage({ id: 'trainedModelState.noSamplesInCommon' })

            }
            break
        case TrainedModelState.IN_PROCESS:
            stateIcon = {
                iconName: 'sync alternate',
                color: 'yellow',
                loading: true,
                title: intl.formatMessage({ id: 'trainedModelState.inProcess' })

            }
            break
        case TrainedModelState.STOPPING:
            stateIcon = {
                iconName: 'stop',
                loading: false,
                title: intl.formatMessage({ id: 'trainedModelState.stopping' }),
                className: 'experiment-stopping-icon'
            }
            break
        case TrainedModelState.STOPPED:
            stateIcon = {
                iconName: 'stop',
                color: 'red',
                loading: false,
                title: intl.formatMessage({ id: 'trainedModelState.stopped' })

            }
            break
        case TrainedModelState.REACHED_ATTEMPTS_LIMIT:
            stateIcon = {
                iconName: 'undo',
                color: 'red',
                loading: false,
                title: intl.formatMessage({ id: 'trainedModelState.reachedAttemptsLimit' })

            }
            break
        case TrainedModelState.NO_FEATURES_FOUND:
            stateIcon = {
                iconName: 'times rectangle',
                color: 'red',
                loading: false,
                title: intl.formatMessage({ id: 'trainedModelState.noFeaturesFound' })

            }
            break
        case TrainedModelState.NO_BEST_MODEL_FOUND:
            stateIcon = {
                iconName: 'target',
                color: 'red',
                loading: false,
                title: intl.formatMessage({ id: 'trainedModelState.noBestModelFound' })

            }
            break
        case TrainedModelState.NUMBER_OF_SAMPLES_FEWER_THAN_CV_FOLDS:
            stateIcon = {
                iconName: 'user times',
                color: 'red',
                loading: false,
                title: intl.formatMessage({ id: 'trainedModelState.numberOfSamplesFewerThanCvFolds' })
            }
            break
        case TrainedModelState.MODEL_DUMP_NOT_AVAILABLE:
            stateIcon = {
                iconName: 'target',
                color: 'orange',
                loading: false,
                title: intl.formatMessage({ id: 'trainedModelState.modelDumpNotAvailable' })

            }
            break
        case TrainedModelState.TIMEOUT_EXCEEDED:
            stateIcon = {
                iconName: 'wait',
                color: 'red',
                loading: false,
                title: intl.formatMessage({ id: 'trainedModelState.timeoutExceeded' })

            }
            break
        case TrainedModelState.EMPTY_DATASET:
            stateIcon = {
                iconName: 'user times',
                color: 'red',
                loading: false,
                title: intl.formatMessage({ id: 'trainedModelState.emptyDataset' })

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
