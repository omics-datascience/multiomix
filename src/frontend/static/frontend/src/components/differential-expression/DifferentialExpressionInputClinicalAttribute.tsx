import React from 'react'
import { Form } from 'semantic-ui-react'
import { InputLabel } from '../common/InputLabel'
import { useIntl } from 'react-intl'

interface DifferentialExpressionInputClinicalAttributeProps {
    /* List of clinical attributes available for selection */
    optionsClinicalAttributes: string[],
    /* Currently selected clinical attribute */
    clinicalAttribute: string,
    /* Callback when clinical attribute selection changes */
    onChange: (value: string) => void,
    /* Whether the input is in editing mode */
    isEditing: boolean,
}

/**
 * Renders a Select to select a clinical attribute.
 * @param props Component props.
 * @returns Component.
 */
export const DifferentialExpressionInputClinicalAttribute = (props: DifferentialExpressionInputClinicalAttributeProps) => {
    const intl = useIntl()

    return (
        <>
            <InputLabel label={intl.formatMessage({ id: 'differentialExpressionInputClinicalAttribute.label' })} />

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
                placeholder={intl.formatMessage({ id: 'differentialExpressionInputClinicalAttribute.placeholder' })}
                disabled={props.isEditing}
            />
        </>
    )
}
