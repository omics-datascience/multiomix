import React from 'react'
import { Form, InputOnChangeData } from 'semantic-ui-react'
import { RFParameters } from '../../types'

interface NewSVMModelFormProps {
    /** Getter of the selected params to handle in the form. */
    parameters: RFParameters,
    /** Setter of the selected params to handle in the form. */
    handleChangeParams: (event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => void,
    /** Setter of the lookForOptimalNEstimators value. */
    handleChangeOptimalNEstimators: (checked: boolean) => void
}

export const NewRFModelForm = (props: NewSVMModelFormProps) => {
    // TODO: add an InfoPopup for all the inputs
    const lookForOptimalNEstimators = props.parameters.lookForOptimalNEstimators
    return (
        <>
            {/* TODO: add InfoPopup */}
            <Form.Checkbox
                checked={lookForOptimalNEstimators}
                onChange={(_e, { checked }) => { props.handleChangeOptimalNEstimators(checked ?? false) }}
                label='Search for the optimal number of trees'
            />

            <Form.Group widths='equal'>
                {!lookForOptimalNEstimators &&
                    <Form.Input
                        fluid
                        label='Number of trees'
                        type='number'
                        min={10}
                        max={20}
                        placeholder='10-20'
                        name='nEstimators'
                        value={props.parameters.nEstimators}
                        onChange={props.handleChangeParams}
                    />
                }

                <Form.Input
                    fluid
                    label='Max depth'
                    placeholder='An integer number'
                    type='number'
                    min={3}
                    name='maxDepth'
                    value={props.parameters.maxDepth ?? ''}
                    onChange={props.handleChangeParams}
                />
            </Form.Group>

            <Form.Input
                fluid
                label='Random state'
                placeholder='An integer number'
                type='number'
                step={1}
                min={0}
                name='randomState'
                value={props.parameters.randomState ?? ''}
                onChange={props.handleChangeParams}
            />
        </>
    )
}
