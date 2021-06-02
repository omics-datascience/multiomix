import React from 'react'
import { DropdownItemProps, Form } from 'semantic-ui-react'

/**
 * Component's props
 */
interface InstitutionsDropdownProps {
    value: number[],
    name: string,
    institutionsOptions: DropdownItemProps[],
    disabled?: boolean,
    handleChange: (string, any) => void,
}

/**
 * Renders a Dropdown with the institutions
 * @param props Component's props
 * @returns Component
 */
export const InstitutionsDropdown = (props: InstitutionsDropdownProps) => (
    <Form.Dropdown
        fluid
        width={8}
        options={props.institutionsOptions}
        search
        selection
        clearable
        multiple
        name={props.name}
        value={props.value}
        onChange={(_, { name, value }) => props.handleChange(name, value)}
        placeholder='Institutions (optional)'
        disabled={props.disabled}
    />
)
