import React, { useState } from 'react'
import { Button, Grid, Table } from 'semantic-ui-react'
import { InferenceExperimentForTable, SampleAndTime } from '../../types'
import { PaginatedTable } from '../../../common/PaginatedTable'
import { TableCellWithTitle } from '../../../common/TableCellWithTitle'
import { PredictionRangeLabelsSetSelect } from '../../../common/prediction-range-label/PredictionRangeLabelsSetSelect'
import { NewPredictionRangeLabelsSetModal } from '../../../common/prediction-range-label/NewPredictionRangeLabelsSetModal'

declare const urlInferenceExperimentSamplesAndTime: string

/** SamplesAndTimeInferenceTable props. */
interface SamplesAndTimeInferenceTableProps {
    /** Selected InferenceExperimentForTable instance to retrieve all its data. */
    selectedInferenceExperiment: InferenceExperimentForTable,
}

/**
 * Renders a Table with the samples and the predicted hazard/survival time.
 * @param props Component props.
 * @returns Component.
 */
export const SamplesAndTimeInferenceTable = (props: SamplesAndTimeInferenceTableProps) => {
    const [selectedRangeSetPk, setSelectedClusterSetPk] = useState<number | undefined>(undefined)
    const [openRangeLabelsSetModal, setOpenRangeLabelsSetModal] = useState(false)

    const extraQueryParams = selectedRangeSetPk ? { prediction_range_labels_set_pk: selectedRangeSetPk } : {}

    const selectedTrainedModelPk = props.selectedInferenceExperiment.trained_model

    return (
        <Grid>
            <Grid.Row columns={2} divided>
                <Grid.Column width={12}>
                    <PaginatedTable<SampleAndTime>
                        headers={[
                            { name: 'Sample', serverCodeToSort: 'sample', width: 3 },
                            { name: 'Predicted time', serverCodeToSort: 'prediction', width: 2 }
                        ]}
                        queryParams={{
                            inference_experiment_pk: props.selectedInferenceExperiment.id,
                            ...extraQueryParams
                        }}
                        customFilters={[
                            // TODO: implement filter by PredictionRangeLabel
                            // { label: 'Cluster', keyForServer: 'range', defaultValue: '', placeholder: 'Filter by range' }
                        ]}
                        defaultSortProp={{ sortField: 'sample', sortOrderAscendant: false }}
                        showSearchInput
                        defaultPageSize={25}
                        searchLabel='Sample'
                        searchPlaceholder='Search by sample'
                        urlToRetrieveData={urlInferenceExperimentSamplesAndTime}
                        mapFunction={(sampleAndTime: SampleAndTime) => {
                            return (
                                <Table.Row key={sampleAndTime.sample} style={{ backgroundColor: sampleAndTime.color ?? '' }}>
                                    <TableCellWithTitle className='align-center' value={sampleAndTime.sample} />
                                    <Table.Cell textAlign='center'>{sampleAndTime.prediction}</Table.Cell>
                                </Table.Row>
                            )
                        }}
                    />
                </Grid.Column>
                <Grid.Column width={4}>
                    {selectedTrainedModelPk !== null &&
                        <>
                            <NewPredictionRangeLabelsSetModal
                                showNewPredictionRangeLabelsSet={openRangeLabelsSetModal}
                                setShowNewPredictionRangeLabelsSet={setOpenRangeLabelsSetModal}
                                trainedModelPk={selectedTrainedModelPk}
                            />

                            <PredictionRangeLabelsSetSelect
                                trainedModelPk={selectedTrainedModelPk}
                                selectedClusterSetPk={selectedRangeSetPk}
                                setSelectedClusterSetPk={setSelectedClusterSetPk}
                            />

                            <Button className='margin-top-2' primary fluid onClick={() => { setOpenRangeLabelsSetModal(true) }}>Add Range labels</Button>
                        </>
                    }
                </Grid.Column>
            </Grid.Row>
        </Grid>

    )
}
