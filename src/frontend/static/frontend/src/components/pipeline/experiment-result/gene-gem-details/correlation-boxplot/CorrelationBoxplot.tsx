import React, { useState } from 'react'
import { BoxPlotSeries, ViolinPlotSeries, XAxis, YAxis, PatternLines } from '@data-ui/xy-chart'
import { Nullable } from '../../../../../utils/interfaces'
import { BoxplotDatum, boxPlotThemeColors, mean, quantile, renderBoxPlotTooltip, ResponsiveXYChart } from '../../../../common/boxplots/BoxplotsCommons'
import { DjangoMRNAxGEMResultRow } from '../../../../../utils/django_interfaces'
import { generateBinData, getGeneAndGEMFromSelectedRow } from '../../../../../utils/util_functions'
import { Checkbox, Grid } from 'semantic-ui-react'
import isEqual from 'lodash/isEqual'
import { CorrelationBoxplotData } from '../GeneGemDetailsModal'
import { GeneGEMDataErrorMessage } from '../GeneGEMDataErrorMessage'

const DOMAIN_MARGIN: number = 2

/**
 * Component's props
 */
interface CorrelationBoxplotProps {
    boxplotData: CorrelationBoxplotData,
    selectedRow: Nullable<DjangoMRNAxGEMResultRow>
}

/**
 * Render BoxPlot charts
 * @param props Component's props
 * @returns Component
 */
export const CorrelationBoxplot = (props: CorrelationBoxplotProps) => {
    const [showViolinPlots, setShowViolinPlots] = useState(true)
    const [showBoxPlots, setShowBoxPlots] = useState(true)

    if (!props.boxplotData) {
        return null
    }

    // Error message
    if (!props.boxplotData.isDataOk) {
        return (
            <GeneGEMDataErrorMessage/>
        )
    }

    /**
     * Generates a description for the specific CNA value. Only valid for cBioPortal format (values -2, -1, 0, 1, 2)
     * @param cnaValue CNA value to check
     * @returns CNA description for that specific value
     */
    function getCNADescription (cnaValue: string): string {
        switch (cnaValue) {
            case '-2':
                return '-2 or Deep Deletion indicates a deep loss, possibly a homozygous deletion'
            case '-1':
                return '-1 or Shallow Deletion indicates a shallow loss, possibly a heterozygous deletion'
            case '0':
                return '0 is diploid'
            case '1':
                return '1 or Gain indicates a low-level gain (a few additional copies, often broad)'
            case '2':
                return '2 or Amplification indicate a high-level amplification (more copies, often focal)'
            default:
                // This should never be reached
                return ''
        }
    }

    const [gene, gem] = getGeneAndGEMFromSelectedRow(props.selectedRow)

    // Sorts by key to make and order in X axis
    const sortedData = props.boxplotData.data.sort((dataObj1, dataObj2) => {
        const x1 = parseInt(dataObj1.x as string)
        const x2 = parseInt(dataObj2.x as string)
        return x1 - x2
    })

    // To put a description for CNA values
    const onlyGEMValues = sortedData.map((dataObj) => dataObj.x)
    const isCBioPortalCNAData = isEqual(onlyGEMValues, ['-2', '-1', '0', '1', '2'])

    const boxPlots = !showBoxPlots
        ? null
        : sortedData.map((dataObj) => {
            const dataArray = dataObj.data

            // Data
            const min = Math.min.apply(Math, dataArray)
            const max = Math.max.apply(Math, dataArray)
            const firstQuantile = quantile(dataArray, 0.25)
            const thirdQuantile = quantile(dataArray, 0.75)
            const median = quantile(dataArray, 0.50)
            const meanValue = mean(dataArray)

            const data: BoxplotDatum = {
                x: dataObj.x,
                min,
                max,
                median,
                mean: meanValue,
                firstQuartile: firstQuantile,
                thirdQuartile: thirdQuantile,
                // outliers: dataObj.outliers.map((outlier) => outlier.expression),
                outliers: [],
                // outliersObjects: dataObj.outliers.sort((a, b) => a.expression - b.expression)
                outliersObjects: []
            }

            if (isCBioPortalCNAData) {
                data.cnaDescription = getCNADescription(dataObj.x as string)
            }

            return (
                <BoxPlotSeries
                    key={`boxplot-${dataObj.x}`}
                    data={[data]}
                    fill="url(#boxplot_lines_pattern)"
                    stroke={dataObj.strokeColor}
                    strokeWidth={2}
                    widthRatio={1}
                    horizontal={false}
                />
            )
        })

    const violinPlots = !showViolinPlots
        ? null
        : sortedData.map((dataObj) => {
        // Formats data for Violin plot: it needs the frequency data for expression values.
            const binData = generateBinData(dataObj.data)
            const violinData = { x: dataObj.x, binData }

            return (
                <ViolinPlotSeries
                    key={`violin-${dataObj.x}`}
                    data={[violinData]}
                    fill="url(#box_violin_lines_pattern)"
                    stroke="#22b8cf"
                    strokeWidth={2}
                    widthRatio={1}
                    horizontal={false}
                    disableMouseEvents
                />
            )
        })

    // Computes some attributes
    const allBoxPlotExpressions = props.boxplotData.data.flatMap(dataObj => dataObj.data)
    // const allBoxPlotOutliers = props.dataObjects.flatMap(dataObj => dataObj.outliers.map((outlier) => outlier.expression))
    const allBoxPlotOutliers = []
    const allBoxPlotValues = allBoxPlotExpressions.concat(allBoxPlotOutliers)

    const minBoxPlotValue = Math.min.apply(Math, allBoxPlotValues)
    const maxBoxPlotValue = Math.max.apply(Math, allBoxPlotValues)
    const valueDomain = [
        minBoxPlotValue - DOMAIN_MARGIN,
        maxBoxPlotValue + DOMAIN_MARGIN
    ]

    const boxPlotBandScaleConfig = {
        type: 'band',
        paddingInner: 0.15,
        paddingOuter: 0.3
    }
    const boxPlotValueScaleConfig = {
        type: 'linear',
        domain: valueDomain
    }

    return (
        <React.Fragment>
            <Grid>
                <Grid.Row columns={1}>
                    <Grid.Column>
                        <Checkbox
                            label='Show ViolinPlots'
                            checked={showViolinPlots}
                            onChange={() => setShowViolinPlots(!showViolinPlots)}
                        />
                        <Checkbox
                            label='Show Boxplots'
                            className='margin-left-2'
                            checked={showBoxPlots}
                            onChange={() => setShowBoxPlots(!showBoxPlots)}
                        />
                    </Grid.Column>
                </Grid.Row>

                <Grid.Row centered columns={1}>
                    <Grid.Column width={10}>
                        <div style={{ height: 500 }}>
                            <ResponsiveXYChart
                                key="boxplot_chart"
                                ariaLabel="Correlation Boxplot"
                                xScale={boxPlotBandScaleConfig}
                                yScale={boxPlotValueScaleConfig}
                                renderTooltip={renderBoxPlotTooltip}
                                margin={{ right: 16, left: 80, top: 16 }}
                                showYGrid
                            >
                                <PatternLines
                                    id="box_violin_lines_pattern"
                                    height={4}
                                    width={4}
                                    stroke="#1e72b1"
                                    strokeWidth={1}
                                    background="rgba(0,0,100,0.2)"
                                    orientation={['diagonal']}
                                />

                                {violinPlots}

                                <PatternLines
                                    id="boxplot_lines_pattern"
                                    height={4}
                                    width={4}
                                    stroke={boxPlotThemeColors.categories[5]}
                                    strokeWidth={1}
                                    orientation={['diagonal']}
                                />

                                {boxPlots}
                                <XAxis label={`${gene} CNA`} />
                                <YAxis label={`${gem} expression`} numTicks={10} orientation="left" />
                            </ResponsiveXYChart>
                        </div>
                    </Grid.Column>
                </Grid.Row>
            </Grid>
        </React.Fragment>
    )
}
