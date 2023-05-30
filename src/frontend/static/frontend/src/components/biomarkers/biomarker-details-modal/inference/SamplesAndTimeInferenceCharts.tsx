import React, { useEffect } from 'react'
import { InferenceExperimentForTable } from '../../types'
import { NoClinicalData } from '../../../pipeline/experiment-result/gene-gem-details/survival-analysis/NoClinicalData'
import { Header, Icon } from 'semantic-ui-react'

declare const urlClinicalSourceAddOrEditInferenceExperiment: string
declare const urlUnlinkClinicalSourceInferenceExperiment: string

/** SamplesAndTimeInferenceCharts props. */
interface SamplesAndTimeInferenceChartsProps {
    /** Selected InferenceExperimentForTable instance to retrieve all its data. */
    inferenceExperiment: InferenceExperimentForTable,
    /** Selected clinical attribute to group by. */
    selectedClinicalAttribute: string | undefined,
    /** Function to refresh the experiment info after addition or unlinking of clinical data. */
    refreshExperimentInfo: () => void,
}

/**
 * Renders the charts with the samples and the predicted hazard/survival time grouped by some condition.
 * @param props Component props.
 * @returns Component.
 */
export const SamplesAndTimeInferenceCharts = (props: SamplesAndTimeInferenceChartsProps) => {
    /** Fetches the data for the chart(s) every time the clinical attribute changes. */
    useEffect(() => {
        if (props.selectedClinicalAttribute) {
            // TODO: add here the request to get the data for the chart(s)
        }
    }, [props.selectedClinicalAttribute])

    if (!props.inferenceExperiment.clinical_source_id) {
        return (
            <NoClinicalData
                experiment={props.inferenceExperiment}
                experimentType='inference'
                urlClinicalSourceAddOrEdit={urlClinicalSourceAddOrEditInferenceExperiment}
                urlUnlinkClinicalSource={urlUnlinkClinicalSourceInferenceExperiment}
                refreshExperimentInfo={props.refreshExperimentInfo}
            />
        )
    }

    if (!props.selectedClinicalAttribute) {
        return (
            <Header size='huge' icon textAlign='center'>
                <Icon name='object group outline' />

                No clinical attribute selected

                <Header.Subheader>
                    Please, select one in the right Select.
                </Header.Subheader>
            </Header>
        )
    }

    // return <KaplanMeierChart
    //     selectedRow={this.props.selectedRow}
    //     experimentId={this.props.experiment.id}
    // />

    return null
}
