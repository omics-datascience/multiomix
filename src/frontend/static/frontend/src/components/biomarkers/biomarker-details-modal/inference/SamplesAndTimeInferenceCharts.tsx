import React, { useEffect, useRef, useState } from 'react'
/* import { BoxPlotSeries, XAxis, YAxis, PatternLines } from '@data-ui/xy-chart' */
import { InferenceExperimentForTable } from '../../types'
import { NoClinicalData } from '../../../pipeline/experiment-result/gene-gem-details/survival-analysis/NoClinicalData'
import { Header, Icon } from 'semantic-ui-react'
import ky from 'ky'
import { alertGeneralError } from '../../../../utils/util_functions'
import { ResultPlaceholder } from '../stat-validations/result/ResultPlaceholder'
import { BoxPlotChart } from '../../../pipeline/experiment-result/gene-gem-details/stats/BoxPlotChart'
import { COLOR_YELLOW_FILL, COLOR_YELLOW_STROKE } from '../../../../utils/constants'

declare const urlClinicalSourceAddOrEditInferenceExperiment: string
declare const urlUnlinkClinicalSourceInferenceExperiment: string
declare const urlChartDataByAttribute: string

// TODO: change the structure as this one was used by ApexCharts which was discarded.
/** Data retrieved from the  */
type ChartData = {
    x: string,
    y: number[]
}

/** SamplesAndTimeInferenceCharts props. */
interface SamplesAndTimeInferenceChartsProps {
    /** Selected InferenceExperimentForTable instance to retrieve all its data. */
    inferenceExperiment: InferenceExperimentForTable,
    /** Selected clinical attribute to group by. */
    selectedClinicalAttribute: string | undefined,
    /** Function to refresh the experiment info after addition or unlinking of clinical data. */
    refreshExperimentInfo: () => void,
}

/**
 * Renders the charts with the samples and the predicted hazard/survival time grouped by some condition.
 * @param props Component props.
 * @returns Component.
 */
export const SamplesAndTimeInferenceCharts = (props: SamplesAndTimeInferenceChartsProps) => {
    const abortController = useRef(new AbortController())
    const [loadingChartData, setLoadingChartData] = useState(false)
    const [chartData, setChartData] = useState<ChartData[]>([])

    const componentRef = useRef<any>(null)
    const [width, setWidth] = useState(0) // Initial width state

    useEffect(() => {
        // Gets the div with to refresh with of the Boxplot. */
        if (componentRef.current) {
            const newWidth = componentRef.current.offsetWidth
            setWidth(newWidth)
        }
    }, [componentRef.current])

    /** Fetches the data for the chart(s) every time the clinical attribute changes. */
    useEffect(() => {
        if (props.selectedClinicalAttribute) {
            getStatValidationKaplanMeierByAttr(props.selectedClinicalAttribute)
        }

        return () => {
            // Cleanup: cancel the ongoing request when component unmounts
            abortController.current.abort()
        }
    }, [props.selectedClinicalAttribute])

    if (!props.inferenceExperiment.clinical_source_id) {
        return (
            <NoClinicalData
                experiment={props.inferenceExperiment}
                experimentType='inference'
                urlClinicalSourceAddOrEdit={urlClinicalSourceAddOrEditInferenceExperiment}
                urlUnlinkClinicalSource={urlUnlinkClinicalSourceInferenceExperiment}
                refreshExperimentInfo={props.refreshExperimentInfo}
            />
        )
    }

    if (!props.selectedClinicalAttribute) {
        return (
            <Header size='huge' icon textAlign='center'>
                <Icon name='object group outline' />

                No clinical attribute selected

                <Header.Subheader>
                    Please, select one in the right Select.
                </Header.Subheader>
            </Header>
        )
    }

    /**
     * Retrieve KaplanMeier function of the selected StatisticalValidation instance grouping by clinical attribute.
     * @param clinicalAttribute Selected clinical attribute to group by.
     */
    const getStatValidationKaplanMeierByAttr = (clinicalAttribute: string) => {
        setLoadingChartData(true)

        const searchParams = {
            inference_experiment_pk: props.inferenceExperiment.id,
            clinical_attribute: clinicalAttribute
        }

        ky.get(urlChartDataByAttribute, { searchParams, timeout: 60000, signal: abortController.current.signal }).then((response) => {
            response.json().then((groupedDataByAttribute: ChartData[]) => {
                setChartData(groupedDataByAttribute)
                setLoadingChartData(false)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
                setLoadingChartData(false)
            })
        }).catch((err) => {
            if (!abortController.current.signal.aborted) {
                alertGeneralError()
            }

            console.log('Error getting InferenceExperiment data grouped by a clinical attribute', err)
            setLoadingChartData(false)
        })
    }

    if (loadingChartData) {
        return <ResultPlaceholder />
    }

    return (
        <div ref={componentRef} className='align-center'>
            <BoxPlotChart
                width={width}
                dataObjects={chartData.map((dataObj: ChartData) => (
                    {
                        height: 100,
                        data: dataObj.y,
                        outliers: [],
                        fillColor: COLOR_YELLOW_FILL,
                        strokeColor: COLOR_YELLOW_STROKE,
                        x: dataObj.x
                    }
                ))}
            />
        </div>
    )
}
