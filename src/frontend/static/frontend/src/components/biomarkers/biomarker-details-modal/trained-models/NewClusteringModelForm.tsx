import React from 'react'
import { Form, InputOnChangeData } from 'semantic-ui-react'
import { clusteringAlgorithmOptions, clusteringMetricOptions, clusteringScoringMethodOptions } from '../../utils'
import { ClusteringMetric, ClusteringParameters } from '../../types'
import { InfoPopup } from '../../../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { InputLabel } from '../../../common/InputLabel'

interface NewClusteringModelFormProps {
    /** Getter of the selected params to handle in the form. */
    parameters: ClusteringParameters,
    /** Setter of the selected params to handle in the form. */
    handleChangeParams: (event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => void,
    /** Setter of the lookForOptimalNClusters value. */
    handleChangeOptimalNClusters: (checked: boolean) => void
}

export const NewClusteringModelForm = (props: NewClusteringModelFormProps) => {
    return (
        <>
            <Form.Select
                fluid
                selectOnBlur={false}
                label={
                    <InputLabel label='Algorithm'>
                        <InfoPopup
                            content={
                                <>
                                    <p>K-Means: Groups data by minimizing intra-cluster variance; effective for clustering RNA and miRNA expression profiles.</p>
                                    <p>Spectral Clustering: Uses graph-based similarity to identify complex patterns; ideal for integrating methylation and CNA data.</p>
                                    <p>BK-Means: A hierarchical variation of K-Means, suitable for layered clustering of clinical and multi-omics datasets.</p>
                                    <p>Ward’s Method: Minimizes variance in hierarchical clustering; well-suited for combining RNA and methylation data in integrated analyses.</p>
                                </>
                            }
                            onTop={false}
                            onEvent='hover'
                            noBorder
                            extraClassName='pull-right'
                        />
                    </InputLabel>
                }
                options={clusteringAlgorithmOptions}
                placeholder='Select an algorithm'
                name='algorithm'
                value={props.parameters.algorithm}
                onChange={props.handleChangeParams}
            />

            <Form.Checkbox
                checked={props.parameters.lookForOptimalNClusters}
                onChange={(_e, { checked }) => { props.handleChangeOptimalNClusters(checked ?? false) }}
                label='Search for the optimal number of clusters'
            />

            {!props.parameters.lookForOptimalNClusters &&
                <Form.Input
                    type='number'
                    label={
                        <InputLabel label='Number of clusters'>
                            <InfoPopup
                                content='The number of clusters to group the data into. The optimal number of clusters can be found by looking for the elbow in the curve of the sum of squared distances between samples and their closest cluster center.'
                                onTop={false}
                                onEvent='hover'
                                noBorder
                                extraClassName='pull-right'
                            />
                        </InputLabel>
                    }
                    name='nClusters'
                    min={2}
                    max={10}
                    value={props.parameters.nClusters}
                    onChange={props.handleChangeParams}
                />
            }

            <Form.Select
                fluid
                selectOnBlur={false}
                label={
                    <InputLabel label='Metric'>
                        <InfoPopup
                            content={
                                <>
                                    <p>Cox Regression: A proportional hazards model to identify associations between multi-omics features (RNA, miRNA, methylation) and clinical outcomes over time.</p>
                                    <p>Log-Rank Test: A non-parametric test to compare the survival distributions of two or more groups; currently not available.</p>
                                </>
                            }
                            onTop={false}
                            onEvent='hover'
                            noBorder
                            extraClassName='pull-right'
                        />
                    </InputLabel>
                }
                options={clusteringMetricOptions}
                placeholder='Select a metric'
                name='metric'
                value={props.parameters.metric}
                onChange={props.handleChangeParams}
            />

            {/* Scoring method */}
            {props.parameters.metric === ClusteringMetric.COX_REGRESSION &&
                <Form.Select
                    fluid
                    selectOnBlur={false}
                    label={
                        <InputLabel label='Scoring method'>
                            <InfoPopup
                                content={
                                    <>
                                        <p>C-Index: A measure of concordance between predicted and observed survival outcomes; higher values indicate better model performance.</p>
                                        <p>Log Likelihood: The probability of observing the data given the model; lower values indicate better model performance.</p>
                                    </>
                                }
                                onTop={false}
                                onEvent='hover'
                                noBorder
                                extraClassName='pull-right'
                            />
                        </InputLabel>
                    }
                    options={clusteringScoringMethodOptions}
                    placeholder='Select a method'
                    name='scoringMethod'
                    value={props.parameters.scoringMethod}
                    onChange={props.handleChangeParams}
                />
            }

            <Form.Group widths='equal'>
                <Form.Input
                    label={
                        <InputLabel label='Random state'>
                            <InfoPopup
                                content='The seed used by the random number generator to ensure reproducibility of the results.'
                                onTop={false}
                                onEvent='hover'
                                noBorder
                                extraClassName='pull-right'
                            />
                        </InputLabel>
                    }
                    placeholder='An integer number'
                    type='number'
                    step={1}
                    min={0}
                    name='randomState'
                    value={props.parameters.randomState}
                    onChange={props.handleChangeParams}
                />

                <Form.Input
                    label={
                        <InputLabel label='Penalizer'>
                            <InfoPopup
                                content='This option is useful when the number of samples in the clinical data is small or there are few observed events, setting this value increases the robustness of the model in such cases avoiding problems with NaN values'
                                onTop={false}
                                onEvent='hover'
                                noBorder
                                extraClassName='pull-right'
                            />
                        </InputLabel>
                    }
                    placeholder='An integer number'
                    type='number'
                    step={0.1}
                    min={0}
                    max={0.99}
                    name='penalizer'
                    value={props.parameters.penalizer ?? ''}
                    onChange={props.handleChangeParams}
                />
            </Form.Group>
        </>
    )
}
