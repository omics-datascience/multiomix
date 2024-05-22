import React from 'react'
/* import { XYChart, theme, withParentSize, withTheme } from '@data-ui/xy-chart' */
import { DjangoSourceDataOutliersBasic } from '../../../utils/django_interfaces'

/** Type of BoxPlot datum field */
type BoxplotDatum = {
    x?: string,
    y?: string,
    min: number,
    max: number,
    median: number,
    mean: number,
    firstQuartile: number,
    thirdQuartile: number,
    outliers: number[],
    outliersObjects: DjangoSourceDataOutliersBasic[],
    cnaDescription?: string
}

/**
 * Component's props
 */
interface BoxPlotTooltipProps {
    /** Data of the boxplot (mean, min, max, etc) */
    datum: BoxplotDatum,
    /** Boxplot color */
    color: any
}

/**
 * Computes sum of all the number in the array
 * @param data Array of numbers to compute
 * @returns Sum of all the numbers in array
 */
const sum = (data: number[]): number => data.reduce((a, b) => a + b, 0)

const mean = (data: number[]): number => sum(data) / data.length

/**
 * Computes quantile from number arrays
 * @param data Array of numbers to compute
 * @param q Quantile to compute
 * @returns Quantile value
 */
const quantile = (data: number[], q: number): number => {
    const sortedAscendant = data.sort((a, b) => a - b)
    const pos = (sortedAscendant.length - 1) * q
    const base = Math.floor(pos)
    const rest = pos - base

    if (sortedAscendant[base + 1] !== undefined) {
        return sortedAscendant[base] + rest * (sortedAscendant[base + 1] - sortedAscendant[base])
    }

    return sortedAscendant[base]
}

// Chart with theme
/* const XYChartWithTheme = withTheme(theme)(XYChart)
const ResponsiveXYChart = withParentSize(({ parentWidth, parentHeight, renderTooltip, children, ...rest }) => (
    <XYChartWithTheme
        width={parentWidth}
        height={parentHeight}
        renderTooltip={renderTooltip}
        {...rest}
    >
        {children}
    </XYChartWithTheme>
)) */

/**
 * Component's props
 */
interface TooltipElementProps {
    strongTitle: string,
    numberToDisplay: number,
    color: string,
    fixed?: number
}

/**
 * Renders a strong element with a (fixed?) numeric value
 * @param props Component's props
 * @returns Component
 */
const TooltipElement = (props: TooltipElementProps) => (
    <div>
        <strong style={{ color: props.color }}>{props.strongTitle}: </strong>
        {props.fixed ? props.numberToDisplay.toFixed(props.fixed) : props.numberToDisplay}
    </div>
)

/**
 * Renders a Tooltip on hover
 * TODO: optimize
 * @param props Component's props
 * @returns Component
 */
const renderBoxPlotTooltip = (props: BoxPlotTooltipProps) => {
    const { min, max, mean, median, firstQuartile, thirdQuartile, outliers, outliersObjects, cnaDescription } = props.datum
    const color = props.color

    return (
        <div className='align-left'>
            {cnaDescription &&
                <React.Fragment>
                    <strong>{cnaDescription}</strong>
                    <hr />
                </React.Fragment>
            }
            <TooltipElement strongTitle='Min' numberToDisplay={min} color={color} fixed={2} />
            <TooltipElement strongTitle='First quartile' numberToDisplay={firstQuartile} color={color} fixed={2} />
            <TooltipElement strongTitle='Median' numberToDisplay={median} color={color} fixed={2} />
            <TooltipElement strongTitle='Third quartile' numberToDisplay={thirdQuartile} color={color} fixed={2} />
            <TooltipElement strongTitle='Max' numberToDisplay={max} color={color} fixed={2} />
            <TooltipElement strongTitle='Mean' numberToDisplay={mean} color={color} fixed={3} />
            {outliers && outliers.length > 0 &&
                <React.Fragment>
                    <TooltipElement strongTitle='Outliers (using MAD)' numberToDisplay={outliers.length} color={color} />

                    {outliersObjects.map((outlier) => (
                        <TooltipElement
                            key={outlier.sample_identifier}
                            strongTitle={outlier.sample_identifier}
                            numberToDisplay={outlier.expression}
                            color={color}
                        />
                    ))}
                </React.Fragment>
            }
        </div>
    )
}

/* const { colors } = theme */

export {
    mean,
    quantile,
    /*   ResponsiveXYChart, */
    BoxPlotTooltipProps,
    renderBoxPlotTooltip,
    BoxplotDatum
    /* colors as boxPlotThemeColors */
}
