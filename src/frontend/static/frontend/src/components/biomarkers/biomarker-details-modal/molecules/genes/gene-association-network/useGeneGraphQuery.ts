import { useEffect, useState } from 'react'
import { fetchGeneGraph } from './graphApi'
import { FetchGeneGraphParams, FetchGeneGraphResponse } from './types'

type QueryState = {
    data: FetchGeneGraphResponse | null;
    loading: boolean;
    error: string | null;
}

export const useGeneGraphQuery = (params: FetchGeneGraphParams) => {
    const [state, setState] = useState<QueryState>({
        data: null,
        loading: true,
        error: null,
    })

    useEffect(() => {
        let cancelled = false

        setState({
            data: null,
            loading: true,
            error: null,
        })

        fetchGeneGraph(params)
            .then((data) => {
                if (cancelled) { return }

                setState({
                    data,
                    loading: false,
                    error: null,
                })
            })
            .catch((error) => {
                if (cancelled) { return }

                setState({
                    data: null,
                    loading: false,
                    error: error instanceof Error ? error.message : 'Unknown error',
                })
            })

        return () => {
            cancelled = true
        }
    }, [
        params.rootNodeId,
        params.threshold,
        params.traversalMode,
        params.maxLevels,
    ])

    return state
}
