import React from 'react'
import { Select } from 'semantic-ui-react'
import { FeatureSelectionAlgorithm, FeatureSelectionPanelData, FitnessFunction } from '../../../types'
import { BlindSearchPanel } from './BlindSearchPanel'
import './../featureSelection.css'

/** FeatureSelectionStep3 props. */
interface FeatureSelectionStep3Props {
    featureSelection: FeatureSelectionPanelData,
    handleChangeAlgorithm: (algorithm: FeatureSelectionAlgorithm) => void,
    handleChangeFitnessFunction: (fitnessFunction: FitnessFunction) => void,
    handleChangeClusterOption: (key: string, value: number) => void,
    handleChangeSVMOption: (key: string, value: number) => void,
    handleChangeRFOption: (key: string, value: number) => void,
}

export const FeatureSelectionStep3 = (props: FeatureSelectionStep3Props) => {
    const {
        featureSelection,
        handleChangeAlgorithm,
        handleChangeFitnessFunction,
        handleChangeClusterOption,
        handleChangeSVMOption,
        handleChangeRFOption
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
                        handleChangeSVMOption={handleChangeSVMOption}
                        handleChangeRFOption={handleChangeRFOption}
                    />
                )
            case FeatureSelectionAlgorithm.BBHA:
                return (
                    <BlindSearchPanel
                        fitnessFunction={featureSelection.fitnessFunction}
                        fitnessFunctionParameters={featureSelection.fitnessFunctionParameters}
                        handleChangeFitnessFunction={handleChangeFitnessFunction}
                        handleChangeClusterOption={handleChangeClusterOption}
                        handleChangeSVMOption={handleChangeSVMOption}
                        handleChangeRFOption={handleChangeRFOption}
                    />
                )
            case FeatureSelectionAlgorithm.PSO:
                return (
                    <BlindSearchPanel
                        fitnessFunction={featureSelection.fitnessFunction}
                        fitnessFunctionParameters={featureSelection.fitnessFunctionParameters}
                        handleChangeFitnessFunction={handleChangeFitnessFunction}
                        handleChangeClusterOption={handleChangeClusterOption}
                        handleChangeSVMOption={handleChangeSVMOption}
                        handleChangeRFOption={handleChangeRFOption}
                    />
                )
            default:
                return null
        }
    }

    return (
        <div className='selection-step-container selection-step-algorithm'>
            <Select
                selectOnBlur={false}
                className='selection-select'
                placeholder='Algorithm'
                name='moleculeSelected'
                options={[
                    { key: FeatureSelectionAlgorithm.BLIND_SEARCH, text: 'Blind Search', value: FeatureSelectionAlgorithm.BLIND_SEARCH },
                    { key: FeatureSelectionAlgorithm.BBHA, text: 'BBHA', value: FeatureSelectionAlgorithm.BBHA },
                    { key: FeatureSelectionAlgorithm.COX_REGRESSION, text: 'Cox Regression', value: FeatureSelectionAlgorithm.COX_REGRESSION },
                    { key: FeatureSelectionAlgorithm.PSO, text: 'PSO', value: FeatureSelectionAlgorithm.PSO, disabled: true }
                ]}
                value={featureSelection.algorithm}
                onChange={(_, { value }) => handleChangeAlgorithm(value as FeatureSelectionAlgorithm)}
            />
            {algorithmSelection()}
        </div>
    )
}
