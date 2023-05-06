import React from 'react'
import { Form, InputOnChangeData } from 'semantic-ui-react'
import { maxIterationName, randomStateName, svmKernelName } from './common-form-keys'
import { SVMKernelOptions } from '../../utils'

interface NewSVMModelFormProps {
    /** Getter of the selected params to handle in the form. */
    selectedParams: {[key: string]: any}
    /** Setter of the selected params to handle in the form. */
    handleChangeParams: (event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => void
}

export const NewSVMModelForm = (props: NewSVMModelFormProps) => {
    // TODO: add an InfoPopup for all the inputs
    return (
        <>
            <Form.Select
                fluid
                label='Kernel'
                options={SVMKernelOptions}
                placeholder='Select a kernel'
                name={svmKernelName}
                value={props.selectedParams[svmKernelName]}
                onChange={props.handleChangeParams}
            />

            <Form.Group widths='equal'>
                <Form.Input
                    fluid
                    label='Max iterations'
                    placeholder='100-2000'
                    name={maxIterationName}
                    value={props.selectedParams[maxIterationName]}
                    onChange={props.handleChangeParams}
                />

                <Form.Input
                    fluid
                    label='Random state'
                    placeholder='An integer number'
                    type='number'
                    step={1}
                    min={0}
                    name={randomStateName}
                    value={props.selectedParams[randomStateName]}
                    onChange={props.handleChangeParams}
                />
            </Form.Group>
        </>
    )
}
