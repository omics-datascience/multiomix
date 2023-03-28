import React from 'react'
import { Select } from 'semantic-ui-react'
import { FeatureSelectionAlgorithms, FeatureSelectionPanelData } from '../../../types'
import { BlindSearch } from './blindSearch/BlindSearch'

interface Props {
    featureSelection: FeatureSelectionPanelData,
}
const options = [
    { key: FeatureSelectionAlgorithms.BLIND_SEARCH, text: FeatureSelectionAlgorithms.BLIND_SEARCH, value: FeatureSelectionAlgorithms.BLIND_SEARCH, disabled: false },
    { key: FeatureSelectionAlgorithms.COX_REGRESSION, text: FeatureSelectionAlgorithms.COX_REGRESSION, value: FeatureSelectionAlgorithms.COX_REGRESSION, disabled: true },
    { key: FeatureSelectionAlgorithms.BBHA, text: FeatureSelectionAlgorithms.BBHA, value: FeatureSelectionAlgorithms.BBHA, disabled: true },
    { key: FeatureSelectionAlgorithms.PSO, text: FeatureSelectionAlgorithms.PSO, value: FeatureSelectionAlgorithms.PSO, disabled: true }
]
export const FeatureSelectionStep3 = (props: Props) => {
    const { featureSelection } = props
    const algorithmSelection = () => {
        switch (featureSelection.algorithm) {
            case FeatureSelectionAlgorithms.BLIND_SEARCH:

                return (<BlindSearch
                    blindSearch={featureSelection[FeatureSelectionAlgorithms.BLIND_SEARCH]}
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
                onChange={(_, { value }) => console.log(value)}
            />
            {
                algorithmSelection()
            }
        </div>
    )
}
