import React from 'react'
import { Icon } from 'semantic-ui-react'
import { StateIconInfo } from '../../../utils/interfaces'
import { TrainedModelState } from '../types'

/** TrainedModelStateLabel props. */
interface TrainedModelStateLabelProps {
    /** Biomarker's state. */
    trainedModelStateState: TrainedModelState
}

/**
 * Renders a Label for the Biomarker's state
 * @param props Component props.
 * @returns Component.
 */
export const TrainedModelStateLabel = (props: TrainedModelStateLabelProps) => {
    let stateIcon: StateIconInfo
    switch (props.trainedModelStateState) {
        case TrainedModelState.COMPLETED:
            stateIcon = {
                iconName: 'check',
                color: 'green',
                loading: false,
                title: 'The experiment is complete'
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
                title: 'The experiment has failed several times. Try changing some parameters and try again.'
            }
            break
        case TrainedModelState.NO_FEATURES_FOUND:
            stateIcon = {
                iconName: 'times rectangle',
                color: 'red',
                loading: false,
                title: 'No features were found. Try changing some parameters and try again.'
            }
            break
        case TrainedModelState.NO_BEST_MODEL_FOUND:
            stateIcon = {
                iconName: 'target',
                color: 'red',
                loading: false,
                title: 'No model could be obtained. Maybe there are fewer samples than number of folds in the CrossValidation or the data presents high collinearity. Try changing some parameters as penalizer or number of folds in the CV process and try again.'
            }
            break
        case TrainedModelState.NUMBER_OF_SAMPLES_FEWER_THAN_CV_FOLDS:
            stateIcon = {
                iconName: 'user times',
                color: 'red',
                loading: false,
                title: 'There are fewer samples than number of folds in the CrossValidation. Try changing the number of folds in the CV process or select a larger dataset and try again.'
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
