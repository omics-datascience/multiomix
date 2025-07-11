import React, { useMemo } from 'react'
import { StatChartData } from '../../../../../utils/interfaces'
import {
    ComposedChart,
    Bar,
    XAxis as XAxis2,
    YAxis as YAxis2,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    BarChart
} from 'recharts'

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
type ChartData = {
    /** Color for tooltip title column */
    color: string | undefined,
    /** Start measure range */
    bin0: number,
    /** End measure range */
    bin1: number,
    /** Count of measure items */
    count: number,
    /** Accumulative of total of measure items */
    cumulative: number,
    /** Accumulative of total density of measure items */
    cumulativeDensity: number,
    /** Data of measure */
    data: number[],
    /** Density of the item */
    density: number,
    /** id for render, it generate by count of items, it cant be repeated */
    id: number,
    density2?: number
}

/** Data for a Bar component. */
type BarData = {
    strokeColor: string | undefined,
    fillColor: string | undefined,
    data: ChartData[]
}

/**
 * Renders a Density chart
 * @param props Component's props
 * @returns Component
 */
export const DensityChart = (props: DensityChartProps) => {
    const allDensityChartsAreHidden = props.showDensityChart.every((booleanValue) => !booleanValue)

    const newData = useMemo(() => {
        const newData: BarData[] = generateNewData(props.dataObjects)
        return newData
    }, [])

    if (!props.showBars && allDensityChartsAreHidden) {
        return null
    }

    return (
        <>
            {newData.map((data, i) => (
                <ResponsiveContainer width='100%' height={400} key={i}>
                    <BarChart
                        data={data.data}
                        margin={{
                            top: 20,
                            right: 20,
                            bottom: 20,
                            left: 20
                        }}
                        barCategoryGap={0}
                    >
                        <CartesianGrid stroke='#f5f5f5' />
                        <XAxis2 dataKey='bin0' />
                        <YAxis2 />
                        <Tooltip content={<CustomTooltip color={data.strokeColor} color2={null} />} />
                        <Legend payload={[{ value: 'Expression', type: 'line', id: 'ID01' }]} />
                        <Bar dataKey='density' fill={data.fillColor} stroke={data.strokeColor} strokeWidth={1} />
                        {/* FIXME: it's ugly. Let's try to generate a similar chart to ApexCharts */}
                        {/* <Area type="monotone" dataKey="density" fill={data.strokeColor} stroke={data.strokeColor} style={{ display: !props.showBars ? 'none' : 'inherit' }} />
                        <Area type="monotone" dataKey="density2" fill="#000" stroke="#000" /> */}
                    </BarChart>
                </ResponsiveContainer>
            ))}
        </>
    )
}

/**
 * Renders a custom tooltip for Density chart
 * @param props Props of tooltip
 * @param props.active if component is active
 * @param props.payload data for tooltip
 * @param props.color color for tooltip title
 * @param props.color2 color for tooltip title
 * @returns Component
 */
const CustomTooltip = ({ active, payload, color, color2 }: any) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: '#fafafa', border: '1px solid #808080', borderWidth: '2px' }}>
                <strong style={{ color }}>{payload[0].payload.bin0} To {payload[0].payload.bin1}</strong>
                <div className='align-left'><strong>Count </strong>{payload[0].payload.count}</div>
                <div className='align-left'><strong>Density </strong>{payload[0].payload.density.toFixed(3)}</div>
                <div className='align-left'><strong>cumulative </strong>{payload[0].payload.cumulative}</div>
                <div className='align-left'><strong>cumulativeDensity </strong>{payload[0].payload.cumulativeDensity.toFixed(3)}</div>
                {payload[0].payload.obj2 && color2 &&
                    (
                        <div>
                            <strong style={{ color: color2 }}>{payload[0].payload.bin0} To {payload[0].payload.bin1}</strong>
                            <div className='align-left'><strong>Count </strong>{payload[0].payload.count2}</div>
                            <div className='align-left'><strong>Density </strong>{payload[0].payload.density2.toFixed(3)}</div>
                            <div className='align-left'><strong>cumulative </strong>{payload[0].payload.cumulative2}</div>
                            <div className='align-left'><strong>cumulativeDensity </strong>{payload[0].payload.cumulativeDensity2.toFixed(3)}</div>
                        </div>
                    )}
            </div>
        )
    } else {
        return <></>
    }
}

/**
 * Component's props
 */
interface DensityChartMixProps {
    dataObjects: StatChartData[],
    /** True to show bars in density chart */
    showBars: boolean,
    /**
     * True to show density chart.
     * Must have the same length that dataObjects or density chart will be ignored
     */
    showDensityChart: boolean[],
}

/**
 * Density chart with both gene and GEM data.
 * @param props Component props.
 * @returns Component.
 */
export const DensityChartMix = (props: DensityChartMixProps) => {
    const allDensityChartsAreHidden = props.showDensityChart.every((booleanValue) => !booleanValue)

    const newData = useMemo(() => {
        const newData: BarData[] = generateNewData(props.dataObjects)
        const mergedObjects: any = []

        const obj = newData[0].data.length > newData[1].data.length ? newData[0].data : newData[1].data
        const obj2 = newData[0].data.length > newData[1].data.length ? newData[1].data : newData[0].data

        for (let i = 0; i < obj.length; i++) {
            if (obj2[i]) {
                mergedObjects.push({ ...obj[i], density2: obj2[i].density, cumulative2: obj2[i].cumulative, cumulativeDensity2: obj2[i].cumulativeDensity, count2: obj2[i].count, obj2: true })
            } else {
                mergedObjects.push({ ...obj[i], density2: null })
            }
        }

        const chart = {
            data: mergedObjects,
            strokeColor: newData[0].data.length > newData[1].data.length ? newData[0].strokeColor : newData[1].strokeColor,
            strokeColor2: newData[0].data.length > newData[1].data.length ? newData[1].strokeColor : newData[0].strokeColor
        }
        return chart
    }, [])

    if (!props.showBars && allDensityChartsAreHidden) {
        return null
    }

    return (
        <>
            <ResponsiveContainer width='100%' height={400}>
                <ComposedChart
                    data={newData.data}
                    margin={{
                        top: 20,
                        right: 20,
                        bottom: 20,
                        left: 20
                    }}
                    barGap={0}
                >
                    <CartesianGrid stroke='#f5f5f5' />
                    <XAxis2 dataKey='bin0' tickCount={4} />
                    <YAxis2 />
                    <Tooltip content={<CustomTooltip color={newData.strokeColor} color2={newData.strokeColor2} />} />
                    <Legend payload={[{ value: 'Expression', type: 'line', id: 'ID01' }]} />
                    <Bar dataKey='density' fill={newData.strokeColor} style={{ display: !props.showBars ? 'none' : 'inherit' }} />
                    <Bar dataKey='density2' fill={newData.strokeColor2} activeBar={!props.showBars} style={{ display: !props.showBars ? 'none' : 'inherit' }} />
                    {/* FIXME: it's ugly. Let's try to generate a similar chart to ApexCharts */}
                    {/* <Area type="monotone" dataKey="density" fill={newData.strokeColor} stroke={newData.strokeColor} />
                    <Area type="monotone" dataKey="density2" fill={newData.strokeColor2} stroke={newData.strokeColor2} /> */}
                </ComposedChart>

            </ResponsiveContainer>
        </>
    )
}

/**
 * Creates new arrays from array of number to handle components data.
 * @param dataObjects Structure that have numbers and color configurations.
 * @returns New array of new objects.
 */
const generateNewData = (dataObjects: StatChartData[]) => {
    const newData: BarData[] = []

    /**
     * take all objects and declare  to create multiple data for multiple graphs
     */
    for (const dataObj of dataObjects) {
        const dataObjectsToAnalyze = dataObj.data
        dataObjectsToAnalyze.sort((a, b) => a - b)
        const datumF: ChartData[] = []
        let bin0 = 0
        let bin1 = 0.5
        let data: number[] = []
        let id = 1
        let cumulativeDensity = 0

        for (let i = 0; i < dataObjectsToAnalyze.length; i++) {
            if (dataObjectsToAnalyze[i] >= bin0 && dataObjectsToAnalyze[i] < bin1) {
                data.push(dataObjectsToAnalyze[i])
            } else if (dataObjectsToAnalyze[i] >= bin1) {
                const density = data.length ? ((data.length * 100) / dataObjectsToAnalyze.length) * 0.01 : 0.00
                cumulativeDensity += density
                datumF.push({
                    color: dataObjects[0].strokeColor,
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

            if (data.length && i === dataObjectsToAnalyze.length - 1) {
                const density = data.length ? ((data.length * 100) / dataObjectsToAnalyze.length) * 0.01 : 0.00
                cumulativeDensity += density
                datumF.push({
                    color: dataObjects[0].strokeColor,
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
}
