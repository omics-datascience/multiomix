
import React, { useEffect, useRef, useState } from 'react'
import { MoleculeWithCoefficient, StatisticalValidationForTable } from '../../../types'
import { Nullable } from '../../../../../utils/interfaces'
import ky from 'ky'
import { alertGeneralError } from '../../../../../utils/util_functions'
import ReactApexChart from 'react-apexcharts'
import { ResultPlaceholder } from '../result/ResultPlaceholder'

/** Epsilon to add to the min/max value of coefficients. */
const EPSILON = 1

declare const urlStatisticalValidationBestFeatures: string

/** StatisticalValidationResultBestFeatures props. */
interface StatisticalValidationResultBestFeaturesProps {
    /** Selected StatisticalValidationForTable instance to retrieve all its data. */
    selectedStatisticalValidation: StatisticalValidationForTable,
}

/**
 * Renders a panel with all the best features with their coefficient for a StatisticalValidation.
 * @param props Component's props
 * @returns Component
 */
export const StatisticalValidationResultBestFeatures = (props: StatisticalValidationResultBestFeaturesProps) => {
    const abortController = useRef(new AbortController())
    const [loading, setLoading] = useState(false)
    const [statValidationData, setStatValidationData] = useState<Nullable<MoleculeWithCoefficient[]>>(null)

    /**
     * Every time the StatisticalValidation changes retrieves
     * its data from the backend
     */
    useEffect(() => {
        if (props.selectedStatisticalValidation.id) {
            getStatValidationBestFeatures()
        }
        return () => {
            // Cleanup: cancel the ongoing request when component unmounts
            abortController.current.abort()
        }
    }, [props.selectedStatisticalValidation.id])

    /** Retrieve all the data of the selected StatisticalValidation instance. */
    const getStatValidationBestFeatures = () => {
        setLoading(true)

        const searchParams = { statistical_validation_pk: props.selectedStatisticalValidation.id }
        ky.get(urlStatisticalValidationBestFeatures, { searchParams, signal: abortController.current.signal }).then((response) => {
            response.json().then((statValidation: MoleculeWithCoefficient[]) => {
                setStatValidationData(statValidation)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            if (!abortController.current.signal.aborted) {
                alertGeneralError()
            }
            console.log('Error getting StatisticalValidation best features', err)
        }).finally(() => {
            if (!abortController.current.signal.aborted) {
                setLoading(false)
            }
        })
    }

    // Generates the chart config
    const coefficients = statValidationData ? statValidationData.map((elem) => elem.coeff) : []
    // TODO: report this bug, when specified as {x: ..., y: ...} the min, max value does not work!
    // const coefficients = statValidationData ? statValidationData.map((elem) => ({
    //     x: elem.identifier,
    //     y: elem.coeff,
    //     fillColor: elem.coeff > 0 ? '#008FFB' : '#FF4560'
    // })) : []
    const moleculesNames = statValidationData ? statValidationData.map((elem) => elem.identifier) : []

    const chartSeries: ApexAxisChartSeries = [{
        name: 'Coefficient',
        data: coefficients
    }]

    const chartOptions: ApexCharts.ApexOptions = {
        chart: {
            type: 'bar',
            height: 440,
            stacked: false
        },
        plotOptions: {
            bar: {
                horizontal: true,
                barHeight: '80%'
            }
        },
        dataLabels: {
            enabled: true,
            formatter: function (val: number) {
                return val.toFixed(4)
            }
        },
        stroke: {
            width: 1,
            colors: ['black']
        },
        grid: {
            xaxis: {
                lines: {
                    show: false
                }
            }
        },
        yaxis: {
            title: {
                text: 'Molecule'
            }
        },
        tooltip: {
            shared: false,
            y: {
                formatter: function (val: number) {
                    return val.toFixed(4)
                }
            }
        },
        xaxis: {
            categories: moleculesNames,
            title: {
                text: 'Coefficient'
            },
            type: 'category',
            min: Math.ceil(Math.min.apply(Math, coefficients) - EPSILON),
            max: Math.ceil(Math.max.apply(Math, coefficients) + EPSILON)
        }
    }

    return (
        <>
            {loading &&
                <ResultPlaceholder />
            }

            {(!loading && statValidationData !== null) &&
                <ReactApexChart options={chartOptions} series={chartSeries} type="bar" height={440} />
            }
        </>
    )
}
