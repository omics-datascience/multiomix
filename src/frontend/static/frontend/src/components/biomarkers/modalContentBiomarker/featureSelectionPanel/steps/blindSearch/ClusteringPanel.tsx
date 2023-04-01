import React from 'react'
import { Button, Container, Select } from 'semantic-ui-react'
import { ClusteringMetric, ClusteringAlgorithm, FitnessFunctionClustering } from '../../../../types'

/** Clustering props. */
interface ClusteringProps {
    settings: FitnessFunctionClustering,
    handleChangeClusterOption: (key: string, value: number) => void,
}

/**
 * Renders a panel with all the settings for the Clustering fitness function.
 * @param props Component props.
 * @returns Component.
 */
export const ClusteringPanel = (props: ClusteringProps) => {
    const { settings, handleChangeClusterOption } = props

    return (
        <>
            <Select
                placeholder='Clustering Algorithm'
                name='moleculeSelected'
                options={[
                    { key: ClusteringAlgorithm.K_MEANS, text: 'K-Means', value: ClusteringAlgorithm.K_MEANS, disabled: false }
                ]}
                value={settings.parameters}
                onChange={(_, { value }) => handleChangeClusterOption('parameters', value as number)}
            />

            <Container className='biomarkers--side--bar--box'>
                <Button.Group
                    compact
                    name="moleculesTypeOfSelection"
                    className='biomarkers--side--bar--buttons-group'>
                    <Button
                        onClick={() => handleChangeClusterOption('selection', ClusteringMetric.COX_REGRESSION)}
                        active={settings.selection === ClusteringMetric.COX_REGRESSION}
                    >
                        Cox Regression
                    </Button>

                    <Button
                        onClick={() => handleChangeClusterOption('selection', ClusteringMetric.LOG_RANK_TEST)}
                        active={settings.selection === ClusteringMetric.LOG_RANK_TEST}
                    >
                        Log-Rank test
                    </Button>
                </Button.Group>
            </Container>
        </>
    )
}
