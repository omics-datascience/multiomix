import React from 'react'
import { Select } from 'semantic-ui-react'
import { FitnessFunctionParameters, FitnessFunction } from '../../../types'
import { ClusteringPanel } from './algorithms/ClusteringPanel'
import { SVMPanel } from './algorithms/SVMPanel'
import { fitnessFunctionsOptions } from '../../../utils'
import { RFPanel } from './algorithms/RFPanel'

/** BlindSearch props. */
interface BlindSearchProps {
    fitnessFunction: FitnessFunction,
    fitnessFunctionParameters: FitnessFunctionParameters,
    handleChangeFitnessFunction: (fitnessFunction: FitnessFunction) => void,
    handleChangeClusterOption: (key: string, value: number) => void,
    handleChangeSVMOption: (key: string, value: number) => void,
    handleChangeRFOption: (key: string, value: number) => void,
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
        handleChangeSVMOption,
        handleChangeRFOption
    } = props

    /**
     * Returns the panel with the options of the selected fitness function.
     * @returns Component.
     */
    const getFitnessFunctionParametersPanel = (): JSX.Element => {
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
                        handleChangeSVMOption={handleChangeSVMOption}
                    />
                )
            case FitnessFunction.RF:
                return (
                    <RFPanel
                        parameters={fitnessFunctionParameters.rfParameters}
                        handleChangeRFOption={handleChangeRFOption}
                    />
                )
        }
    }
    return (
        <>
            <Select
                placeholder='Fitness function'
                className='selection-select'
                options={fitnessFunctionsOptions}
                value={fitnessFunction ?? undefined}
                onChange={(_, { value }) => handleChangeFitnessFunction(value as FitnessFunction)}
            />

            {getFitnessFunctionParametersPanel()}
        </>
    )
}
