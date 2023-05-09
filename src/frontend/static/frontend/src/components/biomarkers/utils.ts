import { DropdownItemProps } from 'semantic-ui-react'
import { BiomarkerState, FitnessFunction, SVMKernel } from './types'

/** Available fitness functions models to use. */
const fitnessFunctionsOptions: DropdownItemProps[] = [
    { key: FitnessFunction.CLUSTERING, text: 'Clustering', value: FitnessFunction.CLUSTERING },
    { key: FitnessFunction.SVM, text: 'SVM', value: FitnessFunction.SVM },
    { key: FitnessFunction.RF, text: 'RF', value: FitnessFunction.RF, disabled: true }
]

/** Available options for a SVM kernel. */
const SVMKernelOptions: DropdownItemProps[] = [
    { key: SVMKernel.LINEAR, text: 'Linear', value: SVMKernel.LINEAR },
    { key: SVMKernel.POLYNOMIAL, text: 'Polynomial', value: SVMKernel.POLYNOMIAL },
    { key: SVMKernel.RBF, text: 'RBF', value: SVMKernel.RBF }
]

/** Available options for a Biomarker's state. */
const biomarkerStateOptions: DropdownItemProps[] = [
    { key: BiomarkerState.COMPLETED, text: 'Completed', value: BiomarkerState.COMPLETED },
    { key: BiomarkerState.FINISHED_WITH_ERROR, text: 'Finished with error', value: BiomarkerState.FINISHED_WITH_ERROR },
    { key: BiomarkerState.WAITING_FOR_QUEUE, text: 'Waiting for queue', value: BiomarkerState.WAITING_FOR_QUEUE },
    { key: BiomarkerState.NO_SAMPLES_IN_COMMON, text: 'No samples in common', value: BiomarkerState.NO_SAMPLES_IN_COMMON },
    { key: BiomarkerState.IN_PROCESS, text: 'In process', value: BiomarkerState.IN_PROCESS },
    { key: BiomarkerState.STOPPING, text: 'Stopping', value: BiomarkerState.STOPPING },
    { key: BiomarkerState.STOPPED, text: 'Stopped', value: BiomarkerState.STOPPED },
    { key: BiomarkerState.REACHED_ATTEMPTS_LIMIT, text: 'Reached attempts limit', value: BiomarkerState.REACHED_ATTEMPTS_LIMIT }
]

export {
    fitnessFunctionsOptions,
    SVMKernelOptions,
    biomarkerStateOptions
}
