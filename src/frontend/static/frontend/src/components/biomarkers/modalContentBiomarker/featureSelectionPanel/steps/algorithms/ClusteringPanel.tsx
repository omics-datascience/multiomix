import React from 'react'
import { Button, Form, Label, Segment } from 'semantic-ui-react'
import { ClusteringMetric, ClusteringParameters, ClusteringScoringMethod, FitnessFunctionParameters } from '../../../../types'
import { clusteringAlgorithmOptions } from '../../../../utils'
import './../../featureSelection.css'

/** ClusteringPanel props. */
interface ClusteringPanelProps {
    settings: ClusteringParameters,
    handleChangeFitnessFunctionOption: <T extends keyof FitnessFunctionParameters, M extends keyof FitnessFunctionParameters[T]>(fitnessFunction: T, key: M, value: FitnessFunctionParameters[T][M]) => void,
}

/**
 * Renders a panel with all the settings for the Clustering fitness function.
 * @param props Component props.
 * @returns Component.
 */
export const ClusteringPanel = (props: ClusteringPanelProps) => {
    const { settings, handleChangeFitnessFunctionOption } = props

    return (
        <>
            <Form.Select
                label='Algorithm'
                selectOnBlur={false}
                placeholder='Clustering Algorithm'
                name='moleculeSelected'
                options={clusteringAlgorithmOptions}
                value={settings.algorithm}
                onChange={(_, { value }) => handleChangeFitnessFunctionOption('clusteringParameters', 'algorithm', value as number)}
            />

            <Form.Group className='form-group-button'>
                <Segment className='form-gruop-button-segment'>
                    <Label attached='top'>
                        Metric
                    </Label>
                    <Button.Group
                        compact
                    >
                        <Button
                            onClick={() => handleChangeFitnessFunctionOption('clusteringParameters', 'metric', ClusteringMetric.COX_REGRESSION)}
                            active={settings.metric === ClusteringMetric.COX_REGRESSION}
                        >
                            Cox Regression
                        </Button>

                        <Button
                            onClick={() => handleChangeFitnessFunctionOption('clusteringParameters', 'metric', ClusteringMetric.LOG_RANK_TEST)}
                            active={settings.metric === ClusteringMetric.LOG_RANK_TEST}
                            disabled // TODO: implement in backend
                        >
                            Log-Rank test
                        </Button>
                    </Button.Group>
                </Segment>

                <Segment className='form-gruop-button-segment'>
                    <Label attached='top'>
                        Scoring method
                    </Label>
                    <Button.Group
                        compact
                    >
                        <Button
                            onClick={() => handleChangeFitnessFunctionOption('clusteringParameters', 'scoringMethod', ClusteringScoringMethod.C_INDEX)}
                            active={settings.scoringMethod === ClusteringScoringMethod.C_INDEX}
                        >
                            C-Index
                        </Button>

                        <Button
                            onClick={() => handleChangeFitnessFunctionOption('clusteringParameters', 'scoringMethod', ClusteringScoringMethod.LOG_LIKELIHOOD)}
                            active={settings.scoringMethod === ClusteringScoringMethod.LOG_LIKELIHOOD}
                        >
                            Log Likelihood
                        </Button>
                    </Button.Group>
                </Segment>
            </Form.Group>
        </>
    )
}
