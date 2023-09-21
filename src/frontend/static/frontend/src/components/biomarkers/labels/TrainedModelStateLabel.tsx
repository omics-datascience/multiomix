import React from 'react'
import { Icon } from 'semantic-ui-react'
import { StateIconInfo } from '../../../utils/interfaces'
import { TrainedModelState } from '../types'

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
    let stateIcon: StateIconInfo
    switch (props.trainedModelStateState) {
        case TrainedModelState.COMPLETED:
            stateIcon = {
                iconName: 'check',
                color: props.cvFoldsWereModified ? 'orange' : 'green',
                loading: false,
                title: 'The experiment is complete' + (props.cvFoldsWereModified ? ' (number of CrossValidation folds were modified to be stratified)' : '')
            }
            break
        case TrainedModelState.FINISHED_WITH_ERROR:
            stateIcon = {
                iconName: 'times',
                color: 'red',
                loading: false,
                title: 'The experiment has finished with errors. Try again'
            }
            break
        case TrainedModelState.WAITING_FOR_QUEUE:
            stateIcon = {
                iconName: 'wait',
                color: 'yellow',
                loading: false,
                title: 'The process of this experiment will start soon'
            }
            break
        case TrainedModelState.NO_SAMPLES_IN_COMMON:
            stateIcon = {
                iconName: 'user outline',
                color: 'red',
                loading: false,
                title: 'Datasets don\'t have samples in common'
            }
            break
        case TrainedModelState.IN_PROCESS:
            stateIcon = {
                iconName: 'sync alternate',
                color: 'yellow',
                loading: true,
                title: 'The experiment is being processed'
            }
            break
        case TrainedModelState.STOPPING:
            stateIcon = {
                iconName: 'stop',
                loading: false,
                title: 'The experiment is being stopped',
                className: 'experiment-stopping-icon'
            }
            break
        case TrainedModelState.STOPPED:
            stateIcon = {
                iconName: 'stop',
                color: 'red',
                loading: false,
                title: 'The experiment was stopped'
            }
            break
        case TrainedModelState.REACHED_ATTEMPTS_LIMIT:
            stateIcon = {
                iconName: 'undo',
                color: 'red',
                loading: false,
                title: 'The experiment has failed several times. Try changing some parameters and try again'
            }
            break
        case TrainedModelState.NO_FEATURES_FOUND:
            stateIcon = {
                iconName: 'times rectangle',
                color: 'red',
                loading: false,
                title: 'No features were found. Try changing some parameters and try again'
            }
            break
        case TrainedModelState.NO_BEST_MODEL_FOUND:
            stateIcon = {
                iconName: 'target',
                color: 'red',
                loading: false,
                title: 'No model could be obtained. Maybe there are fewer samples than number of folds in the CrossValidation or the data presents high collinearity. Try changing some parameters as penalizer or number of folds in the CV process and try again'
            }
            break
        case TrainedModelState.NUMBER_OF_SAMPLES_FEWER_THAN_CV_FOLDS:
            stateIcon = {
                iconName: 'user times',
                color: 'red',
                loading: false,
                title: 'There is a less number of members of each class than the number of CrossValidation folds. We tried to set a lower split number but it still failed. Try selecting a larger dataset and try again'
            }
            break
        case TrainedModelState.MODEL_DUMP_NOT_AVAILABLE:
            stateIcon = {
                iconName: 'target',
                color: 'orange',
                loading: false,
                title: 'The Feature Selection process has finished correctly, but there was a problem obtaining the model. Try training a new model'
            }
            break
        case TrainedModelState.TIMEOUT_EXCEEDED:
            stateIcon = {
                iconName: 'wait',
                color: 'red',
                loading: false,
                title: 'The training process has reached the timeout limit. Try changing some parameters and try again'
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
