import { useState, useEffect, useRef } from 'react'

/** Structure of the callback passed by the user */
type Callback<T> = (stateUpdated: T) => void

/** Set callback function returned by the Hook */
type SetCallback<T> = (newState: T, newCallback?: Callback<T>) => void

/** Type returned by the Hook */
type StateWithCallbackReturn<T> = [
    T,
    SetCallback<T>
]

/**
 * Allows setState hook to accept a callback after rendering
 * @param initState Initial value of state
 * @returns An array with the state and a function to set that state with callback capabilities
 */
function useStateWithCallback<T = any> (initState: T): StateWithCallbackReturn<T> {
    // Uses any as it doesn't work with some checking below
    const callbackRef: any = useRef(null)

    const [state, setState] = useState<T>(initState)

    useEffect(() => {
        if (callbackRef.current) {
            callbackRef.current(state)
            callbackRef.current = null
        }
    }, [state])

    const setCallbackState: SetCallback<T> = (newState: T, newCallback: Callback<T>) => {
        callbackRef.current = typeof newCallback === 'function' ? newCallback : null
        setState(newState)
    }

    return [state, setCallbackState]
}

export { useStateWithCallback }
