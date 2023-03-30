import React from 'react'
import { Select } from 'semantic-ui-react'
import { Nullable } from '../../../../../../utils/interfaces'
import { BlindSearchFeatureSelection, FitnessFunctions } from '../../../../types'
import { Clustering } from './Clustering'
import { Svm } from './Svm'

interface Props {
    blindSearch: Nullable<BlindSearchFeatureSelection>,
    handleChangeFitnessFunction: (fitnessFunction: FitnessFunctions) => void,
    handleChangeClusterOption: (value: number, key: string) => void,
    handleChangeSvmOption: (value: number, key: string) => void,
}
const options = [
    { key: FitnessFunctions.CLUSTERING, text: 'Clustering', value: FitnessFunctions.CLUSTERING, disabled: false },
    { key: FitnessFunctions.SVM, text: 'SVM', value: FitnessFunctions.SVM, disabled: false },
    { key: FitnessFunctions.RF, text: 'RF', value: FitnessFunctions.RF, disabled: true }
]
export const BlindSearch = (props: Props) => {
    const {
        blindSearch,
        handleChangeFitnessFunction,
        handleChangeClusterOption,
        handleChangeSvmOption
    } = props
    const fitnessFunction = () => {
        switch (blindSearch?.fitnessFunction) {
            case FitnessFunctions.CLUSTERING:
                return (<Clustering
                    clustering={blindSearch[FitnessFunctions.CLUSTERING]}
                    handleChangeClusterOption={handleChangeClusterOption}
                />)
            case FitnessFunctions.SVM:
                return (<Svm
                    handleChangeSvmOption={handleChangeSvmOption}
                    svm={blindSearch[FitnessFunctions.SVM]}
                />)

            default:
                break
        }
    }
    return (
        <div>
            <Select
                className=''
                placeholder='Fitness function'
                name='moleculeSelected'
                options={options}
                value={blindSearch?.fitnessFunction}
                onChange={(_, { value }) => handleChangeFitnessFunction(value as FitnessFunctions)}
            />
            {
                fitnessFunction()
            }
        </div>
    )
}
