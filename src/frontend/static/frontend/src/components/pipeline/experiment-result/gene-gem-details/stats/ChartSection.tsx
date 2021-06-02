import React from 'react'
import { Divider, Grid, Header, Segment, Statistic } from 'semantic-ui-react'
import { DjangoMRNAxGEMResultRow, SourceDataStatisticalPropertiesResponse, DjangoNormalityTest, DjangoSourceDataOutliersBasic } from '../../../../../utils/django_interfaces'
import { Nullable } from '../../../../../utils/interfaces'
import { getGeneAndGEMFromSelectedRow } from '../../../../../utils/util_functions'
import { InfoPopup } from '../InfoPopup'
import { BoxPlotChart } from './BoxPlotChart'
import { DensityChart } from './DensityChart'

/**
 * Renders some Stats
 * @param props Component's props
 * @returns Component
 */
const MeanAndStdStats = (props: { mean: number; standardDeviation: number; }) => {
    const log2 = Math.log2(props.mean)
    const log2Display = isNaN(log2) ? '-' : log2.toFixed(3)

    return (
        <React.Fragment>
            <Statistic size='small'>
                <Statistic.Value>{props.mean}</Statistic.Value>
                <Statistic.Label>Average</Statistic.Label>
            </Statistic>
            <Statistic size='small'>
                <Statistic.Value>{log2Display}</Statistic.Value>
                <Statistic.Label>Average (Log2)</Statistic.Label>
            </Statistic>
            <Statistic size='small'>
                <Statistic.Value>{props.standardDeviation}</Statistic.Value>
                <Statistic.Label>Standard deviation</Statistic.Label>
            </Statistic>
        </React.Fragment>
    )
}

/**
 * Component's props
 */
interface NormalityStatsProps {
    geneOrGem: string,
    normality: DjangoNormalityTest
}

/**
 * Renders Stats with Shapiro Normality test info
 * @param props Component's props
 * @returns Component
 */
const NormalityStats = (props: NormalityStatsProps) => (
    <React.Fragment>
        <InfoPopup content={`It tests if the ${props.geneOrGem} vector follows a normal distribution`} />

        <Statistic size='tiny'>
            <Statistic.Value>{props.normality.statistic}</Statistic.Value>
            <Statistic.Label>Shapiro test</Statistic.Label>
        </Statistic>
        <Statistic size='tiny'>
            <Statistic.Value>{props.normality.p_value}</Statistic.Value>
            <Statistic.Label>P-Value</Statistic.Label>
        </Statistic>
    </React.Fragment>
)

/**
 * StatsSection's props
 */
interface StatsSectionProps {
    title: string,
    mean: number,
    standardDeviation: number,
    allData: number[],
    outliers: DjangoSourceDataOutliersBasic[],
    normality: DjangoNormalityTest,
    showBars: boolean,
    titleColor?: string,
    densityColor?: string,
    strokeColor?: string,
    /** To check if needs to show density chart */
    dataIsOrdinal: boolean
}

/**
 * Renders a section with all the data
 * @param props Component's props
 * @returns Component
 */
const StatsSection = (props: StatsSectionProps) => (
    <React.Fragment>
        <Header className='stats-header' dividing style={{ color: props.titleColor }}>{props.title}</Header>
        <MeanAndStdStats mean={props.mean} standardDeviation={props.standardDeviation} />

        <Divider />

        <Grid.Row>
            <Grid.Column width={12} className='stats-column'>
                <NormalityStats geneOrGem={props.title} normality={props.normality} />
            </Grid.Column>
        </Grid.Row>

        <DensityChart
            dataObjects={[{
                data: props.allData,
                fillColor: props.densityColor,
                strokeColor: props.strokeColor
            }]}
            xAxisIsOrdinal={props.dataIsOrdinal}
            showBars={props.showBars}
            showDensityChart={[!props.dataIsOrdinal]}
        />

        <BoxPlotChart
            boxplotKey='correlation-boxplot'
            dataObjects={[{
                data: props.allData,
                outliers: props.outliers,
                fillColor: props.densityColor,
                strokeColor: props.strokeColor
            }]}
        />
    </React.Fragment>
)

/**
 * ChartSection's props
 */
interface ChartSectionProps {
    selectedRow: Nullable<DjangoMRNAxGEMResultRow>,
    stats: SourceDataStatisticalPropertiesResponse,
    showBars: boolean,
    showTogether: boolean,
    /** To check if needs to show density chart */
    gemDataIsOrdinal: boolean
}

/**
 * Renders Gene and GEM Density charts and some extra stats
 * @param props Component's props
 * @returns Component
 */
export const ChartSection = (props: ChartSectionProps) => {
    const [gene, gem] = getGeneAndGEMFromSelectedRow(props.selectedRow)

    // Some color stuff
    const geneStrokeColor = '#1e72b1'
    const gemDensityColor = '#ffc400'
    const gemStrokeColor = '#a97f00'

    if (!props.showTogether) {
        return (
            <React.Fragment>
                {/* Gene stats */}
                <Grid.Column textAlign='center'>
                    <StatsSection
                        title={gene}
                        mean={props.stats.gene_mean}
                        standardDeviation={props.stats.gene_standard_deviation}
                        allData={props.stats.gene_data}
                        outliers={props.stats.gene_outliers}
                        normality={props.stats.gene_normality}
                        showBars={props.showBars}
                        titleColor={geneStrokeColor}
                        strokeColor={geneStrokeColor}
                        dataIsOrdinal={false}
                    />
                </Grid.Column>

                {/* GEM stats */}
                <Grid.Column textAlign='center'>
                    <StatsSection
                        title={gem}
                        mean={props.stats.gem_mean}
                        standardDeviation={props.stats.gem_standard_deviation}
                        allData={props.stats.gem_data}
                        outliers={props.stats.gem_outliers}
                        normality={props.stats.gem_normality}
                        showBars={props.showBars}
                        titleColor={gemStrokeColor}
                        densityColor={gemDensityColor}
                        strokeColor={gemStrokeColor}
                        dataIsOrdinal={props.gemDataIsOrdinal}
                    />
                </Grid.Column>
            </React.Fragment>
        )
    }

    // In case we need to show both Gene and GEM charts in the same place...
    return (
        <Grid.Column textAlign='center'>
            <Header className='stats-header' dividing>
                <span style={{ color: geneStrokeColor }}>
                    {gene}
                </span> x <span style={{ color: gemStrokeColor }}>
                    {gem}
                </span>
            </Header>

            <Grid>
                <Grid.Row columns={2}>
                    <Grid.Column textAlign='center'>
                        <Segment>
                            <Header dividing>{gene}</Header>
                            <MeanAndStdStats mean={props.stats.gene_mean} standardDeviation={props.stats.gene_standard_deviation} />
                        </Segment>
                    </Grid.Column>
                    <Grid.Column textAlign='center'>
                        <Segment>
                            <Header dividing>{gem}</Header>
                            <MeanAndStdStats mean={props.stats.gem_mean} standardDeviation={props.stats.gem_standard_deviation} />
                        </Segment>
                    </Grid.Column>
                </Grid.Row>

                <Grid.Row columns={2} divided>
                    <Grid.Column textAlign='center'>
                        <NormalityStats geneOrGem={gene} normality={props.stats.gene_normality} />
                    </Grid.Column>

                    <Grid.Column textAlign='center'>
                        <NormalityStats geneOrGem={gem} normality={props.stats.gem_normality} />
                    </Grid.Column>

                </Grid.Row>
            </Grid>

            <DensityChart
                dataObjects={[
                    {
                        data: props.stats.gene_data,
                        strokeColor: geneStrokeColor
                    },
                    {
                        data: props.stats.gem_data,
                        fillColor: gemDensityColor,
                        strokeColor: gemStrokeColor
                    }
                ]}
                xAxisIsOrdinal={false}
                showBars={props.showBars}
                showDensityChart={[true, !props.gemDataIsOrdinal]}
            />

            <BoxPlotChart
                boxplotKey='boxplot-gene-gem'
                dataObjects={[
                    {
                        data: props.stats.gene_data,
                        outliers: props.stats.gene_outliers,
                        strokeColor: geneStrokeColor
                    },
                    {
                        data: props.stats.gem_data,
                        outliers: props.stats.gem_outliers,
                        fillColor: gemDensityColor,
                        strokeColor: gemStrokeColor
                    }
                ]}
            />
        </Grid.Column>
    )
}
