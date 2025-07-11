import React from 'react'
import { Grid, Segment } from 'semantic-ui-react'
import { FitnessFunction, InferenceExperimentForTable } from '../../types'
import { SamplesAndGroupsInferenceTable } from './SamplesAndGroupsInferenceTable'
import { InferenceExperimentResultMetrics } from './InferenceExperimentResultMetrics'
import { SamplesAndTimeInferenceTable } from './SamplesAndTimeInferenceTable'

/** BiomarkerNewInferenceExperimentModal props. */
interface InferenceExperimentResultModalProps {
    /** Selected InferenceExperimentForTable instance to retrieve all its data. */
    selectedInferenceExperiment: InferenceExperimentForTable,
    /** Function to refresh the experiment info after addition or unlinking of clinical data. */
    refreshExperimentInfo: () => void,
}

/**
 * Renders a panel to show all the InferenceExperiment data.
 * @param props Component's props
 * @returns Component
 */
export const InferenceExperimentResultModal = (props: InferenceExperimentResultModalProps) => {
    return (
        <>
            <Grid>
                <Grid.Row columns={2} stretched>
                    <Grid.Column width={4}>
                        <Segment>
                            <InferenceExperimentResultMetrics selectedInferenceExperiment={props.selectedInferenceExperiment} />
                        </Segment>
                    </Grid.Column>
                    <Grid.Column width={12}>
                        {/* Show the corresponding table */}
                        {props.selectedInferenceExperiment.model === FitnessFunction.CLUSTERING
                            ? <SamplesAndGroupsInferenceTable selectedInferenceExperiment={props.selectedInferenceExperiment} />
                            : (
                                <SamplesAndTimeInferenceTable
                                    selectedInferenceExperiment={props.selectedInferenceExperiment}
                                    refreshExperimentInfo={props.refreshExperimentInfo}
                                />
                            )}
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </>
    )
}
