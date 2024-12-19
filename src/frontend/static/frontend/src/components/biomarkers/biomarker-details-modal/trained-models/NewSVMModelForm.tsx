import React from 'react'
import { Form, InputOnChangeData } from 'semantic-ui-react'
import { SVMKernelOptions } from '../../utils'
import { SVMParameters } from '../../types'
import { InfoPopup } from '../../../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { InputLabel } from '../../../common/InputLabel'

interface NewSVMModelFormProps {
    /** Getter of the selected params to handle in the form. */
    parameters: SVMParameters,
    /** Setter of the selected params to handle in the form. */
    handleChangeParams: (event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => void
}

const SVMKernel = SVMKernelOptions.map(({ description, ...rest }) => rest)

export const NewSVMModelForm = (props: NewSVMModelFormProps) => {
    const selectedKernel = SVMKernelOptions.find(option => option.value === props.parameters.kernel)
    const kernelDescription = selectedKernel ? selectedKernel.description : 'No description available'
    return (
        <>
            <Form.Select
                fluid
                selectOnBlur={false}
                label={
                    <InputLabel label='Kernel'>
                        <InfoPopup
                            content={kernelDescription}
                            onTop={false}
                            onEvent='hover'
                            noBorder
                            extraClassName='pull-right'
                        />
                    </InputLabel>
                }
                options={SVMKernel}
                placeholder='Select a kernel'
                name='kernel'
                value={props.parameters.kernel}
                onChange={props.handleChangeParams}
            />

            <Form.Group widths='equal'>
                <Form.Input
                    fluid
                    label={
                        <InputLabel label='Max iterations'>
                            <InfoPopup
                                content='The maximum number of iterations to be run'
                                onTop={false}
                                onEvent='hover'
                                noBorder
                                extraClassName='pull-right'
                            />
                        </InputLabel>
                    }
                    placeholder='100-2000'
                    name='maxIterations'
                    value={props.parameters.maxIterations ?? ''}
                    onChange={props.handleChangeParams}
                />

                <Form.Input
                    fluid
                    label={
                        <InputLabel label='Random state'>
                            <InfoPopup
                                content='Seed used by the random number generator'
                                onTop={false}
                                onEvent='hover'
                                noBorder
                                extraClassName='pull-right'
                            />
                        </InputLabel>
                    }
                    placeholder='An integer number'
                    type='number'
                    step={1}
                    min={0}
                    name='randomState'
                    value={props.parameters.randomState ?? ''}
                    onChange={props.handleChangeParams}
                />
            </Form.Group>
        </>
    )
}
