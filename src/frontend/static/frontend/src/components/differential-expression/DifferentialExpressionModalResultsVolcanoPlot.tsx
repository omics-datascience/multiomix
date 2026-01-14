import React, { useEffect, useState } from 'react'
import { VolcanoPlot } from './VolcanoPlot'
import ky from 'ky'
import { VolcanoPoint } from './types'
import { Form } from 'semantic-ui-react'

declare const urlDifferentialExpressionVolcanoData: string

interface DifferentialExpressionModalResultsVolcanoPlotProps {
    differentialExpressionAnalysisId?: number;
}

export const DifferentialExpressionModalResultsVolcanoPlot = (props: DifferentialExpressionModalResultsVolcanoPlotProps) => {
    const [volcanoPoints, setVolcanoPoints] = useState<VolcanoPoint[]>([])
    const [fcThreshold, setFcThreshold] = useState<number>(1)
    const [pThreshold, setPThreshold] = useState<number>(0.05)

    const getVolcanoPlotData = (signal: AbortSignal) => {
        if (!props.differentialExpressionAnalysisId) {
            return
        }

        const url =
            `${urlDifferentialExpressionVolcanoData}/` +
            `${props.differentialExpressionAnalysisId}/`

        ky.get(url, { retry: 5, signal }).then((response) => {
            response.json().then((volcanoPointsResponse: VolcanoPoint[]) => {
                setVolcanoPoints(volcanoPointsResponse)
            }).catch((err) => {
                console.error('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            console.error('Error getting volcanoPoints ->', err)
        })
    }

    useEffect(() => {
        const id = props.differentialExpressionAnalysisId

        if (!id) {
            return
        }

        const controller = new AbortController()
        getVolcanoPlotData(controller.signal)

        return () => {
            controller.abort()
        }
    }, [
        props.differentialExpressionAnalysisId
    ])

    return (
        <div style={{ padding: 20 }}>
            <h3>Volcano Plot</h3>

            {/* 🔽 Selects */}
            <Form>
                <Form.Group widths='equal'>
                    <Form.Select
                        label='|log2FC| threshold'
                        options={[
                            { key: 1, text: '1', value: 1 },
                            { key: 2, text: '2', value: 2 },
                            { key: 3, text: '3', value: 3 },
                            { key: 4, text: '4', value: 4 },
                            { key: 5, text: '5', value: 5 }
                        ]}
                        value={fcThreshold}
                        onChange={(_, data) =>
                            setFcThreshold(Number(data.value))}
                    />

                    <Form.Select
                        label='p-value threshold'
                        options={[
                            { key: 0.05, text: '0.05', value: 0.05 },
                            { key: 0.01, text: '0.01', value: 0.01 },
                        ]}
                        value={pThreshold}
                        onChange={(_, data) =>
                            setPThreshold(Number(data.value))}
                    />
                </Form.Group>
            </Form>

            {/* 📊 Plot */}
            {volcanoPoints.length > 0 && (
                <VolcanoPlot
                    data={volcanoPoints}
                    fcThreshold={fcThreshold}
                    pThreshold={pThreshold}
                />
            )}
        </div>
    )
}
