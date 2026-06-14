import React from 'react'
import { Form, Icon, Label, Statistic } from 'semantic-ui-react'
import { CorrelationType, ExperimentInfo, ExperimentResultTableControl } from '../../../utils/interfaces'
import { InfoPopup } from './gene-gem-details/InfoPopup'
import { generatesOrderingQueryMultiField } from '../../../utils/util_functions'
import { DjangoExperiment } from '../../../utils/django_interfaces'
import { SingleRangeSlider } from 'neo-react-semantic-ui-range'
import { BiomarkerFromCorrelationModal } from './BiomarkerFromCorrelationModal'
import { useIntl } from 'react-intl'

declare const urlDownloadResultWithFilters: string

/**
 * Component's props
 */
interface ResultTableControlFormProps {
    /** Experiment to send as parameter to some props callbacks */
    experimentInfo: ExperimentInfo,
    /** Table control object */
    tableControl: ExperimentResultTableControl,
    /** GEM description to display as placeholder in Search input */
    gemDescription: string,
    /** Experiment's Minimum Coefficient threshold  */
    minimumCoefficientThreshold: number,
    /** Number of visible (due filters) combinations */
    numberOfShowingCombinations: number,
    /** Total number of combinations */
    totalNumberOfCombinations: number,
    /** Callback for changes in form */
    onHandleTableControlChanges: (field: keyof ExperimentResultTableControl, value) => void,
    /** Callback for changes in (adjusted) p-values precision only */
    changePrecisionState: (showHighPrecision: boolean) => void,
    /** Callback for reset filters and sorting */
    resetFiltersAndSorting: (experiment: DjangoExperiment) => void,
    /** Callback for reset only filters */
    resetFilters: (experiment: ExperimentInfo) => void,
}

/**
 * Render a TableControl form for the result view
 * @param props Component's props
 * @returns Component
 */
export const ResultTableControlForm = (props: ResultTableControlFormProps) => {
    const intl = useIntl()
    const selectCorrelationTypeOptions = [
        { key: 'both', text: intl.formatMessage({ id: 'resultTableControlForm.correlationType.both' }), value: CorrelationType.BOTH },
        { key: 'positive', text: intl.formatMessage({ id: 'resultTableControlForm.correlationType.positive' }), value: CorrelationType.POSITIVE },
        { key: 'negative', text: intl.formatMessage({ id: 'resultTableControlForm.correlationType.negative' }), value: CorrelationType.NEGATIVE }
    ]

    const selectPageSizeOptions = [
        { key: '10', text: '10', value: 10 },
        { key: '25', text: '25', value: 25 },
        { key: '50', text: '50', value: 50 },
        { key: '100', text: '100', value: 100 }
    ]

    const isShowingHighPrecision = props.tableControl.showHighPrecision

    /**
     * Generates an URL to download the file of the resulting combinations from the experiment
     * with filters applied
     * @returns URL to open in a new window
     */
    function generateDownloadWithFiltersQuery (): string {
        const tableControl = props.tableControl
        return `${urlDownloadResultWithFilters}?experiment_id=${props.experimentInfo.experiment.id}` +
            `&coefficientThreshold=${tableControl.coefficientThreshold}` +
            `&correlationType=${tableControl.correlationType}` +
            `&search=${tableControl.textFilter}` +
            `&ordering=${generatesOrderingQueryMultiField(tableControl.sortFields)}`
    }

    return (
        <>
            <Form>
                <Form.Group>
                    <div style={{ width: '100%', alignItems: 'center', display: 'flex' }}>

                        {/* Number of showing/total combinations */}
                        <Form.Field width='4' className='margin-left-2' style={{ display: 'flex', alignItems: 'center' }}>
                            <Statistic size='mini'>
                                <Statistic.Value id='stats-number-of-combinations'>
                                    <Icon name='dna' />
                                    <span>
                                        {props.numberOfShowingCombinations} / {props.totalNumberOfCombinations}
                                    </span>
                                </Statistic.Value>
                                <Statistic.Label>{intl.formatMessage({ id: 'resultTableControlForm.showingTotal' })}</Statistic.Label>
                            </Statistic>

                            <InfoPopup
                                extraClassName='margin-left-2'
                                onTop={false}
                                content={intl.formatMessage({ id: 'resultTableControlForm.showingTotalInfo' })}
                            />
                        </Form.Field>

                        {/* mRNA/MiRNA search */}
                        <Form.Input
                            width={5}
                            icon='search' iconPosition='left'
                            label={`${props.gemDescription}/mRNA`}
                            placeholder={intl.formatMessage(
                                { id: 'resultTableControlForm.searchPlaceholder' },
                                { gemDescription: props.gemDescription }
                            )}
                            name='textFilter'
                            value={props.tableControl.textFilter}
                            onChange={(_, { name, value }) => props.onHandleTableControlChanges(name, value)}
                            className='no-margin-right-form-field'
                        />

                        {/* Correlation threshold */}
                        <Form.Field width={6}>
                            <Label
                                id='slider-cor-filter-label'
                                className='align-center bolder'
                            >
                                {intl.formatMessage({ id: 'resultTableControlForm.correlationCoefficient' }, { value: props.tableControl.coefficientThreshold.toFixed(2) })}
                            </Label>

                            <SingleRangeSlider
                                value={props.tableControl.coefficientThreshold}
                                color='green'
                                defaultMinValue={props.minimumCoefficientThreshold}
                                className='margin-bottom-5'
                                defaultMaxValue={0.95}
                                step={0.05}
                                onChange={(value: number) => props.onHandleTableControlChanges('coefficientThreshold', value)}
                            />

                            <Label
                                id='label-minimum-threshold'
                                color='green'
                                className='pull-left'
                            >
                                {props.minimumCoefficientThreshold.toFixed(2)}
                            </Label>
                            <Label color='green' className='pull-right'>0.95</Label>
                        </Form.Field>

                        {/* Correlation type */}
                        <Form.Select
                            width={2}
                            fluid
                            selectOnBlur={false}
                            label={intl.formatMessage({
                                id: 'resultTableControlForm.correlationType'
                            })}
                            options={selectCorrelationTypeOptions}
                            name='correlationType'
                            value={props.tableControl.correlationType}
                            onChange={(_, { name, value }) => props.onHandleTableControlChanges(name, value)}
                            className='no-margin-right-form-field'
                        />

                        {/* Page size */}
                        <Form.Select
                            width={2}
                            fluid
                            selectOnBlur={false}
                            label={intl.formatMessage({
                                id: 'resultTableControlForm.numberOfEntries'
                            })}
                            options={selectPageSizeOptions}
                            name='pageSize'
                            value={props.tableControl.pageSize}
                            onChange={(_, { name, value }) => props.onHandleTableControlChanges(name, value)}
                            className='no-margin-right-form-field'
                        />

                        <Form.Button
                            width={2}
                            label={isShowingHighPrecision ? '1.234e-5' : 'p < .001'}
                            icon={isShowingHighPrecision ? 'eye slash' : 'eye'}
                            title={intl.formatMessage({
                                id: isShowingHighPrecision
                                    ? 'resultTableControlForm.lessPrecisePValue'
                                    : 'resultTableControlForm.morePrecisePValue'
                            })}
                            onClick={() => props.changePrecisionState(!isShowingHighPrecision)}
                        />

                        <BiomarkerFromCorrelationModal
                            experimentInfo={props.experimentInfo}
                            tableControl={props.tableControl}
                        />

                        <Form.Button
                            width={2}
                            label={intl.formatMessage({
                                id: 'resultTableControlForm.clean'
                            })}
                            icon='trash'
                            color='red'
                            title={intl.formatMessage({
                                id: 'resultTableControlForm.cleanTitle'
                            })}
                            className='no-margin-right-form-field'
                            onClick={() => props.resetFiltersAndSorting(props.experimentInfo.experiment)}
                        />

                        <Form.Button
                            width={2}
                            label={intl.formatMessage({
                                id: 'resultTableControlForm.download'
                            })}
                            icon='cloud download'
                            color='blue'
                            title={intl.formatMessage({
                                id: 'resultTableControlForm.downloadTitle'
                            })}
                            className='no-margin-right-form-field'
                            onClick={() => window.open(generateDownloadWithFiltersQuery(), '_blank')}
                            disabled={!props.experimentInfo.rows.length}
                        />

                        <Form.Field width={1} className='margin-left-2'>
                            <InfoPopup
                                id='experiment-result-info-popup'
                                content={intl.formatMessage(
                                    { id: 'resultTableControlForm.infoPopup' },
                                    { threshold: props.minimumCoefficientThreshold }
                                )}
                            />
                        </Form.Field>
                    </div>
                </Form.Group>
            </Form>
        </>

    )
}
