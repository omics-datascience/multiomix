
import React from 'react'
import { Grid, Segment } from 'semantic-ui-react'
import { InferenceExperimentForTable } from '../../types'
import { SamplesAndGroupsInferenceTable } from './SamplesAndGroupsInferenceTable'
import { InferenceExperimentResultMetrics } from './InferenceExperimentResultMetrics'

/** BiomarkerNewInferenceExperimentModal props. */
interface InferenceExperimentResultModalProps {
    /** Selected InferenceExperimentForTable instance to retrieve all its data. */
    selectedInferenceExperiment: InferenceExperimentForTable,
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
                        <SamplesAndGroupsInferenceTable selectedInferenceExperiment={props.selectedInferenceExperiment} />
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </>
    )
}
