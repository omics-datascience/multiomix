import React from 'react'
import { Form } from 'semantic-ui-react'
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
    handleChangeFitnessFunctionOption: <T extends keyof FitnessFunctionParameters, M extends keyof FitnessFunctionParameters[T]>(fitnessFunction: T, key: M, value: FitnessFunctionParameters[T][M]) => void,
    isExpertOn: boolean,
}

/**
 * Renders a panel with the BlindSearch algorithm options.
 * TODO: rename this component, this is used in BBHA and other panels
 * @param props Component props.
 * @returns Component.
 */
export const BlindSearchPanel = (props: BlindSearchProps) => {
    const {
        fitnessFunction,
        fitnessFunctionParameters,
        handleChangeFitnessFunction,
        handleChangeFitnessFunctionOption,
        isExpertOn
    } = props

    /**
     * Returns the panel with the options of the selected fitness function.
     * @returns Component.
     */
    const getFitnessFunctionParametersPanel = (): JSX.Element => {
        switch (fitnessFunction) {
            case FitnessFunction.CLUSTERING:
                return (
                    <>
                        <ClusteringPanel
                            settings={fitnessFunctionParameters?.clusteringParameters} /* ?? 0} */
                            handleChangeFitnessFunctionOption={handleChangeFitnessFunctionOption}
                        />
                        <Form.Group style={{ display: isExpertOn ? 'inherit' : 'none' }}>
                            <Form.Checkbox
                                checked={fitnessFunctionParameters.clusteringParameters.lookForOptimalNClusters}
                                disabled // TODO: remove this when backend is implemented
                                onChange={(_e, { checked }) => { handleChangeFitnessFunctionOption('clusteringParameters', 'lookForOptimalNClusters', checked ?? false) }}
                                label='Search for the optimal number of clusters (soon)'
                            />

                            {!fitnessFunctionParameters.clusteringParameters.lookForOptimalNClusters &&
                                <Form.Input
                                    type='number'
                                    label='Number of clusters'
                                    name='nClusters'
                                    min={2}
                                    max={10}
                                    value={fitnessFunctionParameters.clusteringParameters.nClusters}
                                    onChange={(_, { name, value }) => {
                                        const numVal = Number(value)
                                        if (numVal < 2) {
                                            handleChangeFitnessFunctionOption('clusteringParameters', name, 2)
                                        } else if (numVal > 10) {
                                            handleChangeFitnessFunctionOption('clusteringParameters', name, 10)
                                        } else {
                                            handleChangeFitnessFunctionOption('clusteringParameters', name, numVal)
                                        }
                                    }}
                                />
                            }
                            <Form.Input
                                fluid
                                label='Random state'
                                placeholder='An integer number'
                                type='number'
                                step={1}
                                min={0}
                                name='randomState'
                                value={fitnessFunctionParameters.clusteringParameters.randomState ?? ''}
                                onChange={(_, { name, value }) => {
                                    const numVal = value !== '' ? Number(value) : null
                                    if (numVal !== null && numVal < 0) {
                                        handleChangeFitnessFunctionOption('clusteringParameters', name, 0)
                                    } else {
                                        handleChangeFitnessFunctionOption('clusteringParameters', name, numVal)
                                    }
                                }} />
                        </Form.Group>
                    </>
                )
            case FitnessFunction.SVM:
                return (
                    <>
                        <SVMPanel
                            parameters={fitnessFunctionParameters.svmParameters}
                            handleChangeFitnessFunctionOption={handleChangeFitnessFunctionOption}
                        />
                        <Form.Group widths='equal' style={{ display: isExpertOn ? 'inherit' : 'none' }}>
                            <Form.Input
                                fluid
                                label='Max iterations'
                                placeholder='100-2000'
                                name='maxIterations'
                                value={fitnessFunctionParameters.svmParameters.maxIterations}
                                onChange={(_, { name, value }) => handleChangeFitnessFunctionOption('svmParameters', name, value)}
                            />

                            <Form.Input
                                fluid
                                label='Random state'
                                placeholder='An integer number'
                                type='number'
                                step={1}
                                min={0}
                                name='randomState'
                                value={fitnessFunctionParameters.svmParameters.randomState ?? ''}
                                onChange={(_, { name, value }) => {
                                    const numVal = value !== '' ? Number(value) : null
                                    if (numVal !== null && numVal < 0) {
                                        handleChangeFitnessFunctionOption('svmParameters', name, 0)
                                    } else {
                                        handleChangeFitnessFunctionOption('svmParameters', name, numVal)
                                    }
                                }} />
                        </Form.Group>
                    </>
                )
            case FitnessFunction.RF:
                return (
                    <>
                        <RFPanel
                            parameters={fitnessFunctionParameters.rfParameters}
                            handleChangeFitnessFunctionOption={handleChangeFitnessFunctionOption}
                        />
                        <Form.Group widths='equal' style={{ display: isExpertOn ? 'inherit' : 'none' }}>
                            <Form.Input
                                fluid
                                label='Random state'
                                placeholder='An integer number'
                                type='number'
                                step={1}
                                min={0}
                                name='randomState'
                                value={fitnessFunctionParameters.rfParameters.randomState ?? ''}
                                onChange={(_, { name, value }) => {
                                    const numVal = value !== '' ? Number(value) : null
                                    if (numVal !== null && numVal < 0) {
                                        handleChangeFitnessFunctionOption('rfParameters', name, 0)
                                    } else {
                                        handleChangeFitnessFunctionOption('rfParameters', name, numVal)
                                    }
                                }} />
                        </Form.Group>
                    </>
                )
        }
    }
    return (
        <>
            <Form.Select
                label='Fitness function'
                selectOnBlur={false}
                placeholder='Fitness function'
                className='selection-select-m selection-select'
                options={fitnessFunctionsOptions}
                value={fitnessFunction ?? undefined}
                onChange={(_, { value }) => handleChangeFitnessFunction(value as FitnessFunction)}
            />

            {getFitnessFunctionParametersPanel()}
        </>
    )
}
