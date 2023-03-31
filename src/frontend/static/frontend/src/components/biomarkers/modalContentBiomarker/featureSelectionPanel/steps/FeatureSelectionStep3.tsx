import React from 'react'
import { Button, Select } from 'semantic-ui-react'
import { FeatureSelectionAlgorithms, FeatureSelectionPanelData, FitnessFunctions } from '../../../types'
import { BlindSearchPanel } from './blindSearch/BlindSearchPanel'

/** FeatureSelectionStep3 props. */
interface FeatureSelectionStep3Props {
    featureSelection: FeatureSelectionPanelData,
    handleChangeAlgorithm: (algorithm: FeatureSelectionAlgorithms) => void,
    handleChangeFitnessFunction: (fitnessFunction: FitnessFunctions) => void,
    handleChangeClusterOption: (key: string, value: number) => void,
    handleChangeSvmOption: (key: string, value: number) => void,
    handleGoBackStep2: () => void,
}

export const FeatureSelectionStep3 = (props: FeatureSelectionStep3Props) => {
    const {
        featureSelection,
        handleChangeAlgorithm,
        handleChangeFitnessFunction,
        handleChangeClusterOption,
        handleChangeSvmOption,
        handleGoBackStep2
    } = props
    const algorithmSelection = () => {
        switch (featureSelection.algorithm) {
            case FeatureSelectionAlgorithms.BLIND_SEARCH:
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
                    { key: FeatureSelectionAlgorithms.BLIND_SEARCH, text: 'Blind Search', value: FeatureSelectionAlgorithms.BLIND_SEARCH, disabled: false },
                    { key: FeatureSelectionAlgorithms.COX_REGRESSION, text: 'Cox Regression', value: FeatureSelectionAlgorithms.COX_REGRESSION, disabled: false },
                    { key: FeatureSelectionAlgorithms.BBHA, text: 'BBHA', value: FeatureSelectionAlgorithms.BBHA, disabled: false },
                    { key: FeatureSelectionAlgorithms.PSO, text: 'PSO', value: FeatureSelectionAlgorithms.PSO, disabled: false }
                ]}
                value={featureSelection.algorithm}
                onChange={(_, { value }) => handleChangeAlgorithm(value as FeatureSelectionAlgorithms)}
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
                onClick={() => console.log('se completo todo!', featureSelection)}
                // disabled={props.featureSelection.clinicalSource === null}
            >
                Confirm
            </Button>
        </div>
    )
}
