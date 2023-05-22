import React, { useEffect, useState } from 'react'
import { Select, DropdownItemProps } from 'semantic-ui-react'
import { ClusterLabelsSet } from '../../biomarkers/types'
import ky from 'ky'
import { alertGeneralError } from '../../../utils/util_functions'

declare const urlClusterLabels: string

/** ClusterLabelsSetSelect props. */
interface ClusterLabelsSetSelectProps {
    /** TrainedModel primary key. */
    trainedModelPk: number,
    /** Selected ClusterLabelsSet primary key. */
    selectedClusterSetPk: number | undefined,
    /** Function to set the selected ClusterLabelsSet primary key. */
    setSelectedClusterSetPk: (newValue: number | undefined) => void
}

/**
 * Renders a Select for Cluster labels set (Django ClusterLabelsSet model)
 * @param props Component props.
 * @returns Component.
 */
export const ClusterLabelsSetSelect = (props: ClusterLabelsSetSelectProps) => {
    const [clusterLabelsSets, setClusterLabelsSets] = useState<ClusterLabelsSet[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        getData()
    }, [])

    /** Retrieves all the ClusterLabelsSet instances for this user and the TrainedModel */
    function getData () {
        setLoading(true)

        const searchParams = { trained_model_pk: props.trainedModelPk }
        ky.get(urlClusterLabels, { searchParams }).then((response) => {
            response.json().then((clusterLabelsSetsData: ClusterLabelsSet[]) => {
                setClusterLabelsSets(clusterLabelsSetsData)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            alertGeneralError()
            console.log('Error getting model ClusterLabelsSets', err)
        }).finally(() => {
            setLoading(false)
        })
    }

    const options: DropdownItemProps[] = clusterLabelsSets.map((clusterLabelsSet) => (
        { key: clusterLabelsSet.id, text: clusterLabelsSet.name, value: clusterLabelsSet.id }
    ))

    return (
        <>
            <label>
                <strong>Use a cluster label</strong>
            </label>

            <Select
                fluid
                options={options}
                loading={loading}
                search
                clearable
                value={props.selectedClusterSetPk}
                onChange={(_, { value }) => { props.setSelectedClusterSetPk(value as number | undefined) }}
                placeholder='Use cluster labels'
                className='margin-top-2'
                disabled={options.length === 0}
            />
        </>
    )
}
