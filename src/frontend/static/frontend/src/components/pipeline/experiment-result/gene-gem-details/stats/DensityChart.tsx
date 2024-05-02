import React, { useMemo } from 'react'
import { Histogram, DensitySeries, BarSeries, withParentSize, XAxis, YAxis } from '@data-ui/histogram'
import { BinData, DataUICategoricalBinnedDatumShape, Nullable, StatChartData } from '../../../../../utils/interfaces'
import { generateBinData } from '../../../../../utils/util_functions'
import {
    ComposedChart,
    Area,
    Bar,
    XAxis as XAxis2,
    YAxis as YAxis2,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts'
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
 * Object to render in chart
 */
interface ChartData {
    /** Color for tooltip title column */
    color: string | undefined,
    /** Start measure range */
    bin0: number,
    /** End measure range */
    bin1: number,
    /** Count of measure items */
    count: number,
    /** Acumulative of total of measure items */
    cumulative: number,
    /** Acumulative of total density of measure items */
    cumulativeDensity: number,
    /** Data of measure */
    data: number[],
    /** Density of the item */
    density: number,
    /** id for render, it generate by count of items, it cant be reapeated */
    id: number,
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
                {filteredDensity.map((dataObj, idx) => {
                    return (
                        <DensitySeries
                            key={idx}
                            animated
                            fill={dataObj.fillColor}
                            stroke={dataObj.strokeColor}
                            strokeWidth={3}
                            rawData={dataObj.data}
                        />
                    )
                })}
                <XAxis label='Expression' />
                <YAxis label="Density" />
            </ResponsiveHistogram>
        </div>
    )
}

/**
 * Renders a Density chart
 * @param props Component's props
 * @returns Component
 */
export const DensityChart2 = (props: DensityChartProps) => {
    const allDensityChartsAreHidden = props.showDensityChart.every((booleanValue) => !booleanValue)

    const newData = useMemo(() => {
        const newData: { strokeColor: string | undefined; fillColor: string | undefined; data: ChartData[]; }[] = []

        for (const dataObj of props.dataObjects) {
            const dataObjectsToAnalize = dataObj.data
            dataObjectsToAnalize.sort((a, b) => a - b)
            const datumF: ChartData[] = []
            let bin0 = 0
            let bin1 = 0.5
            let data: number[] = []
            let id = 1
            let cumulativeDensity = 0

            for (let i = 0; i < dataObjectsToAnalize.length; i++) {
                if (dataObjectsToAnalize[i] >= bin0 && dataObjectsToAnalize[i] < bin1) {
                    data.push(dataObjectsToAnalize[i])
                } else if (dataObjectsToAnalize[i] >= bin1) {
                    const density = data.length ? ((data.length * 100) / dataObjectsToAnalize.length) * 0.01 : 0.00
                    cumulativeDensity += density
                    datumF.push({
                        color: props.dataObjects[0].strokeColor,
                        bin0,
                        bin1,
                        count: data.length,
                        cumulative: i,
                        cumulativeDensity,
                        data,
                        density,
                        id
                    })
                    bin0 += 0.5
                    bin1 += 0.5
                    id += 1
                    i--
                    data = []
                }

                if (data.length && i === dataObjectsToAnalize.length - 1) {
                    const density = data.length ? ((data.length * 100) / dataObjectsToAnalize.length) * 0.01 : 0.00
                    cumulativeDensity += density
                    datumF.push({
                        color: props.dataObjects[0].strokeColor,
                        bin0,
                        bin1,
                        count: data.length,
                        cumulative: i,
                        cumulativeDensity,
                        data,
                        density,
                        id
                    })
                }
            }

            const newChartData = {
                strokeColor: dataObj.strokeColor,
                fillColor: dataObj.fillColor,
                data: datumF
            }

            newData.push(newChartData)
        }

        return newData
    }, [])

    if (!props.showBars && allDensityChartsAreHidden) {
        return null
    }

    return (
        <>
            {
                newData.map((data, i) => (
                    <ResponsiveContainer width='100%' height={400} key={i}>
                        <ComposedChart
                            data={data.data}
                            margin={{
                                top: 20,
                                right: 20,
                                bottom: 20,
                                left: 20
                            }}
                        >
                            <CartesianGrid stroke="#f5f5f5" />
                            <XAxis2 dataKey="bin0" />
                            <YAxis2 />
                            <Tooltip content={<CustomTooltip color={data.strokeColor} />} />
                            <Legend payload={[{ value: 'Expression', type: 'line', id: 'ID01' }]} />
                            <Bar dataKey="density" fill={data.strokeColor} />
                            <Area type="monotone" dataKey="density" fill={data.strokeColor} stroke={data.strokeColor} />
                        </ComposedChart>

                    </ResponsiveContainer>
                ))
            }
        </>
    )
}

/**
 * Renders a custom tooltip for Density chart
 * @param props Props of tooltip
 * @param props.active if component is active
 * @param props.payload data for tooltip
 * @param props.color color for tooltip title
 * @returns Component
 */
const CustomTooltip = ({ active, payload, color }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: '#fafafa', border: '1px solid #808080', borderWidth: '2px' }}>
                <strong style={{ color }}>{payload[0].payload.bin0} To {payload[0].payload.bin1}</strong>
                <div className='align-left'><strong>Count </strong>{payload[0].payload.count}</div>
                <div className='align-left'><strong>Density </strong>{payload[0].payload.density.toFixed(3)}</div>
                <div className='align-left'><strong>cumulative </strong>{payload[0].payload.cumulative}</div>
                <div className='align-left'><strong>cumulativeDensity </strong>{payload[0].payload.cumulativeDensity.toFixed(3)}</div>
            </div>
        )
    } else {
        return <></>
    }
}
