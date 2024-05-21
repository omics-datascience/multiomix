import React, { useEffect, useRef, useState } from 'react'
import { BoxPlotSeries, XAxis, YAxis, PatternLines } from '@data-ui/xy-chart'
import { InferenceExperimentForTable } from '../../types'
import { NoClinicalData } from '../../../pipeline/experiment-result/gene-gem-details/survival-analysis/NoClinicalData'
import { Header, Icon } from 'semantic-ui-react'
import ky from 'ky'
import { alertGeneralError } from '../../../../utils/util_functions'
import { ResultPlaceholder } from '../stat-validations/result/ResultPlaceholder'
import { BoxplotDatum, ResponsiveXYChart, renderBoxPlotTooltip, boxPlotThemeColors } from '../../../common/boxplots/BoxplotsCommons'

declare const urlClinicalSourceAddOrEditInferenceExperiment: string
declare const urlUnlinkClinicalSourceInferenceExperiment: string
declare const urlChartDataByAttribute: string

const DOMAIN_MARGIN: number = 0.05

// TODO: change the structure as this one was used by ApexCharts which was discarded.
/** Data retrieved from the  */
type ChartData = {
    x: string,
    y: [number, number, number, number, number],
    mean: number,
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
    const [chartData, setChartData] = useState<ChartData[]>([]) // TODO: type

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
            response.json().then((kaplanMeierResult/*: TODO: add type */) => {
                setChartData(kaplanMeierResult)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            if (!abortController.current.signal.aborted) {
                alertGeneralError()
            }

            console.log('Error getting InferenceExperiment data grouped by a clinical attribute', err)
        }).finally(() => {
            if (!abortController.current.signal.aborted) {
                setLoadingChartData(false)
            }
        })
    }

    if (loadingChartData) {
        return <ResultPlaceholder />
    }

    const data: BoxplotDatum[] = chartData.map((dataObj: any) => ({
        x: dataObj.x,
        min: dataObj.y[0],
        firstQuartile: dataObj.y[1],
        median: dataObj.y[2],
        thirdQuartile: dataObj.y[3],
        max: dataObj.y[4],
        mean: dataObj.mean,
        outliers: [],
        outliersObjects: []
    }))

    const allBoxPlotValues = data.map((dataObj: any) => dataObj.min).concat(data.map((dataObj: any) => dataObj.max))
    const minBoxPlotValue = Math.min.apply(Math, allBoxPlotValues)
    const maxBoxPlotValue = Math.max.apply(Math, allBoxPlotValues)
    const valueDomain = [
        minBoxPlotValue - DOMAIN_MARGIN,
        maxBoxPlotValue + DOMAIN_MARGIN
    ]

    // TODO: change colors depending on selected RangeSet

    return (
        <div style={{ height: 500 }}>
            <ResponsiveXYChart
                key="boxplot_chart"
                ariaLabel="Time inference"
                xScale={{
                    type: 'band',
                    paddingInner: 0.15,
                    paddingOuter: 0.3
                }}
                yScale={{
                    type: 'linear',
                    domain: valueDomain
                }}
                renderTooltip={renderBoxPlotTooltip}
                margin={{ right: 16, left: 80, top: 16 }}
                showYGrid
            >
                <PatternLines
                    id="boxplot_lines_pattern"
                    height={4}
                    width={4}
                    stroke={boxPlotThemeColors.categories[4]}
                    strokeWidth={1}
                    orientation={['diagonal']}
                />

                <BoxPlotSeries
                    data={data}
                    fill="url(#boxplot_lines_pattern)"
                    stroke='black'
                    strokeWidth={2}
                    widthRatio={1}
                    horizontal={false}
                />
                <XAxis label='Category' />
                <YAxis label='Time' numTicks={10} orientation="left" />
            </ResponsiveXYChart>
        </div>
    )
}
