import React from 'react'
import { BoxPlotSeries, XAxis } from '@data-ui/xy-chart'
import { StatChartDataWithOutliers } from '../../../../../utils/interfaces'
import { quantile, renderBoxPlotTooltip, ResponsiveXYChart, BoxplotDatum, mean } from '../../../../common/boxplots/BoxplotsCommons'

/**
 * Component's props
 */
interface BoxPlotChartProps {
    boxplotKey: string,
    dataObjects: StatChartDataWithOutliers[]
}

/**
 * Render BoxPlot charts
 * @param props Component's props
 * @returns Component
 */
export const BoxPlotChart = (props: BoxPlotChartProps) => {
    const boxPlots = props.dataObjects.map((dataObj, idx) => {
        const dataArray = dataObj.data

        // Data for Tooltip
        const min = Math.min.apply(Math, dataArray)
        const max = Math.max.apply(Math, dataArray)
        const firstQuantile = quantile(dataArray, 0.25)
        const thirdQuantile = quantile(dataArray, 0.75)
        const median = quantile(dataArray, 0.50)
        const meanValue = mean(dataArray)

        const data: BoxplotDatum = {
            min: min,
            max: max,
            median: median,
            mean: meanValue,
            firstQuartile: firstQuantile,
            thirdQuartile: thirdQuantile,
            outliers: dataObj.outliers.map((outlier) => outlier.expression),
            outliersObjects: dataObj.outliers.sort((a, b) => a.expression - b.expression)
        }

        return (
            <BoxPlotSeries
                key={idx}
                data={[data]}
                fill={dataObj.fillColor}
                stroke={dataObj.strokeColor}
                strokeWidth={2}
                horizontal
            />
        )
    })

    // Computes some attributes
    const allBoxPlotExpressions = props.dataObjects.flatMap(dataObj => dataObj.data)
    const allBoxPlotOutliers = props.dataObjects.flatMap(dataObj => dataObj.outliers.map((outlier) => outlier.expression))
    const allBoxPlotValues = allBoxPlotExpressions.concat(allBoxPlotOutliers)

    const minBoxPlotValue = Math.min.apply(Math, allBoxPlotValues)
    const maxBoxPlotValue = Math.max.apply(Math, allBoxPlotValues)
    const valueDomain = [
        minBoxPlotValue - 0.3 * Math.abs(minBoxPlotValue),
        maxBoxPlotValue + 0.3 * Math.abs(maxBoxPlotValue)
    ]

    // If there's only one element renders a tighter chart
    const charHeight = props.dataObjects.length === 1 ? 200 : 400

    return (
        <div style={{ height: charHeight }}>
            <ResponsiveXYChart
                key={props.boxplotKey}
                ariaLabel="Boxplot example"
                xScale={{
                    type: 'linear',
                    domain: valueDomain
                }}
                yScale={{
                    type: 'band',
                    paddingInner: 0.15,
                    paddingOuter: 0.3
                }}
                renderTooltip={renderBoxPlotTooltip}
                margin={{ right: 80, left: 16, top: 16 }}
                showYGrid
            >
                {boxPlots}
                <XAxis numTicks={4} />
            </ResponsiveXYChart>
        </div>
    )
}
