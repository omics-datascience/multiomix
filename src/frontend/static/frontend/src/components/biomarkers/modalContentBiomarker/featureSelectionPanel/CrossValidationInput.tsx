import React from 'react'
import { Form } from 'semantic-ui-react'

/** CrossValidationInput props. */
interface CrossValidationInputProps {
    /** Current value of the form. */
    value: number,
    /** Handles changes in the input. */
    handleChange: (name: string, value: number) => void,
}

/**
 * Renders a CV input.
 * @param props Component props.
 * @returns Component.
 */
export const CrossValidationInput = (props: CrossValidationInputProps) => (
    <Form.Input
        fluid
        style={{ minWidth: '180px', maxWidth: '100% ' }}
        label='Number of folds'
        placeholder='An integer number'
        type='number'
        step={1}
        min={3}
        max={10}
        name='folds'
        value={props.value ?? ''}
        onChange={(_, { name, value }) => { props.handleChange(name, value as any) }}
    />
)
