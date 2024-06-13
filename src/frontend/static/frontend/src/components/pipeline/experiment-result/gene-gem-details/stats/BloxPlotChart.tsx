import React, { Fragment, useMemo } from 'react'
import { /* ViolinPlot, */ BoxPlot } from '@visx/stats'
import { scaleBand, scaleLinear } from '@visx/scale'
import { withTooltip, Tooltip, defaultStyles as defaultTooltipStyles } from '@visx/tooltip'
import { WithTooltipProvidedProps } from '@visx/tooltip/lib/enhancers/withTooltip'
import { StatChartDataWithOutliers } from '../../../../../utils/interfaces'
import { BoxplotDatum, mean, quantile } from '../../../../common/boxplots/BoxplotsCommons'

export type StatsPlotProps = {
    width: number;
    dataObjects: StatChartDataWithOutliers[]
};
interface TooltipData extends BoxplotDatum {
    x: string,
}
export default withTooltip<StatsPlotProps, TooltipData>(
    ({
        width,
        tooltipOpen,
        tooltipLeft,
        tooltipTop,
        tooltipData,
        showTooltip,
        hideTooltip,
        dataObjects
    }: StatsPlotProps & WithTooltipProvidedProps<TooltipData>) => {
        const height = 500
        const newData = useMemo(() => {
            /**
             Create array object with map structure for multiple graphs
             */
            const newData = dataObjects.map(dataObj => {
                const dataArray = dataObj.data
                // Data for Tooltip
                const min2 = Math.min.apply(Math, dataArray).toFixed(3)
                const max2 = Math.max.apply(Math, dataArray).toFixed(3)
                const firstQuantile = Number(quantile(dataArray, 0.25).toFixed(3))
                const thirdQuantile = Number(quantile(dataArray, 0.75).toFixed(3))
                const median2 = Number(quantile(dataArray, 0.50).toFixed(3))
                const meanValue = Number(mean(dataArray).toFixed(3))

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
                    height: dataObj.height as number,
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
        const values = newData.reduce((allValues, { boxPlot }) => {
            allValues.push(boxPlot.min, boxPlot.max)
            return allValues
        }, [] as number[])
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
                {newData.map((d, i) => (
                    <div key={i} style={{ position: 'relative' }}>
                        <svg width={width - 100} height={d.height}>
                            {/*                             <rect x={0} y={0} width={width} height={height} fill="url(#statsplot)" rx={14} /> Todo: check ViolinPlot
 */}
                            {/*  <ViolinPlot
                                data={d.binData}
                                stroke={d.strokeColor}
                                left={xScale(d.boxPlot.x)!}
                                width={constrainedWidth}
                                valueScale={yScale}
                                fill="url(#hViolinLines)"
                            /> */}
                            <BoxPlot
                                min={d.boxPlot.min}
                                max={d.boxPlot.max}
                                horizontal={true}
                                firstQuartile={d.boxPlot.firstQuartile}
                                thirdQuartile={d.boxPlot.thirdQuartile}
                                median={d.boxPlot.median}
                                boxWidth={constrainedWidth * 0.4}
                                fill={d.fillColor}
                                fillOpacity={0.3}
                                stroke={d.strokeColor}
                                strokeWidth={2}
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

                ))}
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
                            {tooltipData.max && <div>max: {tooltipData.max}</div>}
                            {tooltipData.thirdQuartile && <div>third quartile: {tooltipData.thirdQuartile}</div>}
                            {tooltipData.median && <div>median: {tooltipData.median}</div>}
                            {tooltipData.firstQuartile && <div>first quartile: {tooltipData.firstQuartile}</div>}
                            {tooltipData.min && <div>min: {tooltipData.min}</div>}
                        </div>
                        <div>
                            <strong>Outliers</strong>
                            {tooltipData.outliersObjects &&
                                <div>{tooltipData.outliersObjects.map(outlier => (
                                    <Fragment key={outlier.sample_identifier}>
                                        {outlier.sample_identifier}: {outlier.expression}{tooltipData.outliersObjects[tooltipData.outliersObjects.length - 1].sample_identifier !== outlier.sample_identifier ? ' - ' : ''}
                                    </Fragment>
                                ))}
                                </div>}
                        </div>
                    </Tooltip>
                )}
            </>
        )
    })
