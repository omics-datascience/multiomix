import React from 'react'
import Chart from 'react-apexcharts'
import { ApexOptions } from 'apexcharts'
import { Dropdown, DropdownItemProps, Grid } from 'semantic-ui-react'
import { DjangoMRNAxGEMResultRow } from '../../../../../utils/django_interfaces'
import { Nullable } from '../../../../../utils/interfaces'
import { getGemDescription, getGeneAndGEMFromSelectedRow, listToDropdownOptions } from '../../../../../utils/util_functions'
import { GeneGEMDataErrorMessage } from '../GeneGEMDataErrorMessage'
import { CorrelationChartData, ApexChartJSSerie } from './../GeneGemDetailsModal'
import * as d3 from 'd3'
import { InputLabel } from '../../../../common/InputLabel'

/**
 * Component's props
 */
interface CorrelationGraphProps {
    chartData: CorrelationChartData,
    selectedRow: Nullable<DjangoMRNAxGEMResultRow>,
    handleGroupByChanges: (value: string) => void
}

/**
 * Renders a Scatter Chart with a fitness line to show the correlation between
 * a gene and a GEM
 * @param props Component's props
 * @returns Component
 */
export const CorrelationGraph = (props: CorrelationGraphProps) => {
    const [gene, gem] = getGeneAndGEMFromSelectedRow(props.selectedRow)
    const gemDescription = props.selectedRow ? getGemDescription(props.selectedRow.experiment_type, 'ExperimentType') : ''

    if (!props.chartData) {
        return null
    }

    // Error message
    if (!props.chartData.isDataOk) {
        return (
            <GeneGEMDataErrorMessage />
        )
    }

    // Put 'NA' (if exists) to the end of series (before Line)
    const series = props.chartData.series
    const NAIndex = series.findIndex(elem => elem.name === 'NA')
    const NASerie = NAIndex !== -1 ? series.splice(NAIndex, 1) : []
    const lineSerie = series.pop() as ApexChartJSSerie
    const seriesWithNAInEnd = series.concat(NASerie).concat(lineSerie)

    // Markers size
    const seriesLength = seriesWithNAInEnd.length
    const markerSizes = new Array(seriesLength).fill(6) // Equal size for scatter markers
    markerSizes[seriesLength - 1] = 0 // Hides line dots

    // Color generator
    const seriesIndexes = [...Array(seriesLength).keys()]

    const colors = d3.scaleLinear().range(
        [
            // Tableau10 (taken from https://observablehq.com/@d3/color-schemes)
            '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', '#59a14f', '#edc949', '#af7aa1', '#ff9da7', '#9c755f', '#bab0ab',
            // Paired (taken from https://observablehq.com/@d3/color-schemes)
            '#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a', '#ffff99', '#b15928'
        ]
    ).domain(seriesIndexes)

    // Color function
    const colorFunction = ({ seriesIndex }) => {
        // In case of 'NA' serie, it returns a grey color
        if (NAIndex !== -1 && seriesIndex === seriesWithNAInEnd.length - 2) {
            return '#7a7878'
        }
        return colors(seriesIndex)
    }

    const colorsArray = new Array(seriesLength).fill(colorFunction)
    colorsArray[seriesLength - 1] = '#1adb61' // Line color

    // Generates a default ApexOptions.
    const chartOptions: ApexOptions = {
        chart: {
            type: 'line',
            animations: {
                enabled: false
            },
            zoom: {
                enabled: true,
                type: 'xy'
            }
        },
        noData: {
            text: 'No data selected',
            style: {
                fontSize: '3em',
                color: '#ccc'
            }
        },
        tooltip: {
            x: {
                show: false
            }
        },
        colors: colorsArray,
        markers: {
            size: markerSizes
        },
        legend: {
            show: true,
            offsetY: 8,
            height: 25,
            // If there are many elements uses default fontSize, otherwise use a bigger one
            // NOTE: apparently it does not support 'em' scales
            fontSize: seriesWithNAInEnd.length > 10 ? '14px' : '21px'
        },
        xaxis: {
            title: {
                text: `${gem} (${gemDescription})`,
                offsetY: 8,
                style: {
                    fontSize: '2em'
                }
            },
            type: 'numeric',
            tickAmount: 12,
            labels: {
                formatter: (val) => parseFloat(val).toFixed(1)
            }
        },
        yaxis: {
            title: {
                text: `${gene} (mRNA)`,
                style: {
                    fontSize: '2em'
                }
            },
            tickAmount: 12,
            labels: {
                formatter: (val) => val.toFixed(1)
            }
        }
    }

    const clinicalColumnsOptions: DropdownItemProps[] = listToDropdownOptions(props.chartData.clinicalColumns)
    const clinicalColumnsIsEmpty = clinicalColumnsOptions.length === 0

    clinicalColumnsOptions.unshift({ key: 'none', text: 'None', value: undefined })

    return (
        <Grid>
            <Grid.Row>
                <Grid.Column width={5}>
                    <InputLabel label='Group by factor' />

                    <Dropdown
                        placeholder='Group by'
                        fluid
                        search
                        selection
                        onChange={(_, { value }) => props.handleGroupByChanges(value as string)}
                        value={props.chartData.selectedClinicalGroupBy as string}
                        disabled={clinicalColumnsIsEmpty}
                        options={clinicalColumnsOptions}
                    />
                </Grid.Column>
            </Grid.Row>

            <Grid.Row columns={1}>
                <Grid.Column>
                    <Chart
                        options={chartOptions}
                        series={seriesWithNAInEnd}
                        height='600'
                    />
                </Grid.Column>
            </Grid.Row>
        </Grid>
    )
}
