import React from 'react'
import * as d3 from 'd3'
import { Nullable } from '../../../../../utils/interfaces'

/** Needed structure for KaplanMeier chart */
type KaplanMeierSample = {
    time: number,
    probability: number,
}

/**
 * Kaplan-Meier group to show in chart.
 * Everyone has a label and an array of time and survival probability
 */
type KaplanMeierGroup = {
    label: string,
    data: KaplanMeierSample[]
}

/** Nullable array of Kaplan-Meier groups */
type KaplanMeierData = Nullable<KaplanMeierGroup[]>

/**
 * SVG base to render a Kaplan-Meier chart withing a div with fixed height and width
 */
class Base extends React.Component<{
    width: number,
    height: number,
    children: any
}, {}> {
    render () {
        return (
            <svg
                height={this.props.height}
                width={this.props.width}
            >
                {this.props.children}
            </svg>
        )
    }
}

/**
 * KaplanMeierSeries' props
 */
interface KaplanMeierSeriesProps {
    colors: string[],
    xDomain: number[],
    yDomain: number[],
    data: KaplanMeierGroup[],
    disabledGroups: any,
    height: number,
    left: number,
    top: number,
    width: number
}

/**
 * Renders Kaplan-Meier curve for every group
 */
class KaplanMeierSeries extends React.Component<KaplanMeierSeriesProps, {}> {
    buildCurves (groups, disabledGroups) {
        return groups.map((group, index) => {
            if (disabledGroups[group.label]) {
                return null
            }

            return (
                <KaplanMeierCurve
                    color={this.props.colors[index]}
                    xDomain={this.props.xDomain}
                    yDomain={this.props.yDomain}
                    height={this.props.height}
                    key={index}
                    width={this.props.width}
                    {...group}
                />
            )
        })
    }

    render () {
        return (
            <g transform={`translate(${this.props.left}, ${this.props.top})`}>
                {this.buildCurves(this.props.data, this.props.disabledGroups)}
            </g>
        )
    }
}

/**
 * KaplanMeierCurve's props
 */
interface KaplanMeierCurveProps {
    data: any,
    xDomain: number[],
    yDomain: number[],
    color: string,
    width: number,
    height: number
}

/**
 * Renders Kaplan-Meier single curve
 */
class KaplanMeierCurve extends React.Component<KaplanMeierCurveProps, {}> {
    collectCensorPoints (data) {
        return data.filter(({ status }) => !status)
    }

    generateLineFunction (xScale, yScale) {
        return d3.line().x(({ time }) => xScale(time)).y(({ probability }) => yScale(probability)).curve(d3.curveStepAfter)
    }

    buildCensorMarks (censorPoints, xScale, yScale, color) {
        const size = 6
        const offset = 0 - size / 2
        return censorPoints.map(({ time, probability }, index) => (
            <rect
                height={size}
                key={index}
                opacity={0.7}
                stroke={color}
                style={{ fill: color }}
                transform={`translate(${offset}, ${offset})`}
                width={size}
                x={xScale(time)}
                y={yScale(probability)}
            />
        ))
    }

    render () {
        const { data, xDomain, yDomain, color } = this.props
        const xScale = d3Utils.createLinearScale([0, this.props.width], xDomain)
        const yScale = d3Utils.createLinearScale([0, this.props.height], yDomain)
        const lineFunction = this.generateLineFunction(xScale, yScale)
        const censorPoints = this.collectCensorPoints(data)
        return (
            <g>
                <path
                    d={lineFunction(data)}
                    fill="none"
                    opacity={0.7}
                    stroke={color}
                    strokeWidth={3}
                >
                </path>
                {this.buildCensorMarks(censorPoints, xScale, yScale, color)}
            </g>
        )
    }
}

interface AxisProps {
    domain: number[],
    height: number,
    left: number,
    top: number,
    width: number,
    label: string
}

/**
 * Renders Y axis
 * @param props Component's props
 * @returns Component
 */
const YAxis = (props: AxisProps) => {
    const scale = d3Utils.createLinearScale([0, props.height], props.domain)
    const yAxis = d3Utils.createAxis(scale, 'left')
    return (
        <g
            className='axis axis-y'
            transform={`translate(${props.left}, ${props.top})`}
        >
            <g dangerouslySetInnerHTML={d3Utils.createAxisMarkup(yAxis, props.width, props.height)}></g>
            <text
                dy="1.50em"
                style={{ textAnchor: 'middle' }}
                transform="rotate(-90)"
                x={-props.height / 2}
                y={6}
            >
                {props.label}
            </text>
        </g>
    )
}

/**
 * Renders X axis
 * @param props Component's props
 * @returns Component
 */
const XAxis = (props: AxisProps) => {
    const scale = d3Utils.createLinearScale([0, props.width], props.domain)
    const xAxis = d3Utils.createAxis(scale, 'bottom')
    return (
        <g
            className='axis axis-x'
            transform={`translate(${props.left}, ${props.top})`}
        >
            <g dangerouslySetInnerHTML={d3Utils.createAxisMarkup(xAxis, props.width, props.height)}></g>
            <text
                className='label'
                style={{ textAnchor: 'middle' }}
                x={props.width / 2}
                y='-6'
            >
                {props.label}
            </text>
        </g>
    )
}

/**
 * Legend's props
 */
interface LegendProps {
    colors: string[],
    disabledGroups: object,
    labels: string[],
    left: number,
    top: number,
    toggleGroup: (label: string) => void,
}

/**
 * Renders Kaplan-Meier chart's legend
 */
class Legend extends React.Component<LegendProps, {}> {
    _onClick (label: string) {
        return () => {
            this.props.toggleGroup(label)
        }
    }

    buildLabels (labels: string[]) {
        return labels.map((label, index) => {
            let fill = this.props.colors[index]

            if (this.props.disabledGroups[label]) {
                fill = 'transparent'
            }

            return (
                <g
                    className='legend__item clickable'
                    key={index}
                    onClick={this._onClick(label)}
                    transform={`translate(${0}, ${index * 24})`}
                >
                    <text
                        dy="0.35em"
                        style={{ textAnchor: 'end', userSelect: 'none' }}
                        // style={{ textAnchor: 'left', userSelect: 'none', textAnchor: 'end' }}
                        y={8}
                        x={-8}
                    >
                        {label}
                    </text>
                    <rect
                        height={16}
                        stroke={this.props.colors[index]}
                        style={{ fill }}
                        width={16}
                    />
                </g>
            )
        })
    }

    render () {
        return (
            <g
                className='legend'
                transform={`translate(${this.props.left}, ${this.props.top})`}
            >
                {this.buildLabels(this.props.labels)}
            </g>
        )
    }
}

/**
 * D3 util functions
 */
const d3Utils = {
    createAxis: (scale, orientation: 'bottom' | 'left' | 'top' | 'right') => {
        switch (orientation) {
            case 'bottom':
                return d3.axisBottom(scale)
            case 'left':
                return d3.axisLeft(scale)
            case 'top':
                return d3.axisTop(scale)
            case 'right':
                return d3.axisRight(scale)
            default:
                break
        }
    },

    createLinearScale: (range, domain) => {
        return d3.scaleLinear().range(range).domain(domain)
    },

    createAxisMarkup: (axis, width: number, height: number) => { // refactor, this is an insane hack
        const svg = d3.select('body').append('svg')
        svg.remove()
        svg.attr('width', width)
        svg.attr('height', height)
        const g = svg.append('g')
        g.call(axis)
        const html = g.node().innerHTML
        return { __html: html }
    }
}

/**
 * KaplanMeier's props
 */
interface KaplanMeierProps {
    data: KaplanMeierData,
    height: number,
    width: number,
    xAxisLabel: string,
    yAxisLabel: string
}

/**
 * Component's state
 */
interface KaplanMeierState {
    /** To show/hide groups in Kaplan-Meier */
    disabledGroups: { [key: string]: boolean },
}

/**
 * Renders a Kaplan-Meier chart
 */
class KaplanMeier extends React.Component<KaplanMeierProps, KaplanMeierState> {
    constructor (props) {
        super(props)
        this.state = {
            disabledGroups: {}
        }
    }

    /**
     * Gets the max survival time
     * @param groups Groups to iterate over
     * @returns Max survival time
     */
    findMaxTime (groups: KaplanMeierGroup[]): number {
        return groups.reduce((currentMax, { data }) => {
            return Math.max(currentMax, Math.max.apply(Math, data.map((sample) => sample.time)))
        }, -Infinity)
    }

    /**
     * Toggles a label to show/hide its curve in chart
     * @param label Label to toggle in chart
     */
    _onToggleGroup = (label: string) => {
        const disabledGroups = Object.assign({}, this.state.disabledGroups)

        if (disabledGroups[label]) {
            delete disabledGroups[label]
        } else {
            disabledGroups[label] = true
        }

        this.setState({ disabledGroups })
    }

    render () {
        const { data } = this.props

        if (!data) {
            return null
        }

        const labels = data.map(({ label }) => label)
        const maxT = this.findMaxTime(data)
        const xDomain = [0, maxT]
        const colors = d3.scaleOrdinal(d3.schemeCategory10).range()
        const yDomain = [1, 0]

        const seriesWidth = this.props.width - 64
        const seriesHeight = this.props.height - 64

        return (
            <Base {...this.props}>
                <XAxis
                    domain={xDomain}
                    height={32}
                    label={this.props.xAxisLabel}
                    left={48}
                    top={this.props.height - 32}
                    width={seriesWidth}
                />
                <YAxis
                    domain={yDomain}
                    height={seriesHeight}
                    label={this.props.yAxisLabel}
                    left={48}
                    top={16}
                    width={32}
                />
                <KaplanMeierSeries
                    colors={colors}
                    data={data}
                    disabledGroups={this.state.disabledGroups}
                    xDomain={xDomain}
                    yDomain={yDomain}
                    height={seriesHeight}
                    left={48}
                    top={16}
                    width={seriesWidth}
                />
                <Legend
                    colors={colors}
                    disabledGroups={this.state.disabledGroups}
                    labels={labels}
                    left={this.props.width - 32}
                    toggleGroup={this._onToggleGroup}
                    top={32}
                />
            </Base>
        )
    }
}

export { KaplanMeier, KaplanMeierData, KaplanMeierGroup, KaplanMeierSample }
