import React from 'react'
import { Form, InputOnChangeData } from 'semantic-ui-react'
import { RFParameters } from '../../types'
import { InfoPopup } from '../../../pipeline/experiment-result/gene-gem-details/InfoPopup'
import { InputLabel } from '../../../common/InputLabel'

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

            <Form.Checkbox
                checked={lookForOptimalNEstimators}
                onChange={(_e, { checked }) => { props.handleChangeOptimalNEstimators(checked ?? false) }}
                label={
                    <InputLabel label='Search for the optimal number of trees'>
                        <InfoPopup
                            content='This option is useful when the number of samples in the clinical data is small or there are few observed events, setting this value increases the robustness of the model in such cases avoiding problems with NaN values'
                            onTop={false}
                            onEvent='hover'
                            noBorder
                            extraClassName='pull-right'
                        />
                    </InputLabel>
                }
            />

            <Form.Group widths='equal'>
                {!lookForOptimalNEstimators &&
                    <Form.Input
                        fluid
                        label={
                            <InputLabel label='Number of trees'>
                                <InfoPopup
                                    content='The number of trees in the forest'
                                    onTop={false}
                                    onEvent='hover'
                                    noBorder
                                    extraClassName='pull-right'
                                />
                            </InputLabel>
                        }
                        type='number'
                        min={10}
                        max={20}
                        placeholder='10-20'
                        name='nEstimators'
                        value={props.parameters.nEstimators}
                        onChange={props.handleChangeParams}
                    />}

                <Form.Input
                    fluid
                    label={
                        <InputLabel label='Max depth'>
                            <InfoPopup
                                content='The maximum depth of the tree'
                                onTop={false}
                                onEvent='hover'
                                noBorder
                                extraClassName='pull-right'
                            />
                        </InputLabel>
                    }
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
        </>
    )
}
