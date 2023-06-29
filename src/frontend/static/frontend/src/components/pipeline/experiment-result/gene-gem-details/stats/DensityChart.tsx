import React from 'react'
import { Histogram, DensitySeries, BarSeries, withParentSize, XAxis, YAxis } from '@data-ui/histogram'
import { BinData, DataUICategoricalBinnedDatumShape, Nullable, StatChartData } from '../../../../../utils/interfaces'
import { generateBinData } from '../../../../../utils/util_functions'

/**
 * Renders a responsive Histogram for the Density chart
 */
const ResponsiveHistogram = withParentSize(({ parentWidth, parentHeight, ...rest }) => (
    <Histogram
        width={parentWidth}
        height={parentHeight}
        {...rest}
    />
))

/**
 * Component's props
 */
interface DensityChartProps {
    dataObjects: StatChartData[],
    /** True to show bars in density chart */
    showBars: boolean,
    /**
     * True to show density chart.
     * Must have the same length that dataObjects or density chart will be ignored
     */
    showDensityChart: boolean[],
    /** To check if needs to reduce number of bins to an ordinal number */
    xAxisIsOrdinal: boolean
}

/**
 * Renders a Density chart
 * @param props Component's props
 * @returns Component
 */
export const DensityChart = (props: DensityChartProps) => {
    const allDensityChartsAreHidden = props.showDensityChart.every((booleanValue) => !booleanValue)
    if (!props.showBars && allDensityChartsAreHidden) {
        return null
    }

    // Draws only visible Density charts
    const filteredDensity = props.dataObjects.filter((_, idx) => props.showDensityChart[idx])

    return (
        <div style={{ height: 400 }}>
            <ResponsiveHistogram
                ariaLabel='Density chart'
                orientation="vertical"
                cumulative={false}
                normalized
                binType={props.xAxisIsOrdinal ? 'categorical' : 'numeric'}
                binCount={25}
                valueAccessor={datum => datum}
                renderTooltip={({ datum, color }) => {
                    const label = props.xAxisIsOrdinal ? datum.bin : `${datum.bin0} to ${datum.bin1}`
                    return (
                        <div>
                            <strong style={{ color }}>{label}</strong>
                            <div className='align-left'><strong>Count </strong>{datum.count}</div>
                            <div className='align-left'><strong>Cumulative </strong>{datum.cumulative}</div>
                            {!props.xAxisIsOrdinal &&
                                <div className='align-left'><strong>Density </strong>{datum.density.toFixed(3)}</div>
                            }
                        </div>
                    )
                }}
            >
                {/* Bar series */}
                {props.showBars && props.dataObjects.map((dataObj, idx) => {
                    let rawData, binnedData: Nullable<DataUICategoricalBinnedDatumShape[]>
                    if (props.xAxisIsOrdinal) {
                        const binData: BinData[] = generateBinData(dataObj.data)
                        const isOrdinalAndCGDSData = binData.length === 5
                        const binDataFormatted: DataUICategoricalBinnedDatumShape[] = binData.map((bin) => {
                            // FIXME: there's a problem with Data UI Axis: it sorts automatically the ticks labels
                            // So it's adding a whitespace between '-' and '2' to prevent automatic sorting to leave
                            // the -1 before the -2
                            const stringValue = bin.value.toString()
                            const binValue = !isOrdinalAndCGDSData || stringValue !== '-2'
                                ? stringValue
                                : `${stringValue[0]} ${stringValue[1]}`
                            return {
                                id: binValue,
                                bin: binValue,
                                count: bin.count
                            }
                        })
                        // FIXME: there's a problem with Data UI Axis: it sorts automatically the ticks labels
                        // so this block below is useless, if in some moment it's fixed, uncomment this and remove
                        // patch of above
                        // const binDataSorted = binDataFormatted.sort((dataObj1, dataObj2) => {
                        //     const x1 = parseInt(dataObj1.id)
                        //     const x2 = parseInt(dataObj2.id)
                        //     return x1 - x2
                        // })

                        rawData = null
                        binnedData = binDataFormatted
                    } else {
                        rawData = dataObj.data
                        binnedData = null
                    }

                    return (
                        <BarSeries
                            key={idx}
                            animated
                            fill={dataObj.fillColor}
                            stroke={dataObj.strokeColor}
                            rawData={rawData}
                            binnedData={binnedData}
                        />
                    )
                })}

                {/* Density series */}
                {filteredDensity.map((dataObj, idx) => (
                    <DensitySeries
                        key={idx}
                        animated
                        fill={dataObj.fillColor}
                        stroke={dataObj.strokeColor}
                        strokeWidth={3}
                        rawData={dataObj.data}
                    />
                ))}
                <XAxis label='Expression'/>
                <YAxis label="Density"/>
            </ResponsiveHistogram>
        </div>
    )
}
