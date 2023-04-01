import React from 'react'
import { Select } from 'semantic-ui-react'
import { FitnessFunctionParameters, FitnessFunction } from '../../../../types'
import { ClusteringPanel } from './ClusteringPanel'
import { SVMPanel } from './SVMPanel'

/** BlindSearch props. */
interface BlindSearchProps {
    fitnessFunction: FitnessFunction,
    fitnessFunctionParameters: FitnessFunctionParameters,
    handleChangeFitnessFunction: (fitnessFunction: FitnessFunction) => void,
    handleChangeClusterOption: (key: string, value: number) => void,
    handleChangeSvmOption: (key: string, value: number) => void,
}

/**
 * Renders a panel with the BlindSearch algorithm options.
 * @param props Component props.
 * @returns Component.
 */
export const BlindSearchPanel = (props: BlindSearchProps) => {
    const {
        fitnessFunction,
        fitnessFunctionParameters,
        handleChangeFitnessFunction,
        handleChangeClusterOption,
        handleChangeSvmOption
    } = props

    const getFitnessFunctionParametersPanel = () => {
        switch (fitnessFunction) {
            case FitnessFunction.CLUSTERING:
                return (
                    <ClusteringPanel
                        settings={fitnessFunctionParameters?.clusteringParameters ?? null}
                        handleChangeClusterOption={handleChangeClusterOption}
                    />
                )
            case FitnessFunction.SVM:
                return (
                    <SVMPanel
                        parameters={fitnessFunctionParameters.svmParameters}
                        handleChangeSvmOption={handleChangeSvmOption}
                    />
                )

            default:
                break
        }
    }
    return (
        <div>
            <Select
                placeholder='Fitness function'
                options={[
                    { key: FitnessFunction.CLUSTERING, text: 'Clustering', value: FitnessFunction.CLUSTERING },
                    { key: FitnessFunction.SVM, text: 'SVM', value: FitnessFunction.SVM },
                    { key: FitnessFunction.RF, text: 'RF', value: FitnessFunction.RF, disabled: true }
                ]}
                value={fitnessFunction ?? undefined}
                onChange={(_, { value }) => handleChangeFitnessFunction(value as FitnessFunction)}
            />
            {getFitnessFunctionParametersPanel()}
        </div>
    )
}
