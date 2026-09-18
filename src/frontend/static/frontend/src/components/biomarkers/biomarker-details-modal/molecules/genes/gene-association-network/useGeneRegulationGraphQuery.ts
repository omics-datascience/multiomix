import { useEffect, useState } from 'react'
import { fetchGeneRegulationGraph } from './graphApi'
import { FetchGeneRegulationGraphParams, FetchGeneRegulationGraphResponse } from './types'

/** State handled by the gene regulation graph query hook. */
type GeneRegulationGraphQueryState = {
    /** Resolved graph payload returned by the mock API. */
    data: FetchGeneRegulationGraphResponse | null;
    /** Indicates whether the query is currently in flight. */
    loading: boolean;
    /** Error message displayed by the panel when the query fails. */
    error: string | null;
}

/**
 * Fetches graph data for the currently applied list of filters.
 * @param params Request payload with all active graph filters.
 * @returns Loading, error, and graph data state for the panel.
 */
export const useGeneRegulationGraphQuery = (params: FetchGeneRegulationGraphParams) => {
    const [state, setState] = useState<GeneRegulationGraphQueryState>({
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

        fetchGeneRegulationGraph(params)
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
    }, [params])

    return state
}
