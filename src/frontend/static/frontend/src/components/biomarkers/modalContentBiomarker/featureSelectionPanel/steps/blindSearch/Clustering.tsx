import React from 'react'
import { Button, Container, Select } from 'semantic-ui-react'
import { Nullable } from '../../../../../../utils/interfaces'
import { ClusteringButtons, ClusteringParameters, FitnessFunctionClustering } from '../../../../types'
interface Props {
    clustering: Nullable<FitnessFunctionClustering>,
    handleChangeClusterOption: (value: number, key: string) => void,
}
const options = [
    { key: ClusteringParameters.K_MEANS, text: 'K-Means', value: ClusteringParameters.K_MEANS, disabled: false }
]
export const Clustering = (props: Props) => {
    const {
        clustering,
        handleChangeClusterOption
    } = props
    return (
        <>
            <Select
                className=''
                placeholder='Clustering Algorithm'
                name='moleculeSelected'
                options={options}
                value={clustering?.parameters}
                onChange={(_, { value }) => handleChangeClusterOption(value as number, 'parameters')}
            />

            <Container className='biomarkers--side--bar--box'>
                <Button.Group
                    compact
                    name="moleculesTypeOfSelection"
                    className='biomarkers--side--bar--buttons-group'>
                    <Button
                        onClick={() => handleChangeClusterOption(ClusteringButtons.COX_REGRESSION, 'selection')}
                        active={clustering?.selection === ClusteringButtons.COX_REGRESSION}
                    >
                        Cox Regression
                    </Button>

                    <Button
                        onClick={() => handleChangeClusterOption(ClusteringButtons.LOG_RANK_TEST, 'selection')}
                        active={clustering?.selection === ClusteringButtons.LOG_RANK_TEST}
                    >
                        Log-Rank test
                    </Button>
                </Button.Group>
            </Container>
        </>
    )
}
