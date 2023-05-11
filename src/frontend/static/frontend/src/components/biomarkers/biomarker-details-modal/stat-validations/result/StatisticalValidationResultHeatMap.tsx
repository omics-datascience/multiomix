
import React, { useEffect, useState } from 'react'
import { MoleculesExpressions, StatisticalValidationForTable } from '../../../types'
import { Nullable } from '../../../../../utils/interfaces'
import ky from 'ky'
import { alertGeneralError } from '../../../../../utils/util_functions'
import ReactApexChart from 'react-apexcharts'
import { ResultPlaceholder } from './ResultPlaceholder'

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
        ky.get(urlStatisticalValidationHeatMap, { searchParams, timeout: 60000 }).then((response) => {
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

        chartOptions = {
            chart: {
                height: 350,
                type: 'heatmap'
            },
            plotOptions: {
                heatmap: {
                    shadeIntensity: 0.5,
                    radius: 0,
                    useFillColorAsStroke: true
                }
            },
            dataLabels: {
                enabled: false
            },
            colors: ['#d00000'],
            stroke: {
                width: 1
            }
        }
    }

    return (
        <>
            {loading &&
                <ResultPlaceholder />
            }

            {(!loading && statValidationData !== null) &&
                <ReactApexChart options={chartOptions} series={chartSeries} type="heatmap" height={440} />
            }
        </>
    )
}
