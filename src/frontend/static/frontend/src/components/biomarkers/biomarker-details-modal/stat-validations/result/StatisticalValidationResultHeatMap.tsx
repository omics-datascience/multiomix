
import React, { useEffect, useState } from 'react'
import { MoleculesExpressions, StatisticalValidationForTable } from '../../../types'
import { Nullable } from '../../../../../utils/interfaces'
import ky from 'ky'
import { alertGeneralError } from '../../../../../utils/util_functions'
import { ResultPlaceholder } from './ResultPlaceholder'
import { Heatmap } from '../heatmap/Heatmap'

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

    const data = statValidationData
        ? Object.entries(statValidationData.data).flatMap(([moleculeName, samples]) => Object.entries(samples).map(([sampleName, expression]) => {
            return {
                x: sampleName,
                y: moleculeName,
                value: expression
            }
        }))
        : []

    return (
        <>
            {loading &&
                <ResultPlaceholder />
            }

            {(!loading && statValidationData !== null) &&
                <Heatmap data={data} width={1000} height={550} />
            }
        </>
    )
}
