import React, { useState } from 'react'
import { Button, Grid, Icon, Segment } from 'semantic-ui-react'
import { DjangoMRNAxGEMResultRow, SourceDataStatisticalPropertiesResponse } from '../../../../../utils/django_interfaces'
import { GeneAndGEMSection } from './GeneAndGEMSection'
import { ChartSection } from './ChartSection'
import { Nullable } from '../../../../../utils/interfaces'
import { GeneGEMDataErrorMessage } from '../GeneGEMDataErrorMessage'

/**
 * Component's props
 */
interface StatisticalPropertiesPanelProps {
    statisticalProperties: Nullable<SourceDataStatisticalPropertiesResponse>,
    selectedRow: Nullable<DjangoMRNAxGEMResultRow>,
    /** To check if needs to show density chart */
    gemDataIsOrdinal: boolean
}

/**
 * Renders a Scatter Chart with a fitness line to show the correlation between
 * a gene and a GEM
 * @param props Component's props
 * @returns Component
 */
export const StatisticalPropertiesPanel = (props: StatisticalPropertiesPanelProps) => {
    const [showBars, setShowBars] = useState(true)
    const [showTogether, setShowTogether] = useState(false)

    const stats = props.statisticalProperties

    if (!stats) {
        return null
    }

    // Error message
    if (!stats.is_data_ok) {
        return (
            <GeneGEMDataErrorMessage />
        )
    }

    return (
        <React.Fragment>
            <Segment>
                <Grid padded>
                    <Grid.Row columns='equal' divided>
                        {/* Control panel */}
                        <Grid.Column width={1} textAlign='center'>
                            {/* Show BarCharts */}
                            <Button
                                icon
                                circular
                                title={showBars ? 'Show area only' : 'Show bars'}
                                color={showBars ? 'red' : 'blue'}
                                onClick={() => setShowBars(!showBars)}
                            >
                                <Icon name={showBars ? 'chart area' : 'chart bar'} />
                            </Button>

                            {/* Show both Gene and GEM data in one chart */}
                            <Button
                                icon
                                circular
                                className='margin-top-5'
                                title={showTogether ? 'Show separated' : 'Show together'}
                                color={showTogether ? 'red' : 'blue'}
                                onClick={() => setShowTogether(!showTogether)}
                            >
                                <Icon name={showTogether ? 'arrows alternate horizontal' : 'compress'} />
                            </Button>
                        </Grid.Column>
                        <ChartSection
                            selectedRow={props.selectedRow}
                            stats={stats}
                            showBars={showBars}
                            showTogether={showTogether}
                            gemDataIsOrdinal={props.gemDataIsOrdinal}
                        />

                    </Grid.Row>
                </Grid>
            </Segment>

            {/* Both Gene and GEM data */}
            <Segment>
                <GeneAndGEMSection
                    selectedRow={props.selectedRow}
                    numberOfSamplesEvaluated={stats.number_of_samples_evaluated}
                    heteroscedasticityBreuschPagan={stats.heteroscedasticity_breusch_pagan}
                    homoscedasticityGoldfeldQuandt={stats.homoscedasticity_goldfeld_quandt}
                    linearity={stats.linearity}
                    monotonicity={stats.monotonicity}
                />
            </Segment>
        </React.Fragment>
    )
}
