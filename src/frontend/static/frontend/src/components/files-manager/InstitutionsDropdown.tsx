import React from 'react'
import { DropdownItemProps, Form, SemanticWIDTHS } from 'semantic-ui-react'
import { useIntl } from 'react-intl'

/**
 * Component's props
 */
interface InstitutionsDropdownProps {
    value: number[],
    name: string,
    institutionsOptions: DropdownItemProps[],
    width?: SemanticWIDTHS,
    disabled?: boolean,
    showLabel?: boolean,
    handleChange: (name: string, value: any) => void,
}

/**
 * Renders a Dropdown with the institutions
 * @param props Component's props
 * @returns Component
 */
export const InstitutionsDropdown = (props: InstitutionsDropdownProps) => {
    const intl = useIntl()

    return (
        <Form.Dropdown
            fluid
            width={props.width !== undefined ? props.width : 16}
            options={props.institutionsOptions}
            search
            selection
            clearable
            multiple
            label={props.showLabel ? intl.formatMessage({ id: 'institutionsDropdown.label' }) : undefined}
            name={props.name}
            value={props.value}
            onChange={(_, { name, value }) => props.handleChange(name, value)}
            placeholder={intl.formatMessage({ id: 'institutionsDropdown.placeholder' })}
            disabled={props.disabled}
        />
    )
}
