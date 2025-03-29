import React from 'react'
import { Form, Icon, Label, Statistic } from 'semantic-ui-react'
import { CorrelationType, ExperimentInfo, ExperimentResultTableControl } from '../../../utils/interfaces'
import { InfoPopup } from './gene-gem-details/InfoPopup'
import { generatesOrderingQueryMultiField } from '../../../utils/util_functions'
import { DjangoExperiment } from '../../../utils/django_interfaces'
import { SingleRangeSlider } from 'neo-react-semantic-ui-range'

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
    resetFiltersAndSorting: (experiment: DjangoExperiment) => void
    /** Callback for reset only filters */
    resetFilters: (experiment: ExperimentInfo) => void
}

/**
 * Render a TableControl form for the result view
 * @param props Component's props
 * @returns Component
 */
export const ResultTableControlForm = (props: ResultTableControlFormProps) => {
    const selectCorrelationTypeOptions = [
        { key: 'both', text: 'Both', value: CorrelationType.BOTH },
        { key: 'positive', text: 'Positive', value: CorrelationType.POSITIVE },
        { key: 'negative', text: 'Negative', value: CorrelationType.NEGATIVE }
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
        <Form>
            <Form.Group>
                {/* Number of showing/total combinations */}
                <Form.Field width='3' className='margin-left-2'>
                    <Statistic size='tiny'>
                        <Statistic.Value id='stats-number-of-combinations'>
                            <Icon name='dna' />
                            <span>
                                {props.numberOfShowingCombinations} / {props.totalNumberOfCombinations}
                            </span>
                        </Statistic.Value>
                        <Statistic.Label>SHOWING/TOTAL</Statistic.Label>
                    </Statistic>

                    <InfoPopup
                        onTop={false}
                        content='Number of significantly correlated features  according to the applied filters over the total significantly correlated'
                    />
                </Form.Field>

                {/* mRNA/MiRNA search */}
                <Form.Input
                    width={5}
                    icon='search' iconPosition='left'
                    label={`${props.gemDescription}/mRNA`}
                    placeholder={`Search by ${props.gemDescription} or mRNA`}
                    name='textFilter'
                    value={props.tableControl.textFilter}
                    onChange={(_, { name, value }) => props.onHandleTableControlChanges(name, value)}
                />

                {/* Correlation threshold */}
                <Form.Field width={6}>
                    <Label
                        id='slider-cor-filter-label'
                        className='align-center bolder'
                    >
                        Correlation Coefficient {props.tableControl.coefficientThreshold.toFixed(2)}
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
                    label='Correlation type'
                    options={selectCorrelationTypeOptions}
                    name='correlationType'
                    value={props.tableControl.correlationType}
                    onChange={(_, { name, value }) => props.onHandleTableControlChanges(name, value)}
                />

                {/* Page size */}
                <Form.Select
                    width={2}
                    fluid
                    selectOnBlur={false}
                    label='Number of entries'
                    options={selectPageSizeOptions}
                    name='pageSize'
                    value={props.tableControl.pageSize}
                    onChange={(_, { name, value }) => props.onHandleTableControlChanges(name, value)}
                />

                <Form.Button
                    width={1}
                    label={isShowingHighPrecision ? '1.234e-5' : 'p < .001'}
                    icon={isShowingHighPrecision ? 'eye slash' : 'eye'}
                    title={`${isShowingHighPrecision ? 'Less' : 'More'} precise p-value`}
                    onClick={() => props.changePrecisionState(!isShowingHighPrecision)}
                />

                <Form.Button
                    width={1}
                    label='Filters'
                    icon='filter'
                    color='yellow'
                    title='Reset filters only'
                    className='no-margin-right-form-field'
                    onClick={() => props.resetFilters(props.experimentInfo)}
                />

                <Form.Button
                    width={1}
                    label='Clean'
                    icon='trash'
                    color='red'
                    title='Reset filters and sorting'
                    className='no-margin-right-form-field'
                    onClick={() => props.resetFiltersAndSorting(props.experimentInfo.experiment)}
                />

                <Form.Button
                    width={1}
                    label='Download'
                    icon='cloud download'
                    color='blue'
                    title='Download result with filters applied'
                    className='no-margin-right-form-field'
                    onClick={() => window.open(generateDownloadWithFiltersQuery(), '_blank')}
                    disabled={!props.experimentInfo.rows.length}
                />

                <Form.Field width={1}>
                    <InfoPopup
                        id='experiment-result-info-popup'
                        content={
                            <p>
                                This table shows all the combinations whose correlation coefficient was more or equal than selected threshold ({props.minimumCoefficientThreshold}). Choose some of the options listed in <i>Actions</i> column
                            </p>
                        }
                    />
                </Form.Field>
            </Form.Group>
        </Form>
    )
}
