import React from 'react'
import { Button, Container, Select } from 'semantic-ui-react'
import { ClusteringMetric, ClusteringParameters, ClusteringScoringMethod } from '../../../../types'
import { clusteringAlgorithmOptions } from '../../../../utils'

/** Clustering props. */
interface ClusteringProps {
    settings: ClusteringParameters,
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
                className='selection-select'
                selectOnBlur={false}
                placeholder='Clustering Algorithm'
                name='moleculeSelected'
                options={clusteringAlgorithmOptions}
                value={settings.algorithm}
                onChange={(_, { value }) => handleChangeClusterOption('algorithm', value as number)}
            />

            <Container className='biomarkers--side--bar--box'>
                <Button.Group
                    compact
                    className='biomarkers--side--bar--buttons-group'>
                    <Button
                        onClick={() => handleChangeClusterOption('metric', ClusteringMetric.COX_REGRESSION)}
                        active={settings.metric === ClusteringMetric.COX_REGRESSION}
                    >
                        Cox Regression
                    </Button>

                    <Button
                        onClick={() => handleChangeClusterOption('metric', ClusteringMetric.LOG_RANK_TEST)}
                        active={settings.metric === ClusteringMetric.LOG_RANK_TEST}
                        disabled // TODO: implement in backend
                    >
                        Log-Rank test
                    </Button>
                </Button.Group>
            </Container>

            <Container className='biomarkers--side--bar--box'>
                <Button.Group
                    compact
                    className='biomarkers--side--bar--buttons-group'>
                    <Button
                        onClick={() => handleChangeClusterOption('scoringMethod', ClusteringScoringMethod.C_INDEX)}
                        active={settings.scoringMethod === ClusteringScoringMethod.C_INDEX}
                    >
                        C-Index
                    </Button>

                    <Button
                        onClick={() => handleChangeClusterOption('scoringMethod', ClusteringScoringMethod.LOG_LIKELIHOOD)}
                        active={settings.scoringMethod === ClusteringScoringMethod.LOG_LIKELIHOOD}
                    >
                        Log Likelihood
                    </Button>
                </Button.Group>
            </Container>
        </>
    )
}
