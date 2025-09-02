import React from 'react'
import { Form } from 'semantic-ui-react'
import { InputLabel } from '../common/InputLabel'

interface DifferentialExpressionInputClinicalAttributeProps {
    optionsClinicalAttributes: string[],
    clinicalAttribute: string,
    onChange: (value: string) => void,
}

export const DifferentialExpressionInputClinicalAttribute = (props: DifferentialExpressionInputClinicalAttributeProps) => {
    return (
        <>
            <InputLabel label='Group by clinical attribute' />

            <Form.Select
                fluid
                options={props.optionsClinicalAttributes.map((attr) => ({ key: attr, text: attr, value: attr }))}
                loading={false}
                className='margin-bottom-2'
                search
                selectOnBlur={false}
                clearable
                value={props.clinicalAttribute}
                onChange={(_, { value }) => { props.onChange(value as string) }}
                placeholder='Clinical attribute to group by'
                disabled={false}
            />
        </>
    )
}
