import React from 'react'
import { Select } from 'semantic-ui-react'
import { Nullable } from '../../../../../../utils/interfaces'
import { BlindSearchFeatureSelection, BlindSearchFitnessFunction } from '../../../../types'
import { Clustering } from './Clustering'

interface Props {
    blindSearch: Nullable<BlindSearchFeatureSelection>,
}
const options2 = [
    { key: BlindSearchFitnessFunction.CLUSTERING, text: BlindSearchFitnessFunction.CLUSTERING, value: BlindSearchFitnessFunction.CLUSTERING, disabled: false },
    { key: BlindSearchFitnessFunction.SVM, text: BlindSearchFitnessFunction.SVM, value: BlindSearchFitnessFunction.SVM, disabled: false },
    { key: BlindSearchFitnessFunction.RF, text: BlindSearchFitnessFunction.RF, value: BlindSearchFitnessFunction.RF, disabled: true }
]
export const BlindSearch = (props: Props) => {
    const { blindSearch } = props
    const fitnessFunction = () => {
        switch (blindSearch?.fitnessFunction) {
            case BlindSearchFitnessFunction.CLUSTERING:
                return (<Clustering
                    clustering={blindSearch[BlindSearchFitnessFunction.CLUSTERING]}
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
                options={options2}
                value={blindSearch?.fitnessFunction}
                onChange={(_, { value }) => console.log(value)}
            />
            {
                fitnessFunction()
            }
        </div>
    )
}
