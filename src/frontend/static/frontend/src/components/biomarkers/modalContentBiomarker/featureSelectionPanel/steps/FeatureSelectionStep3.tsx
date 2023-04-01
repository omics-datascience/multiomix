import React from 'react'
import { Button, Select } from 'semantic-ui-react'
import { FeatureSelectionAlgorithm, FeatureSelectionPanelData, FitnessFunction } from '../../../types'
import { BlindSearchPanel } from './blindSearch/BlindSearchPanel'

/** FeatureSelectionStep3 props. */
interface FeatureSelectionStep3Props {
    featureSelection: FeatureSelectionPanelData,
    handleChangeAlgorithm: (algorithm: FeatureSelectionAlgorithm) => void,
    handleChangeFitnessFunction: (fitnessFunction: FitnessFunction) => void,
    handleChangeClusterOption: (key: string, value: number) => void,
    handleChangeSvmOption: (key: string, value: number) => void,
    handleGoBackStep2: () => void,
    submitFeatureSelectionExperiment: () => void,
}

export const FeatureSelectionStep3 = (props: FeatureSelectionStep3Props) => {
    const {
        submitFeatureSelectionExperiment,
        featureSelection,
        handleChangeAlgorithm,
        handleChangeFitnessFunction,
        handleChangeClusterOption,
        handleChangeSvmOption,
        handleGoBackStep2
    } = props
    const algorithmSelection = () => {
        switch (featureSelection.algorithm) {
            case FeatureSelectionAlgorithm.BLIND_SEARCH:
                return (
                    <BlindSearchPanel
                        fitnessFunction={featureSelection.fitnessFunction}
                        fitnessFunctionParameters={featureSelection.fitnessFunctionParameters}
                        handleChangeFitnessFunction={handleChangeFitnessFunction}
                        handleChangeClusterOption={handleChangeClusterOption}
                        handleChangeSvmOption={handleChangeSvmOption}
                    />
                )
            default:
                return null
        }
    }

    return (
        <div>
            <Select
                placeholder='Algorithm'
                name='moleculeSelected'
                options={[
                    { key: FeatureSelectionAlgorithm.BLIND_SEARCH, text: 'Blind Search', value: FeatureSelectionAlgorithm.BLIND_SEARCH, disabled: false },
                    { key: FeatureSelectionAlgorithm.COX_REGRESSION, text: 'Cox Regression', value: FeatureSelectionAlgorithm.COX_REGRESSION, disabled: false },
                    { key: FeatureSelectionAlgorithm.BBHA, text: 'BBHA', value: FeatureSelectionAlgorithm.BBHA, disabled: false },
                    { key: FeatureSelectionAlgorithm.PSO, text: 'PSO', value: FeatureSelectionAlgorithm.PSO, disabled: false }
                ]}
                value={featureSelection.algorithm}
                onChange={(_, { value }) => handleChangeAlgorithm(value as FeatureSelectionAlgorithm)}
            />
            {algorithmSelection()}
            <Button
                color="red"
                onClick={() => handleGoBackStep2()}
            >
                Atras
            </Button>

            <Button
                color="green"
                onClick={submitFeatureSelectionExperiment}
                // disabled={props.featureSelection.clinicalSource === null}
            >
                Confirm
            </Button>
        </div>
    )
}
