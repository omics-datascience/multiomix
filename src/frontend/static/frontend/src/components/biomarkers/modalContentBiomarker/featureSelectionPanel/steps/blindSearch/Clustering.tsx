import React from 'react'
import { FitnessFunctionClustering } from '../../../../types'
interface Props {
    clustering: FitnessFunctionClustering,
}
export const Clustering = (props: Props) => {
    const { clustering } = props
    console.log(clustering)
    return (
        <div>Clustering</div>
    )
}
