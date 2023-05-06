import { DropdownItemProps } from 'semantic-ui-react'
import { FitnessFunction, SVMKernel } from './types'

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

export {
    fitnessFunctionsOptions,
    SVMKernelOptions
}
