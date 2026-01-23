import React from 'react'
import { Form, InputOnChangeData } from 'semantic-ui-react'
import { clusteringAlgorithmOptions, clusteringMetricOptions, clusteringScoringMethodOptions } from '../../utils'
import { ClusteringMetric, ClusteringParameters } from '../../types'
import { InfoPopup } from '../../../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { InputLabel } from '../../../common/InputLabel'
import { useIntl } from 'react-intl'

interface NewClusteringModelFormProps {
    /** Getter of the selected params to handle in the form. */
    parameters: ClusteringParameters,
    /** Setter of the selected params to handle in the form. */
    handleChangeParams: (event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => void,
    /** Setter of the lookForOptimalNClusters value. */
    handleChangeOptimalNClusters: (checked: boolean) => void
}

export const NewClusteringModelForm = (props: NewClusteringModelFormProps) => {
    const intl = useIntl()
    return (
        <>
            <Form.Select
                fluid
                selectOnBlur={false}
                label={(
                    <InputLabel label={intl.formatMessage({ id: 'newClusteringForm.label.algorithm' })}>
                        <InfoPopup
                            content={intl.formatMessage({ id: 'newClusteringForm.info.algorithm' })}
                            onTop={false}
                            onEvent='hover'
                            noBorder
                            extraClassName='pull-right'
                        />
                    </InputLabel>
                )}
                options={clusteringAlgorithmOptions}
                placeholder={intl.formatMessage({ id: 'newClusteringForm.placeholder.algorithm' })}
                name='algorithm'
                value={props.parameters.algorithm}
                onChange={props.handleChangeParams}
            />

            <Form.Checkbox
                checked={props.parameters.lookForOptimalNClusters}
                onChange={(_e, { checked }) => { props.handleChangeOptimalNClusters(checked ?? false) }}
                label={intl.formatMessage({ id: 'newClusteringForm.label.searchOptimalClusters' })}
            />

            {!props.parameters.lookForOptimalNClusters && (
                <Form.Input
                    type='number'
                    label={(
                        <InputLabel label={intl.formatMessage({ id: 'newClusteringForm.label.nClusters' })}>
                            <InfoPopup
                                content={intl.formatMessage({ id: 'newClusteringForm.info.nClusters' })}
                                onTop={false}
                                onEvent='hover'
                                noBorder
                                extraClassName='pull-right'
                            />
                        </InputLabel>
                    )}
                    name='nClusters'
                    min={2}
                    max={10}
                    value={props.parameters.nClusters}
                    onChange={props.handleChangeParams}
                />
            )}

            <Form.Select
                fluid
                selectOnBlur={false}
                label={(
                    <InputLabel label={intl.formatMessage({ id: 'newClusteringForm.label.metric' })}>
                        <InfoPopup
                            content={intl.formatMessage({ id: 'newClusteringForm.info.metric' })}
                            onTop={false}
                            onEvent='hover'
                            noBorder
                            extraClassName='pull-right'
                        />
                    </InputLabel>
                )}
                options={clusteringMetricOptions}
                placeholder={intl.formatMessage({ id: 'newClusteringForm.placeholder.metric' })}
                name='metric'
                value={props.parameters.metric}
                onChange={props.handleChangeParams}
            />

            {/* Scoring method */}
            {props.parameters.metric === ClusteringMetric.COX_REGRESSION && (
                <Form.Select
                    fluid
                    selectOnBlur={false}
                    label={(
                        <InputLabel label={intl.formatMessage({ id: 'newClusteringForm.label.scoringMethod' })}>
                            <InfoPopup
                                content={intl.formatMessage({ id: 'newClusteringForm.info.scoringMethod' })}
                                onTop={false}
                                onEvent='hover'
                                noBorder
                                extraClassName='pull-right'
                            />
                        </InputLabel>
                    )}
                    options={clusteringScoringMethodOptions}
                    placeholder={intl.formatMessage({ id: 'newClusteringForm.placeholder.scoringMethod' })}
                    name='scoringMethod'
                    value={props.parameters.scoringMethod}
                    onChange={props.handleChangeParams}
                />
            )}

            <Form.Group widths='equal'>
                <Form.Input
                    label={(
                        <InputLabel label={intl.formatMessage({ id: 'newClusteringForm.label.randomState' })}>
                            <InfoPopup
                                content={intl.formatMessage({ id: 'newClusteringForm.info.randomState' })}
                                onTop={false}
                                onEvent='hover'
                                noBorder
                                extraClassName='pull-right'
                            />
                        </InputLabel>
                    )}
                    placeholder={intl.formatMessage({ id: 'newClusteringForm.placeholder.integer' })}
                    type='number'
                    step={1}
                    min={0}
                    name='randomState'
                    value={props.parameters.randomState}
                    onChange={props.handleChangeParams}
                />

                <Form.Input
                    label={(
                        <InputLabel label={intl.formatMessage({ id: 'newClusteringForm.label.penalizer' })}>
                            <InfoPopup
                                content={intl.formatMessage({ id: 'newClusteringForm.info.penalizer' })}
                                onTop={false}
                                onEvent='hover'
                                noBorder
                                extraClassName='pull-right'
                            />
                        </InputLabel>
                    )}
                    placeholder={intl.formatMessage({ id: 'newClusteringForm.placeholder.integer' })}
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
