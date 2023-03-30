import React from 'react'
import { Button, Select } from 'semantic-ui-react'
import { FeatureSelectionAlgorithms, FeatureSelectionPanelData, FitnessFunctions } from '../../../types'
import { BlindSearch } from './blindSearch/BlindSearch'

interface Props {
    featureSelection: FeatureSelectionPanelData,
    handleChangeAlgorithm: (algorithm: FeatureSelectionAlgorithms) => void,
    handleChangeFitnessFunction: (fitnessFunction: FitnessFunctions) => void,
    handleChangeClusterOption: (value: number, key: string) => void,
    handleChangeSvmOption: (value: number, key: string) => void,
    handleGoBackStep2: () => void,
}
const options = [
    { key: FeatureSelectionAlgorithms.BLIND_SEARCH, text: 'Blind Search', value: FeatureSelectionAlgorithms.BLIND_SEARCH, disabled: false },
    { key: FeatureSelectionAlgorithms.COX_REGRESSION, text: 'Cox Regression', value: FeatureSelectionAlgorithms.COX_REGRESSION, disabled: false },
    { key: FeatureSelectionAlgorithms.BBHA, text: 'BBHA', value: FeatureSelectionAlgorithms.BBHA, disabled: false },
    { key: FeatureSelectionAlgorithms.PSO, text: 'PSO', value: FeatureSelectionAlgorithms.PSO, disabled: false }
]
export const FeatureSelectionStep3 = (props: Props) => {
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

                return (<BlindSearch
                    blindSearch={featureSelection[FeatureSelectionAlgorithms.BLIND_SEARCH]}
                    handleChangeFitnessFunction={handleChangeFitnessFunction}
                    handleChangeClusterOption={handleChangeClusterOption}
                    handleChangeSvmOption={handleChangeSvmOption}
                />)

            default:
                break
        }
    }
    return (
        <div>
            <Select
                className=''
                placeholder='Algorithm'
                name='moleculeSelected'
                options={options}
                value={featureSelection.algorithm}
                onChange={(_, { value }) => handleChangeAlgorithm(value as FeatureSelectionAlgorithms)}
            />
            {
                algorithmSelection()
            }
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
