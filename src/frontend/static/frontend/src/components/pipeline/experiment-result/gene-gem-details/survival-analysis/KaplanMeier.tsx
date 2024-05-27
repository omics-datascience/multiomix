import React from 'react'
import { LogRankStatistic, Nullable } from '../../../../../utils/interfaces'
import { DjangoMRNAxGEMResultRow, DjangoSurvivalColumnsTupleSimple } from '../../../../../utils/django_interfaces'
import { alertGeneralError, getDjangoHeader, getGeneAndGEMFromSelectedRow, listToDropdownOptions } from '../../../../../utils/util_functions'
import ky from 'ky'
import { DropdownItemProps, Form, Grid, Header, Label, Select } from 'semantic-ui-react'
import { KaplanMeier, KaplanMeierData, KaplanMeierSample } from './KaplanMeierUtils'
import { LogRankTestStats } from './LogRankTestStats'
import { LoadingPanel } from '../LoadingPanel'

declare const urlSurvivalData: string

/** Common interest values */
const COMMON_INTEREST_VALUES = ['DEAD', 'DECEASE', 'DEATH']

/** Type of groups computed by the backend */
type KaplanMeierGroupsData = {
    low_group: KaplanMeierSample[],
    high_group: KaplanMeierSample[],
    log_rank: LogRankStatistic
}

/**
 * JSON structure of the SurvivalColumns API response
 */
type SurvivalDataResponse = {
    survival_columns: DjangoSurvivalColumnsTupleSimple[],
    gene_data: KaplanMeierGroupsData,
    gem_data: KaplanMeierGroupsData,
    event_values_distinct: string[]
}

/**
 * Component's props
 */
interface KaplanMeierChartProps {
    experimentId: number,
    selectedRow: Nullable<DjangoMRNAxGEMResultRow>,
}

/**
 * Component's state
 */
interface KaplanMeierChartState {
    /** Data for survival analysis using mRNA expression */
    geneData: KaplanMeierData,
    /** Logrank test statistic and p-value for mRNA groups */
    geneLogrank: Nullable<LogRankStatistic>,
    /** Data for survival analysis using GEM expression */
    gemData: KaplanMeierData,
    /** Logrank test statistic and p-value for GEM groups */
    gemLogrank: Nullable<LogRankStatistic>,
    /** List of fields to be considered as event of interest or censored events */
    survivalColumnsValues: string[],
    /** List of fields to be considered as event of interest */
    fieldsInterest: (string | number)[],
    /** Flag to advice to the user that fields of interest were inferred */
    couldInferFieldsOfInterest: boolean,
    /** Array of possibles SurvivalColumnsTuple to request */
    survivalColumns: DjangoSurvivalColumnsTupleSimple[]
    /** ID of the survival column tuple to retrieve and show in Kaplan-Meier chart */
    selectedSurvivalColumnId: Nullable<number>,
    /** Flag of survival data request */
    gettingSurvivalData: boolean,
}

/**
 * Generates a Kaplan-Meier curve for mRNA and GEM expression getting clinical data into consideration
 */
class KaplanMeierChart extends React.Component<KaplanMeierChartProps, KaplanMeierChartState> {
    constructor (props) {
        super(props)
        this.state = {
            geneData: null,
            geneLogrank: null,
            gemData: null,
            gemLogrank: null,
            survivalColumnsValues: [],
            fieldsInterest: [],
            couldInferFieldsOfInterest: false,
            survivalColumns: [],
            selectedSurvivalColumnId: null,
            gettingSurvivalData: false
        }
    }

    /**
     * When finishes mounting get survival data from backend
     */
    componentDidMount () {
        this.getSurvivalData(true)
    }

    /**
     * Retrieves low and high groups for Kaplan-Meier chats
     * @param dataResponse Data response object to get the groups
     * @param dataKey Key in response object to get the group
     * @returns Low and high groups ready for Kaplan-Meier chart
     */
    generateKaplanMeierData (dataResponse: SurvivalDataResponse, dataKey: 'gene_data' | 'gem_data'): KaplanMeierData {
        return [
            {
                label: 'Low expression group',
                data: dataResponse[dataKey]?.low_group ?? []
            },
            {
                label: 'High expression group',
                data: dataResponse[dataKey]?.high_group ?? []
            }
        ]
    }

    /**
     * Infers the fields of interest taking into consideration common values in CGDSDatasets and user files
     * @param eventValues Event values retrieved from backend
     */
    inferFieldsOfInterest (eventValues: (string | number)[]) {
        const fieldsOfInterest: (string | number)[] = []
        eventValues.forEach((eventValue) => {
            const eventValueUpper = eventValue.toString().toUpperCase()

            // Usually, the number 1 is used to indicate an event of interest
            if (eventValueUpper === '1' || COMMON_INTEREST_VALUES.find((commonValue) => eventValueUpper.includes(commonValue))) {
                fieldsOfInterest.push(eventValue)
            }
        })

        const couldInfer = fieldsOfInterest.length > 0

        this.setState({
            fieldsInterest: fieldsOfInterest,
            couldInferFieldsOfInterest: couldInfer
        }, () => {
            if (couldInfer) {
                this.getSurvivalData(false)
            }
        })
    }

    /**
     * Makes a request and show statistical properties between a specific
     * gene and GEM
     * @param inferFieldOfInterest If true it try to infers the fields of interest from event values retrieved from backend
     */
    getSurvivalData = (inferFieldOfInterest: boolean) => {
        // If it's getting the data, prevents multiples requests to the server
        if (this.state.gettingSurvivalData || !this.props.selectedRow) {
            return
        }

        this.setState({ gettingSurvivalData: true }, () => {
            const [gene, gem] = getGeneAndGEMFromSelectedRow(this.props.selectedRow)

            const headers = getDjangoHeader()

            const jsonParams = {
                gene,
                gem,
                experimentId: this.props.experimentId,
                fieldsInterest: this.state.fieldsInterest,
                survivalColumnId: this.state.selectedSurvivalColumnId
            }

            ky.post(urlSurvivalData, { headers, json: jsonParams, timeout: 60000 }).then((response) => {
                response.json().then((survivalData: SurvivalDataResponse) => {
                    this.setState({
                        geneData: this.generateKaplanMeierData(survivalData, 'gene_data'),
                        geneLogrank: survivalData.gene_data?.log_rank ?? null,
                        gemData: this.generateKaplanMeierData(survivalData, 'gem_data'),
                        gemLogrank: survivalData.gem_data?.log_rank ?? null,
                        survivalColumns: survivalData.survival_columns,
                        survivalColumnsValues: survivalData.event_values_distinct,
                        gettingSurvivalData: false // Sets here to prevent showing old data in Kaplan-Meier charts
                    })

                    if (inferFieldOfInterest) {
                        this.inferFieldsOfInterest(survivalData.event_values_distinct)
                    }
                }).catch((err) => {
                    // If an error ocurred, sets the selected row to null
                    this.setState({ gettingSurvivalData: false })
                    alertGeneralError()
                    console.log('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                // If an error ocurred, sets the selected row to null
                this.setState({ gettingSurvivalData: false })
                alertGeneralError()
                console.log('Error getting correlation graph ->', err)
            })
        })
    }

    /**
     * Updates component state
     * @param name Name of state field to update
     * @param value Value to set
     */
    handleChange (name: keyof KaplanMeierChartState, value) {
        this.setState<never>({ [name]: value }, () => {
            // Only if user changes Survival column to compute it try to infer
            const inferFieldsOfInterest = name === 'selectedSurvivalColumnId'
            this.getSurvivalData(inferFieldsOfInterest)
        })
    }

    render () {
        if (this.state.gettingSurvivalData) {
            return <LoadingPanel />
        }

        const survivalColumnsTupleOptions: DropdownItemProps[] = this.state.survivalColumns.map((survColumn) => {
            return {
                key: survColumn.id,
                text: `Time: ${survColumn.time_column} | Event: ${survColumn.event_column}`,
                value: survColumn.id
            }
        })

        survivalColumnsTupleOptions.unshift({ key: 'None', text: 'None', value: undefined })

        const noOptions = this.state.survivalColumnsValues.length === 0

        // Gets survival columns values to select interest/censored fields
        const survivalValuesOptions = listToDropdownOptions(this.state.survivalColumnsValues)

        const selectSurvivalColumns = (
            <Grid.Row columns={1}>
                <Grid.Column>
                    <Form>
                        <Form.Group>
                            <Form.Select
                                width={5}
                                selectOnBlur={false}
                                label='Survival columns tuples'
                                options={survivalColumnsTupleOptions}
                                value={this.state.selectedSurvivalColumnId as number}
                                name='selectedSurvivalColumnId'
                                onChange={(_, { name, value }) => this.handleChange(name, value)}
                                disabled={this.state.gettingSurvivalData}
                            />

                            <Form.Field width={4}>
                                <label>
                                    Field of event of interest
                                </label>

                                <Select
                                    selectOnBlur={false}
                                    label='Field of event of interest'
                                    options={survivalValuesOptions}
                                    search
                                    selection
                                    clearable
                                    multiple
                                    name="fieldsInterest"
                                    value={this.state.fieldsInterest}
                                    onChange={(_, { name, value }) => this.handleChange(name, value)}
                                    placeholder='Select some fields'
                                    disabled={this.state.gettingSurvivalData || noOptions}
                                />

                            </Form.Field>

                            {this.state.couldInferFieldsOfInterest &&
                                <Form.Field width={4}>
                                    <Label
                                        id='advice-infer-interest'
                                        color='yellow'
                                        size='large'
                                        pointing='left'
                                    >
                                        The fields of interest were inferred from common values
                                    </Label>
                                </Form.Field>
                            }

                        </Form.Group>
                    </Form>
                </Grid.Column>
            </Grid.Row>
        )

        if (!this.state.geneData) {
            return (
                <Grid>
                    {selectSurvivalColumns}
                </Grid>
            )
        }

        return (
            <Grid>
                {selectSurvivalColumns}

                <Grid.Row className='no-padding-top'>
                    <Grid.Column>
                        <Label color='orange' size='large'>
                            Samples with empty values (i.e. blank values) will be ignored in survival analysis
                        </Label>
                    </Grid.Column>
                </Grid.Row>
                <Grid.Row columns={2} divided textAlign='center'>
                    <Grid.Column>
                        <Header className='survival-header'>{this.props.selectedRow?.gene}</Header>
                        <KaplanMeier
                            data={this.state.geneData}
                            height={480}
                            width={600}
                            xAxisLabel='Time'
                            yAxisLabel='Probability'
                        />

                        <LogRankTestStats logrankTest={this.state.geneLogrank} />
                    </Grid.Column>
                    <Grid.Column>
                        <Header className='survival-header'>{this.props.selectedRow?.gem}</Header>
                        <KaplanMeier
                            data={this.state.gemData}
                            height={480}
                            width={600}
                            xAxisLabel='Time'
                            yAxisLabel='Probability'
                        />

                        <LogRankTestStats logrankTest={this.state.gemLogrank} />
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        )
    }
}

export { KaplanMeierChart }
