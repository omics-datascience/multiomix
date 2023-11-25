import React, { useEffect, useRef, useState } from 'react'
import { Select, DropdownItemProps } from 'semantic-ui-react'
import { PredictionRangeLabelsSet } from '../../biomarkers/types'
import ky from 'ky'
import { alertGeneralError } from '../../../utils/util_functions'
import { InputLabel } from '../InputLabel'

declare const urlPredictionRangeLabelsSets: string

/** PredictionRangeLabelsSetSelect props. */
interface PredictionRangeLabelsSetSelectProps {
    /** TrainedModel primary key. */
    trainedModelPk: number,
    /** Selected PredictionRangeLabelsSet primary key. */
    selectedClusterSetPk: number | undefined,
    /** Function to set the selected PredictionRangeLabelsSet primary key. */
    setSelectedClusterSetPk: (newValue: number | undefined) => void
}

/**
 * Renders a Select for Cluster labels set (Django PredictionRangeLabelsSet model)
 * @param props Component props.
 * @returns Component.
 */
export const PredictionRangeLabelsSetSelect = (props: PredictionRangeLabelsSetSelectProps) => {
    const abortController = useRef(new AbortController())
    const [predictionRangeLabelsSets, setPredictionRangeLabelsSets] = useState<PredictionRangeLabelsSet[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        getData()
    }, [])

    /** Retrieves all the PredictionRangeLabelsSet instances for this user and the TrainedModel */
    function getData () {
        setLoading(true)

        const searchParams = { trained_model_pk: props.trainedModelPk }
        ky.get(urlPredictionRangeLabelsSets, { searchParams, signal: abortController?.current.signal }).then((response) => {
            response.json().then((predictionRangeLabelsSetData: PredictionRangeLabelsSet[]) => {
                setPredictionRangeLabelsSets(predictionRangeLabelsSetData)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            if (!abortController?.current.signal.aborted) {
                alertGeneralError()
            }

            console.log('Error getting model PredictionRangeLabelsSets', err)
        }).finally(() => {
            if (!abortController?.current.signal.aborted) {
                setLoading(false)
            }
        })
    }

    const options: DropdownItemProps[] = predictionRangeLabelsSets.map((predictionRangeLabelsSet) => (
        { key: predictionRangeLabelsSet.id, text: predictionRangeLabelsSet.name, value: predictionRangeLabelsSet.id }
    ))
    useEffect(() => {
        return () => {
        // Cleanup: cancel the ongoing request when component unmounts
            abortController.current.abort()
        }
    }, [])

    return (
        <>
            <InputLabel label='Use a range label' />

            <Select
                fluid
                selectOnBlur={false}
                options={options}
                loading={loading}
                search
                clearable
                value={props.selectedClusterSetPk}
                onChange={(_, { value }) => { props.setSelectedClusterSetPk(value as number | undefined) }}
                placeholder='Use range labels'
                className='margin-top-2'
                disabled={options.length === 0}
            />
        </>
    )
}
