import React from 'react'
import { Form, InputOnChangeData } from 'semantic-ui-react'
import { RFParameters } from '../../types'
import { InfoPopup } from '../../../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { InputLabel } from '../../../common/InputLabel'
import { useIntl } from 'react-intl'

interface NewSVMModelFormProps {
    /** Getter of the selected params to handle in the form. */
    parameters: RFParameters,
    /** Setter of the selected params to handle in the form. */
    handleChangeParams: (event: React.ChangeEvent<HTMLInputElement>, data: InputOnChangeData) => void,
    /** Setter of the lookForOptimalNEstimators value. */
    handleChangeOptimalNEstimators: (checked: boolean) => void
}

export const NewRFModelForm = (props: NewSVMModelFormProps) => {
    const intl = useIntl()
    // TODO: add an InfoPopup for all the inputs
    const lookForOptimalNEstimators = props.parameters.lookForOptimalNEstimators
    return (
        <>

            <Form.Checkbox
                checked={lookForOptimalNEstimators}
                onChange={(_e, { checked }) => { props.handleChangeOptimalNEstimators(checked ?? false) }}
                label={(
                    <InputLabel label={intl.formatMessage({ id: 'newRFForm.label.searchOptimalTrees' })}>
                        <InfoPopup
                            content={intl.formatMessage({ id: 'newRFForm.info.searchOptimalTrees' })}
                            onTop={false}
                            onEvent='hover'
                            noBorder
                            extraClassName='pull-right'
                        />
                    </InputLabel>
                )}
            />

            <Form.Group widths='equal'>
                {!lookForOptimalNEstimators && (
                    <Form.Input
                        fluid
                        label={(
                            <InputLabel label={intl.formatMessage({ id: 'newRFForm.label.nEstimators' })}>
                                <InfoPopup
                                    content={intl.formatMessage({ id: 'newRFForm.info.nEstimators' })}
                                    onTop={false}
                                    onEvent='hover'
                                    noBorder
                                    extraClassName='pull-right'
                                />
                            </InputLabel>
                        )}
                        type='number'
                        min={10}
                        max={20}
                        placeholder='10-20'
                        name='nEstimators'
                        value={props.parameters.nEstimators}
                        onChange={props.handleChangeParams}
                    />
                )}

                <Form.Input
                    fluid
                    label={(
                        <InputLabel label={intl.formatMessage({ id: 'newRFForm.label.maxDepth' })}>
                            <InfoPopup
                                content={intl.formatMessage({ id: 'newRFForm.info.maxDepth' })}
                                onTop={false}
                                onEvent='hover'
                                noBorder
                                extraClassName='pull-right'
                            />
                        </InputLabel>
                    )}
                    placeholder={intl.formatMessage({ id: 'common.integerNumber' })}
                    type='number'
                    min={3}
                    name='maxDepth'
                    value={props.parameters.maxDepth ?? ''}
                    onChange={props.handleChangeParams}
                />
            </Form.Group>

            <Form.Input
                fluid
                label={(
                    <InputLabel label={intl.formatMessage({ id: 'common.randomState' })}>
                        <InfoPopup
                            content={intl.formatMessage({ id: 'newRFForm.info.randomState' })}
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
        </>
    )
}
