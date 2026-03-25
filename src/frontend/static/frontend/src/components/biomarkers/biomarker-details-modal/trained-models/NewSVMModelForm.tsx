import React from 'react'
import { Form, InputOnChangeData } from 'semantic-ui-react'
import { SVMKernelOptions } from '../../utils'
import { SVMParameters } from '../../types'
import { InfoPopup } from '../../../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { InputLabel } from '../../../common/InputLabel'
import { useIntl } from 'react-intl'

interface NewSVMModelFormProps {
    /** Getter of the selected params to handle in the form. */
    parameters: SVMParameters,
    /** Setter of the selected params to handle in the form. */
    handleChangeParams: (event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => void
}

export const NewSVMModelForm = (props: NewSVMModelFormProps) => {
    const intl = useIntl()
    return (
        <>
            <Form.Select
                fluid
                selectOnBlur={false}
                label={(
                    <InputLabel label='Kernel'>
                        <InfoPopup
                            content={(
                                <>
                                    <p>{intl.formatMessage({ id: 'newSVMForm.info.kernel.linear' })}</p>
                                    <p>{intl.formatMessage({ id: 'newSVMForm.info.kernel.polynomial' })}</p>
                                    <p>{intl.formatMessage({ id: 'newSVMForm.info.kernel.rbf' })}</p>
                                </>
                            )}
                            onTop={false}
                            onEvent='hover'
                            noBorder
                            extraClassName='pull-right'
                        />
                    </InputLabel>
                )}
                options={SVMKernelOptions}
                placeholder={intl.formatMessage({ id: 'newSVMForm.placeholder.kernel' })}
                name='kernel'
                value={props.parameters.kernel}
                onChange={props.handleChangeParams}
            />

            <Form.Group widths='equal'>
                <Form.Input
                    fluid
                    label={(
                        <InputLabel label={intl.formatMessage({ id: 'newSVMForm.label.maxIterations' })}>
                            <InfoPopup
                                content={intl.formatMessage({ id: 'newSVMForm.info.maxIterations' })}
                                onTop={false}
                                onEvent='hover'
                                noBorder
                                extraClassName='pull-right'
                            />
                        </InputLabel>
                    )}
                    placeholder='100-2000'
                    name='maxIterations'
                    value={props.parameters.maxIterations ?? ''}
                    onChange={props.handleChangeParams}
                />

                <Form.Input
                    fluid
                    label={(
                        <InputLabel label={intl.formatMessage({ id: 'common.randomState' })}>
                            <InfoPopup
                                content={intl.formatMessage({ id: 'newSVMForm.info.randomState' })}
                                onTop={false}
                                onEvent='hover'
                                noBorder
                                extraClassName='pull-right'
                            />
                        </InputLabel>
                    )}
                    placeholder={intl.formatMessage({ id: 'common.integerNumber' })}
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
