import React from 'react'
import { Select } from 'semantic-ui-react'
import { FitnessFunctionParameters, FitnessFunctions } from '../../../../types'
import { ClusteringPanel } from './ClusteringPanel'
import { SVMPanel } from './SVMPanel'

/** BlindSearch props. */
interface BlindSearchProps {
    fitnessFunction: FitnessFunctions,
    fitnessFunctionParameters: FitnessFunctionParameters,
    handleChangeFitnessFunction: (fitnessFunction: FitnessFunctions) => void,
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
            case FitnessFunctions.CLUSTERING:
                return (
                    <ClusteringPanel
                        settings={fitnessFunctionParameters?.clusteringParameters ?? null}
                        handleChangeClusterOption={handleChangeClusterOption}
                    />
                )
            case FitnessFunctions.SVM:
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
                    { key: FitnessFunctions.CLUSTERING, text: 'Clustering', value: FitnessFunctions.CLUSTERING },
                    { key: FitnessFunctions.SVM, text: 'SVM', value: FitnessFunctions.SVM },
                    { key: FitnessFunctions.RF, text: 'RF', value: FitnessFunctions.RF, disabled: true }
                ]}
                value={fitnessFunction ?? undefined}
                onChange={(_, { value }) => handleChangeFitnessFunction(value as FitnessFunctions)}
            />
            {getFitnessFunctionParametersPanel()}
        </div>
    )
}
