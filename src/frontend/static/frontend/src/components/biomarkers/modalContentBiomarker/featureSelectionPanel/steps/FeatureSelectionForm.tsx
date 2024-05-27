import React from 'react'
import { Form } from 'semantic-ui-react'
import { FitnessFunctionParameters, FitnessFunction, CrossValidationParameters } from '../../../types'
import { ClusteringPanel } from './algorithms/ClusteringPanel'
import { SVMPanel } from './algorithms/SVMPanel'
import { fitnessFunctionsOptions } from '../../../utils'
import { RFPanel } from './algorithms/RFPanel'
import { RandomStateInput } from '../RandomStateInput'
import { CrossValidationInput } from '../CrossValidationInput'

/** FeatureSelectionForm props. */
interface FeatureSelectionFormProps {
    fitnessFunction: FitnessFunction,
    fitnessFunctionParameters: FitnessFunctionParameters,
    crossValidationParameters: CrossValidationParameters,
    handleChangeFitnessFunction: (fitnessFunction: FitnessFunction) => void,
    handleChangeFitnessFunctionOption: <T extends keyof FitnessFunctionParameters, M extends keyof FitnessFunctionParameters[T]>(fitnessFunction: T, key: M, value: FitnessFunctionParameters[T][M]) => void,
    handleChangeCrossValidation: <T extends keyof CrossValidationParameters>(key: T, value: any) => void,
    isExpertOn: boolean,
}

/**
 * Renders a form to set all the Feature Selection parameters.
 * @param props Component props.
 * @returns Component.
 */
export const FeatureSelectionForm = (props: FeatureSelectionFormProps) => {
    const {
        fitnessFunction,
        fitnessFunctionParameters,
        crossValidationParameters,
        handleChangeFitnessFunction,
        handleChangeFitnessFunctionOption,
        handleChangeCrossValidation,
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

                            {/* General fields */}
                            <RandomStateInput
                                value={fitnessFunctionParameters.clusteringParameters.randomState}
                                parameterKey='clusteringParameters'
                                handleChange={handleChangeFitnessFunctionOption}
                            />
                            <CrossValidationInput value={crossValidationParameters.folds} handleChange={handleChangeCrossValidation} />
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

                            {/* General fields */}
                            <RandomStateInput
                                value={fitnessFunctionParameters.svmParameters.randomState}
                                parameterKey='svmParameters'
                                handleChange={handleChangeFitnessFunctionOption}
                            />
                            <CrossValidationInput value={crossValidationParameters.folds} handleChange={handleChangeCrossValidation} />
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

                        {/* General fields */}
                        <Form.Group widths='equal' style={{ display: isExpertOn ? 'inherit' : 'none' }}>
                            <RandomStateInput
                                value={fitnessFunctionParameters.rfParameters.randomState}
                                parameterKey='rfParameters'
                                handleChange={handleChangeFitnessFunctionOption}
                            />
                            <CrossValidationInput value={crossValidationParameters.folds} handleChange={handleChangeCrossValidation} />
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
