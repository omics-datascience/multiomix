import React from 'react'
import { Button, Form, Label, Segment } from 'semantic-ui-react'
import { ClusteringMetric, ClusteringParameters, ClusteringScoringMethod } from '../../../../types'
import { clusteringAlgorithmOptions } from '../../../../utils'
import { useIntl } from 'react-intl'

/** ClusteringPanel props. */
interface ClusteringPanelProps {
    settings: ClusteringParameters,
    handleChangeFitnessFunctionOption: (fitnessFunction: string, key: string, value: any) => void,
}

/**
 * Renders a panel with all the settings for the Clustering fitness function.
 * @param props Component props.
 * @returns Component.
 */
export const ClusteringPanel = (props: ClusteringPanelProps) => {
    const intl = useIntl()
    const { settings, handleChangeFitnessFunctionOption } = props

    return (
        <>
            <Form.Select
                label={intl.formatMessage({ id: 'common.algorithm' })}
                selectOnBlur={false}
                placeholder={intl.formatMessage({ id: 'clustering.algorithm.placeholder' })}
                name='moleculeSelected'
                options={clusteringAlgorithmOptions}
                value={settings.algorithm}
                onChange={(_, { value }) => handleChangeFitnessFunctionOption('clusteringParameters', 'algorithm', value as number)}
            />

            <Form.Group className='form-group-button'>
                <Segment className='form-gruop-button-segment'>
                    <Label attached='top'>
                        {intl.formatMessage({ id: 'common.metric' })}

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
                        {intl.formatMessage({ id: 'common.scoringMethod' })}
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
