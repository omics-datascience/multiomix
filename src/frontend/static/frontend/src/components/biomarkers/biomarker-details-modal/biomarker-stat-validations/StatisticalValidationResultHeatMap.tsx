
import React, { useEffect, useState } from 'react'
import { MoleculesExpressions, StatisticalValidationForTable } from '../../types'
import { Nullable } from '../../../../utils/interfaces'
import ky from 'ky'
import { alertGeneralError } from '../../../../utils/util_functions'
import { Card, Placeholder } from 'semantic-ui-react'
import ReactApexChart from 'react-apexcharts'

declare const urlStatisticalValidationHeatMap: string

/** StatisticalValidationResultHeatMap props. */
interface StatisticalValidationResultHeatMapProps {
    /** Selected StatisticalValidationForTable instance to retrieve all its data. */
    selectedStatisticalValidation: StatisticalValidationForTable,
}

/**
 * Renders a panel with a HeatMap to visualize all the samples and their expressions for all the molecules of a Biomarker.
 * @param props Component's props
 * @returns Component
 */
export const StatisticalValidationResultHeatMap = (props: StatisticalValidationResultHeatMapProps) => {
    const [loading, setLoading] = useState(false)
    const [statValidationData, setStatValidationData] = useState<Nullable<MoleculesExpressions>>(null)

    /**
     * Every time the StatisticalValidation changes retrieves
     * its data from the backend
     */
    useEffect(() => {
        if (props.selectedStatisticalValidation.id) {
            getStatValidationHeatMap()
        }
    }, [props.selectedStatisticalValidation.id])

    /** Retrieve all the data of the selected StatisticalValidation instance. */
    const getStatValidationHeatMap = () => {
        setLoading(true)

        const searchParams = { statistical_validation_pk: props.selectedStatisticalValidation.id }
        ky.get(urlStatisticalValidationHeatMap, { searchParams }).then((response) => {
            response.json().then((statValidation: MoleculesExpressions) => {
                setStatValidationData(statValidation)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            alertGeneralError()
            console.log('Error getting StatisticalValidation heatmap', err)
        }).finally(() => {
            setLoading(false)
        })
    }

    /**
     * Generates N bins within a range. Taken from https://stackoverflow.com/a/66766285/7058363.
     * @param min Min value.
     * @param max Max value.
     * @param binsNumber Number of bins to generate.
     * @returns Array of bins with the min and max values.
     */
    const generateBins = (min: number, max: number, binsNumber: number): { min: number, max: number}[] =>
        Array.from({ length: binsNumber }).map((_elem, idx, _arr, step = (max - min) / binsNumber) => (
            {
                min: min + idx * step,
                max: min + (idx + 1) * step
            }
        ))

    // Generates the chart config
    let chartSeries: ApexAxisChartSeries | undefined
    let chartOptions: ApexCharts.ApexOptions | undefined

    if (statValidationData) {
        chartSeries = Object.entries(statValidationData.data).map(([moleculeName, samples]) => {
            return {
                name: moleculeName,
                data: Object.entries(samples).map(([sampleName, expression]) => {
                    return {
                        x: sampleName,
                        y: expression
                    }
                })
            }
        })
        const colors = generateBins(statValidationData.min, statValidationData.max, 4)

        chartOptions = {
            chart: {
                height: 350,
                type: 'heatmap'
            },
            plotOptions: {
                heatmap: {
                    shadeIntensity: 0.5,
                    radius: 0,
                    useFillColorAsStroke: true,
                    colorScale: {
                        ranges: [{
                            from: colors[0].min,
                            to: colors[0].max,
                            name: 'low',
                            color: '#00A100'
                        },
                        {
                            from: colors[1].min,
                            to: colors[1].max,
                            name: 'medium',
                            color: '#128FD9'
                        },
                        {
                            from: colors[2].min,
                            to: colors[2].max,
                            name: 'high',
                            color: '#FFB200'
                        },
                        {
                            from: colors[3].min,
                            to: colors[3].max,
                            name: 'extreme',
                            color: '#FF0000'
                        }
                        ]
                    }
                }
            },
            dataLabels: {
                enabled: false
            },
            stroke: {
                width: 1
            }
        }
    }

    return (
        <>
            {loading &&
                <Card>
                    <Placeholder>
                        <Placeholder.Image square />
                    </Placeholder>

                    <Card.Content>
                        <Placeholder>
                            <Placeholder.Header>
                                <Placeholder.Line length='very short' />
                                <Placeholder.Line length='medium' />
                            </Placeholder.Header>
                            <Placeholder.Paragraph>
                                <Placeholder.Line length='short' />
                            </Placeholder.Paragraph>
                        </Placeholder>
                    </Card.Content>
                </Card>
            }

            {(!loading && statValidationData !== null) &&
                <ReactApexChart options={chartOptions} series={chartSeries} type="heatmap" height={440} />
            }
        </>
    )
}
