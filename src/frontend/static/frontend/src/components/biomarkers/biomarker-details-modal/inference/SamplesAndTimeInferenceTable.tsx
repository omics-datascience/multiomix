import React, { useState } from 'react'
import { Button, Grid, Menu, Segment, Table } from 'semantic-ui-react'
import { InferenceExperimentForTable, SampleAndTime } from '../../types'
import { PaginatedTable } from '../../../common/PaginatedTable'
import { TableCellWithTitle } from '../../../common/TableCellWithTitle'
import { PredictionRangeLabelsSetSelect } from '../../../common/prediction-range-label/PredictionRangeLabelsSetSelect'
import { NewPredictionRangeLabelsSetModal } from '../../../common/prediction-range-label/NewPredictionRangeLabelsSetModal'
import { InfoPopup } from '../../../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { SamplesAndTimeInferenceCharts } from './SamplesAndTimeInferenceCharts'
import { InferenceExperimentClinicalAttributeSelect } from './InferenceExperimentClinicalAttributeSelect'
import { ClinicalSourcePopup } from '../../../pipeline/all-experiments-view/ClinicalSourcePopup'
import { useIntl } from 'react-intl'

declare const urlInferenceExperimentSamplesAndTime: string
declare const urlClinicalSourceAddOrEditInferenceExperiment: string
declare const urlUnlinkClinicalSourceInferenceExperiment: string

/** SamplesAndTimeInferenceTable props. */
interface SamplesAndTimeInferenceTableProps {
    /** Selected InferenceExperimentForTable instance to retrieve all its data. */
    selectedInferenceExperiment: InferenceExperimentForTable,
    /** Function to refresh the experiment info after addition or unlinking of clinical data. */
    refreshExperimentInfo: () => void,
}

/**
 * Renders a Table with the samples and the predicted hazard/survival time.
 * @param props Component props.
 * @returns Component.
 */
export const SamplesAndTimeInferenceTable = (props: SamplesAndTimeInferenceTableProps) => {
    const intl = useIntl()
    const [activeMenuItem, setActiveMenuItem] = useState<'table' | 'charts'>('charts') // TODO: change to 'table'
    const [selectedRangeSetPk, setSelectedClusterSetPk] = useState<number | undefined>(undefined)
    const [openRangeLabelsSetModal, setOpenRangeLabelsSetModal] = useState(false)
    const [selectedClinicalAttribute, setSelectedClinicalAttribute] = useState<string | undefined>(undefined)
    const [showPopup, setShowPopup] = useState(false)

    const extraQueryParams = selectedRangeSetPk ? { prediction_range_labels_set_pk: selectedRangeSetPk } : {}
    const selectedTrainedModelPk = props.selectedInferenceExperiment.trained_model

    /**
     * Returns the active item in the menu.
     * @returns Active item in the menu.
     */
    const getActiveItem = (): JSX.Element => {
        switch (activeMenuItem) {
            case 'table':
                /* TODO: refactor in another file and rename this file */
                return (
                    <PaginatedTable<SampleAndTime>
                        headers={[
                            { name: intl.formatMessage({ id: 'common.sample' }), serverCodeToSort: 'sample', width: 3, textAlign: 'center' },
                            { name: intl.formatMessage({ id: 'inference.timeTable.columns.predictedTime' }), serverCodeToSort: 'prediction', width: 2, textAlign: 'center' }

                        ]}
                        queryParams={{
                            inference_experiment_pk: props.selectedInferenceExperiment.id,
                            ...extraQueryParams
                        }}
                        customFilters={[
                            {
                                label: intl.formatMessage({ id: 'inference.timeTable.filter.range.label' }),
                                keyForServer: 'prediction',
                                defaultValue: '',
                                placeholder: intl.formatMessage({ id: 'inference.timeTable.filter.range.placeholder' }),
                                disabledFunction: () => selectedRangeSetPk === undefined
                            }
                        ]}
                        defaultSortProp={{ sortField: 'sample', sortOrderAscendant: false }}
                        showSearchInput
                        defaultPageSize={25}
                        searchLabel={intl.formatMessage({ id: 'common.sample' })}
                        searchPlaceholder={intl.formatMessage({ id: 'common.search' })}
                        searchWidth={5}
                        entriesSelectWidth={3}
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
                )
            case 'charts':
                return (
                    <SamplesAndTimeInferenceCharts
                        inferenceExperiment={props.selectedInferenceExperiment}
                        selectedClinicalAttribute={selectedClinicalAttribute}
                        refreshExperimentInfo={props.refreshExperimentInfo}
                    />
                )
        }
    }

    return (
        <Grid>
            <Grid.Row columns={2} divided>
                <Grid.Column width={12}>
                    <Menu className='margin-top-0'>
                        <Menu.Item
                            active={activeMenuItem === 'table'}
                            onClick={() => setActiveMenuItem('table')}
                        >
                            Table

                            <InfoPopup
                                content='Table with all the samples and their predicted hazard/survival time'
                                onTop={false}
                                onEvent='hover'
                                extraClassName='margin-left-5'
                            />
                        </Menu.Item>

                        <Menu.Item
                            active={activeMenuItem === 'charts'}
                            onClick={() => setActiveMenuItem('charts')}
                        >
                            {intl.formatMessage({ id: 'inference.timeTable.menu.table' })}

                            <InfoPopup
                                content={intl.formatMessage({ id: 'inference.timeTable.menu.table.info' })}
                                onTop={false}
                                onEvent='hover'
                                extraClassName='margin-left-5'
                            />
                        </Menu.Item>
                    </Menu>

                    <Segment>
                        {getActiveItem()}
                    </Segment>
                </Grid.Column>

                <Grid.Column width={4}>
                    {selectedTrainedModelPk !== null && (
                        <>
                            <NewPredictionRangeLabelsSetModal
                                showNewPredictionRangeLabelsSet={openRangeLabelsSetModal}
                                setShowNewPredictionRangeLabelsSet={setOpenRangeLabelsSetModal}
                                trainedModelPk={selectedTrainedModelPk}
                            />

                            {/* Clinical attribute select */}
                            {(activeMenuItem === 'charts' && props.selectedInferenceExperiment.clinical_source_id) && (
                                <>
                                    <ClinicalSourcePopup
                                        experiment={props.selectedInferenceExperiment}
                                        experimentType='inference'
                                        // In survival analysis tabs is necessary to have survival tuples
                                        showOnlyClinicalDataWithSurvivalTuples
                                        showCBioPortalOption
                                        showPopup={showPopup}
                                        urlClinicalSourceAddOrEdit={urlClinicalSourceAddOrEditInferenceExperiment}
                                        urlUnlinkClinicalSource={urlUnlinkClinicalSourceInferenceExperiment}
                                        position='bottom center'
                                        iconExtraClassNames='margin-top-5'
                                        openPopup={() => setShowPopup(true)}
                                        closePopup={() => setShowPopup(false)}
                                        onSuccessCallback={props.refreshExperimentInfo}
                                        validationSource={null}
                                    />

                                    <InferenceExperimentClinicalAttributeSelect
                                        selectedInferenceExperiment={props.selectedInferenceExperiment}
                                        selectedClinicalAttribute={selectedClinicalAttribute}
                                        setSelectedClinicalAttribute={setSelectedClinicalAttribute}
                                    />
                                </>
                            )}

                            {/* Range Select */}
                            <PredictionRangeLabelsSetSelect
                                trainedModelPk={selectedTrainedModelPk}
                                selectedClusterSetPk={selectedRangeSetPk}
                                setSelectedClusterSetPk={setSelectedClusterSetPk}
                            />

                            <Button className='margin-top-2' primary fluid onClick={() => { setOpenRangeLabelsSetModal(true) }}>{intl.formatMessage({ id: 'inference.timeTable.addRangeLabels' })}</Button>
                        </>
                    )}
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}
