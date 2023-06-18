import React from 'react'

/** InputLabel props. */
type InputLabelProps = { label: string }

/**
 * Some inputs have problems with their labels in some contexts (for example they're shown
 * in normal text instead of bolder). This components solves this issue as It has the same
 * style in all contexts.
 * @param props Component props.
 * @returns Component.
 */
export const InputLabel = (props: InputLabelProps) => (
    <label>
        <strong>{props.label}</strong>
    </label>
)
