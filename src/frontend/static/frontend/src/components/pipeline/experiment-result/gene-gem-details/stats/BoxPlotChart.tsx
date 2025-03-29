import React, { Fragment, useMemo } from 'react'
import { BoxPlot } from '@visx/stats'
import { scaleBand, scaleLinear } from '@visx/scale'
import { withTooltip, Tooltip, defaultStyles as defaultTooltipStyles } from '@visx/tooltip'
import { WithTooltipProvidedProps } from '@visx/tooltip/lib/enhancers/withTooltip'
import { StatChartDataWithOutliers } from '../../../../../utils/interfaces'
import { BoxplotDatum, mean, quantile } from '../../../../common/boxplots/BoxplotsCommons'

interface TooltipData extends BoxplotDatum {
    x: string,
}

/** BoxPlotChart props. */
type BoxPlotChartProps = {
    width: number;
    dataObjects: StatChartDataWithOutliers[],
    /** If the chart is horizontal. Default `true`. */
    // horizontal?: boolean // TODO: implement
}

/**
 * BoxPlotChart component.
 */
const BoxPlotChart = withTooltip<BoxPlotChartProps, TooltipData>(
    ({
        width,
        tooltipOpen,
        tooltipLeft,
        tooltipTop,
        tooltipData,
        showTooltip,
        hideTooltip,
        dataObjects
    }: BoxPlotChartProps & WithTooltipProvidedProps<TooltipData>) => {
        const height = 500

        /**
         Create array object with map structure for multiple graphs
         */
        const newData = useMemo(() => {
            const newData = dataObjects.map(dataObj => {
                const dataArray = dataObj.data
                // Data for Tooltip
                const min2: number = Number(Math.min(...dataArray).toFixed(3))
                const max2: number = Number(Math.max(...dataArray).toFixed(3))
                const firstQuantile = Number(quantile(dataArray, 0.25).toFixed(3))
                const thirdQuantile = Number(quantile(dataArray, 0.75).toFixed(3))
                const median2 = Number(quantile(dataArray, 0.50).toFixed(3))
                const meanValue = Number(mean(dataArray).toFixed(3))

                // Set min2 to number
                const datum: TooltipData = {
                    min: min2,
                    max: max2,
                    median: median2,
                    mean: meanValue,
                    firstQuartile: firstQuantile,
                    thirdQuartile: thirdQuantile,
                    outliers: dataObj.outliers.map((outlier) => outlier.expression),
                    outliersObjects: dataObj.outliers.sort((a, b) => a.expression - b.expression),
                    x: dataObj.x as string
                }
                const newDataItem = {
                    height: dataObj.height,
                    binData: [],
                    boxPlot: datum,
                    strokeColor: dataObj.strokeColor,
                    fillColor: dataObj.fillColor
                }
                return newDataItem
            })
            return newData
        }, [])

        // bounds
        const xMax = width - 20
        const yMax = height - 120

        // scales
        const values = newData.reduce<number[]>((allValues, { boxPlot }) => {
            allValues.push(boxPlot.min, boxPlot.max)
            return allValues
        }, [])

        const minYValue = Math.min(...values)
        const maxYValue = Math.max(...values)

        const yScale = scaleBand<string>({
            range: [0, yMax],
            round: true,
            domain: newData.map(item => item.boxPlot.x)
        })
        const xScale = scaleLinear<number>({
            range: [0, xMax],
            round: true,
            domain: [minYValue, maxYValue]
        })
        const boxWidth = yScale.bandwidth()
        const constrainedWidth = Math.min(40, boxWidth)

        return (
            <>
                {newData.map((d, i) => {
                    return (
                        <div key={i} style={{ position: 'relative' }}>
                            <svg width={width - 100} height={d.height}>
                                <BoxPlot
                                    min={d.boxPlot.min}
                                    max={d.boxPlot.max}
                                    horizontal
                                    firstQuartile={d.boxPlot.firstQuartile}
                                    thirdQuartile={d.boxPlot.thirdQuartile}
                                    median={d.boxPlot.median}
                                    boxWidth={constrainedWidth * 0.4}
                                    fill={d.fillColor}
                                    fillOpacity={0.3}
                                    stroke={d.strokeColor}
                                    strokeWidth={1}
                                    valueScale={xScale}
                                    outliers={d.boxPlot.outliers}
                                    outlierProps={{
                                        onMouseOver: () => {
                                            showTooltip({
                                                tooltipLeft: xScale(d.boxPlot.min) ?? 0 + 40,
                                                tooltipTop: yScale(d.boxPlot.x)! + constrainedWidth + 20,
                                                tooltipData: { ...d.boxPlot }
                                            })
                                        },
                                        onMouseLeave: () => {
                                            hideTooltip()
                                        }
                                    }}
                                    minProps={{
                                        onMouseOver: () => {
                                            showTooltip({
                                                tooltipLeft: xScale(d.boxPlot.min) ?? 0 + 40,
                                                tooltipTop: yScale(d.boxPlot.x)! + constrainedWidth + 20,
                                                tooltipData: { ...d.boxPlot }
                                            })
                                        },
                                        onMouseLeave: () => {
                                            hideTooltip()
                                        }
                                    }}
                                    maxProps={{
                                        onMouseOver: () => {
                                            showTooltip({
                                                tooltipLeft: xScale(d.boxPlot.min) ?? 0 + 40,
                                                tooltipTop: yScale(d.boxPlot.x)! + constrainedWidth + 20,
                                                tooltipData: { ...d.boxPlot }
                                            })
                                        },
                                        onMouseLeave: () => {
                                            hideTooltip()
                                        }
                                    }}
                                    boxProps={{
                                        onMouseOver: () => {
                                            showTooltip({
                                                tooltipLeft: xScale(d.boxPlot.min) ?? 0 + 80,
                                                tooltipTop: yScale(d.boxPlot.x)! + constrainedWidth + 20,
                                                tooltipData: { ...d.boxPlot }
                                            })
                                        },
                                        onMouseLeave: () => {
                                            hideTooltip()
                                        }
                                    }}
                                    medianProps={{
                                        style: {
                                            stroke: 'white'
                                        },
                                        onMouseOver: () => {
                                            showTooltip({
                                                tooltipLeft: xScale(d.boxPlot.min) ?? 0 + 40,
                                                tooltipTop: yScale(d.boxPlot.x)! + constrainedWidth + 20,
                                                tooltipData: { ...d.boxPlot }
                                            })
                                        },
                                        onMouseLeave: () => {
                                            hideTooltip()
                                        }
                                    }}
                                />
                            </svg>
                        </div>
                    )
                })}

                {tooltipOpen && tooltipData && (
                    <Tooltip
                        top={tooltipTop}
                        left={tooltipLeft}
                        style={{ ...defaultTooltipStyles, backgroundColor: '#283238', color: 'white', zIndex: 100 }}
                    >
                        <div>
                            <strong>{tooltipData.x}</strong>
                        </div>
                        <div style={{ marginTop: '5px', fontSize: '12px' }}>
                            {tooltipData.min && <div>Min: {tooltipData.min}</div>}
                            {tooltipData.firstQuartile && <div>First quartile: {tooltipData.firstQuartile}</div>}
                            {tooltipData.median && <div>Median: {tooltipData.median}</div>}
                            {tooltipData.thirdQuartile && <div>Third quartile: {tooltipData.thirdQuartile}</div>}
                            {tooltipData.max && <div>Max: {tooltipData.max}</div>}
                        </div>
                        {(tooltipData.outliersObjects && tooltipData.outliersObjects.length > 0) &&
                            <div>
                                <strong>Outliers</strong>
                                <div>
                                    {tooltipData.outliersObjects.map(outlier => (
                                        <span key={outlier.sample_identifier}>
                                            {outlier.sample_identifier}: {outlier.expression}{tooltipData.outliersObjects[tooltipData.outliersObjects.length - 1].sample_identifier !== outlier.sample_identifier ? ' - ' : ''}
                                        </span>
                                    ))}
                                </div>
                            </div>}
                    </Tooltip>
                )}
            </>
        )
    })

export {
    BoxPlotChart
}
