import React, { useMemo } from 'react'
import { Form, Grid, Segment } from 'semantic-ui-react'
import { CrossValidationParameters, FeatureSelectionAlgorithm, FeatureSelectionPanelData, FitnessFunction, FitnessFunctionParameters } from '../../../types'
import { FeatureSelectionForm } from './FeatureSelectionForm'
import './../featureSelection.css'
import { BBHAAdvanced } from './advancedMode/BBHAAdvanced'
import { CoxRegressionAdvanced } from './advancedMode/CoxRegressionAdvanced'
import { getNumberOfMoleculesOfBiomarker } from '../../../utils'
import { GAAdvanced } from './advancedMode/GAAdvanced'

declare const maxFeaturesBlindSearch: number
declare const minFeaturesMetaheuristics: number

/** FeatureSelectionStep3 props. */
interface FeatureSelectionStep3Props {
    featureSelection: FeatureSelectionPanelData,
    handleChangeAlgorithm: (algorithm: FeatureSelectionAlgorithm) => void,
    handleChangeFitnessFunction: (fitnessFunction: FitnessFunction) => void,
    handleChangeFitnessFunctionOption: <T extends keyof FitnessFunctionParameters, M extends keyof FitnessFunctionParameters[T]>(fitnessFunction: T, key: M, value: FitnessFunctionParameters[T][M]) => void,
    handleChangeCrossValidation: <T extends keyof CrossValidationParameters>(key: T, value: any) => void,
    handleChangeAdvanceAlgorithm: (advancedAlgorithmParameters: string, name: string, value: any) => void,
    handleSwitchAdvanceAlgorithm: () => void,
}

export const FeatureSelectionStep3 = (props: FeatureSelectionStep3Props) => {
    const {
        featureSelection,
        handleChangeAlgorithm,
        handleChangeFitnessFunction,
        handleChangeFitnessFunctionOption,
        handleChangeCrossValidation,
        handleChangeAdvanceAlgorithm,
        handleSwitchAdvanceAlgorithm
    } = props

    const numberOfMolecules = useMemo(
        () => getNumberOfMoleculesOfBiomarker(props.featureSelection.selectedBiomarker),
        [props.featureSelection.selectedBiomarker?.id]
    )

    const validateIfNeedExpand = (): boolean => {
        return ![
            FeatureSelectionAlgorithm.BLIND_SEARCH
        ].includes(featureSelection.algorithm)
    }

    const blindSearchIsDisabled = numberOfMolecules > maxFeaturesBlindSearch
    const metaheuristicsAreDisabled = numberOfMolecules < minFeaturesMetaheuristics

    const algorithmSelection = () => {
        switch (featureSelection.algorithm) {
            case FeatureSelectionAlgorithm.BLIND_SEARCH:
                return (
                    <FeatureSelectionForm
                        fitnessFunction={featureSelection.fitnessFunction}
                        fitnessFunctionParameters={featureSelection.fitnessFunctionParameters}
                        crossValidationParameters={featureSelection.crossValidationParameters}
                        handleChangeFitnessFunction={handleChangeFitnessFunction}
                        handleChangeFitnessFunctionOption={handleChangeFitnessFunctionOption}
                        handleChangeCrossValidation={handleChangeCrossValidation}
                        isExpertOn={featureSelection.advancedAlgorithmParameters.isActive}
                    />
                )
            case FeatureSelectionAlgorithm.BBHA:
            case FeatureSelectionAlgorithm.GA:
                return (
                    <FeatureSelectionForm
                        fitnessFunction={featureSelection.fitnessFunction}
                        fitnessFunctionParameters={featureSelection.fitnessFunctionParameters}
                        crossValidationParameters={featureSelection.crossValidationParameters}
                        handleChangeFitnessFunction={handleChangeFitnessFunction}
                        handleChangeFitnessFunctionOption={handleChangeFitnessFunctionOption}
                        handleChangeCrossValidation={handleChangeCrossValidation}
                        isExpertOn={featureSelection.advancedAlgorithmParameters.isActive}
                    />
                )
            case FeatureSelectionAlgorithm.COX_REGRESSION:
                return (
                    null
                )
            case FeatureSelectionAlgorithm.PSO:
                return (
                    <FeatureSelectionForm
                        fitnessFunction={featureSelection.fitnessFunction}
                        fitnessFunctionParameters={featureSelection.fitnessFunctionParameters}
                        crossValidationParameters={featureSelection.crossValidationParameters}
                        handleChangeFitnessFunction={handleChangeFitnessFunction}
                        handleChangeFitnessFunctionOption={handleChangeFitnessFunctionOption}
                        handleChangeCrossValidation={handleChangeCrossValidation}
                        isExpertOn={featureSelection.advancedAlgorithmParameters.isActive}
                    />
                )
            default:
                return null
        }
    }

    const advanceMode = () => {
        switch (featureSelection.algorithm) {
            case FeatureSelectionAlgorithm.BLIND_SEARCH:
                return (
                    <></>
                )
            case FeatureSelectionAlgorithm.BBHA:
                return (
                    <BBHAAdvanced
                        advancedData={featureSelection.advancedAlgorithmParameters.BBHA}
                        handleChangeAdvanceAlgorithm={handleChangeAdvanceAlgorithm}
                    />
                )
            case FeatureSelectionAlgorithm.GA:
                return (
                    <GAAdvanced
                        advancedData={featureSelection.advancedAlgorithmParameters.GA}
                        handleChangeAdvanceAlgorithm={handleChangeAdvanceAlgorithm}
                    />
                )
            case FeatureSelectionAlgorithm.COX_REGRESSION:
                return (
                    <CoxRegressionAdvanced
                        advanceData={featureSelection.advancedAlgorithmParameters.coxRegression}
                        handleChangeAdvanceAlgorithm={handleChangeAdvanceAlgorithm}

                    />
                )
            case FeatureSelectionAlgorithm.PSO:
                return (
                    <></>
                )
            default:
                return null
        }
    }

    return (
        <Form className='selection-step-container selection-step-algorithm'>
            <div className='selection-step-container-selection-confg'>
                <Form.Select
                    label='Algorithm'
                    selectOnBlur={false}
                    className='selection-select selection-all-space'
                    placeholder='Algorithm'
                    name='moleculeSelected'
                    options={[
                        {
                            key: FeatureSelectionAlgorithm.BLIND_SEARCH,
                            text: 'Blind Search',
                            value: FeatureSelectionAlgorithm.BLIND_SEARCH,
                            disabled: blindSearchIsDisabled
                        },
                        {
                            key: FeatureSelectionAlgorithm.GA,
                            text: 'Genetic Algorithms',
                            value: FeatureSelectionAlgorithm.GA,
                            disabled: metaheuristicsAreDisabled
                        },
                        {
                            key: FeatureSelectionAlgorithm.BBHA,
                            text: 'BBHA',
                            value: FeatureSelectionAlgorithm.BBHA,
                            disabled: metaheuristicsAreDisabled
                        },
                        {
                            key: FeatureSelectionAlgorithm.COX_REGRESSION,
                            text: 'Cox Regression',
                            value: FeatureSelectionAlgorithm.COX_REGRESSION
                        },
                        {
                            key: FeatureSelectionAlgorithm.PSO,
                            text: 'PSO',
                            value: FeatureSelectionAlgorithm.PSO,
                            disabled: metaheuristicsAreDisabled
                        }
                    ]}
                    value={featureSelection.algorithm}
                    onChange={(_, { value }) => handleChangeAlgorithm(value as FeatureSelectionAlgorithm)}
                />
                <Form.Button
                    toggle
                    active={featureSelection.advancedAlgorithmParameters.isActive}
                    onClick={() => handleSwitchAdvanceAlgorithm()}
                    className='selection-step-button-advance-mode'
                >
                    Expert mode
                </Form.Button>
            </div>
            <Segment>
                <Grid>
                    <Grid.Row columns={2} divided>
                        <Grid.Column width={featureSelection.advancedAlgorithmParameters.isActive && validateIfNeedExpand() ? 10 : 16}>
                            {algorithmSelection()}
                        </Grid.Column>
                        <Grid.Column width={featureSelection.advancedAlgorithmParameters.isActive ? 6 : undefined}>
                            {featureSelection.advancedAlgorithmParameters.isActive ? advanceMode() : <></>}
                        </Grid.Column>
                    </Grid.Row>
                </Grid>
            </Segment>
        </Form>
    )
}
