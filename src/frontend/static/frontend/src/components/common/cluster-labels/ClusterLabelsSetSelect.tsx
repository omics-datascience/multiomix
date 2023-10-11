import React, { useEffect, useRef, useState } from 'react'
import { Select, DropdownItemProps } from 'semantic-ui-react'
import { ClusterLabelsSet } from '../../biomarkers/types'
import ky from 'ky'
import { alertGeneralError } from '../../../utils/util_functions'
import { InputLabel } from '../InputLabel'
import { WebsocketClientCustom } from '../../../websockets/WebsocketClient'

declare const currentUserId: string
declare const urlClusterLabelsSets: string

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
    const abortController = useRef(new AbortController())
    const [clusterLabelsSets, setClusterLabelsSets] = useState<ClusterLabelsSet[]>([])
    const [loading, setLoading] = useState(false)
    const websocketClient = useRef<WebsocketClientCustom>()

    useEffect(() => {
        // Gets data
        getData()

        // Initializes the websocket client
        websocketClient.current = new WebsocketClientCustom({
            channelUrl: `/ws/users/${currentUserId}/`,
            commandsToAttend: [
                {
                    key: 'update_cluster_labels_sets',
                    functionToExecute: getData
                }
            ]
        })

        return () => {
            // Cleanup: cancel the ongoing request when component unmounts
            abortController.current.abort()
        }
    }, [])

    /** Retrieves all the ClusterLabelsSet instances for this user and the TrainedModel */
    function getData () {
        setLoading(true)

        const searchParams = { trained_model_pk: props.trainedModelPk }
        ky.get(urlClusterLabelsSets, { searchParams, signal: abortController.current.signal }).then((response) => {
            response.json().then((clusterLabelsSetsData: ClusterLabelsSet[]) => {
                setClusterLabelsSets(clusterLabelsSetsData)
            }).catch((err) => {
                alertGeneralError()
                console.log('Error parsing JSON ->', err)
            })
        }).catch((err) => {
            if (!abortController.current.signal.aborted) {
                alertGeneralError()
            }

            console.log('Error getting model ClusterLabelsSets', err)
        }).finally(() => {
            if (!abortController.current.signal.aborted) {
                setLoading(false)
            }
        })
    }

    const options: DropdownItemProps[] = clusterLabelsSets.map((clusterLabelsSet) => (
        { key: clusterLabelsSet.id, text: clusterLabelsSet.name, value: clusterLabelsSet.id }
    ))

    return (
        <>
            <InputLabel label='Cluster label' />

            <Select
                fluid
                selectOnBlur={false}
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
