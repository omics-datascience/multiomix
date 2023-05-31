import React from 'react'
import { Form, InputOnChangeData } from 'semantic-ui-react'
import { SVMKernelOptions } from '../../utils'
import { SVMParameters } from '../../types'

interface NewSVMModelFormProps {
    /** Getter of the selected params to handle in the form. */
    parameters: SVMParameters,
    /** Setter of the selected params to handle in the form. */
    handleChangeParams: (event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => void
}

export const NewSVMModelForm = (props: NewSVMModelFormProps) => {
    // TODO: add an InfoPopup for all the inputs
    return (
        <>
            <Form.Select
                fluid
                selectOnBlur={false}
                label='Kernel'
                options={SVMKernelOptions}
                placeholder='Select a kernel'
                name='kernel'
                value={props.parameters.kernel}
                onChange={props.handleChangeParams}
            />

            <Form.Group widths='equal'>
                <Form.Input
                    fluid
                    label='Max iterations'
                    placeholder='100-2000'
                    name='maxIterations'
                    value={props.parameters.maxIterations}
                    onChange={props.handleChangeParams}
                />

                <Form.Input
                    fluid
                    label='Random state'
                    placeholder='An integer number'
                    type='number'
                    step={1}
                    min={0}
                    name='randomState'
                    value={props.parameters.randomState}
                    onChange={props.handleChangeParams}
                />
            </Form.Group>
        </>
    )
}
