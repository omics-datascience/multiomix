import React from 'react'
import { Form } from 'semantic-ui-react'
import { Nullable } from '../../../../utils/interfaces'

type ParameterKey = 'svmParameters' | 'clusteringParameters' | 'rfParameters'

/** RandomStateInput props. */
interface RandomStateInputProps {
    /** Current value of the form. */
    value: Nullable<number>,
    /** Field in the form in which the value must change. */
    parameterKey: ParameterKey
    /** Handles changes in the input. */
    handleChange: (key: ParameterKey, name: string, value: Nullable<number>) => void,
}

/**
 * Renders a random state input.
 * @param props Component props.
 * @returns Component.
 */
export const RandomStateInput = (props: RandomStateInputProps) => (
    <Form.Input
        fluid
        label='Random state'
        placeholder='An integer number'
        type='number'
        step={1}
        min={0}
        name='randomState'
        value={props.value ?? ''}
        onChange={(_, { name, value }) => {
            const numVal = value !== '' ? Number(value) : null
            if (numVal !== null && numVal < 0) {
                props.handleChange(props.parameterKey, name, 0)
            } else {
                props.handleChange(props.parameterKey, name, numVal)
            }
        }}
    />
)
