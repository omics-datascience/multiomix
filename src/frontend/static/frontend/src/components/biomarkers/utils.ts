import { FitnessFunction } from './types'

const fitnessFunctionsOptions = [
    { key: FitnessFunction.CLUSTERING, text: 'Clustering', value: FitnessFunction.CLUSTERING },
    { key: FitnessFunction.SVM, text: 'SVM', value: FitnessFunction.SVM },
    { key: FitnessFunction.RF, text: 'RF', value: FitnessFunction.RF, disabled: true }
]

export { fitnessFunctionsOptions }
