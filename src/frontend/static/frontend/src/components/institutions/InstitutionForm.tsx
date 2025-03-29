import ky from 'ky'
import React, { useEffect, useState } from 'react'
import { Form, Button } from 'semantic-ui-react'
import { getDjangoHeader } from '../../utils/util_functions'
import { CustomAlertTypes, Nullable } from '../../utils/interfaces'
import { DjangoInstitution } from '../../utils/django_interfaces'

const defaultForm: {
    id: undefined | number;
    name: string;
    location: string;
    email: string;
    telephone_number: string;
    isLoading: boolean;
} = {
    id: undefined,
    name: '',
    location: '',
    email: '',
    telephone_number: '',
    isLoading: false
}

declare const urlCreateInstitution: string
declare const urlEditInstitution: string

interface Props {
    institutionToEdit: Nullable<DjangoInstitution>,
    handleResetInstitutionToEdit: (callbackToCancel: () => void) => void,
    handleUpdateAlert(isOpen: boolean, type: CustomAlertTypes, message: string, callback: Nullable<() => void>, isEdit?: boolean): void,
}

const InstitutionForm = (props: Props) => {
    const [formData, setFormData] = useState(defaultForm)

    /**
     * Handle form state data
     * @param e event
     * @param param.name key name to edit field in form
     * @param param.value key value to edit field in form
     */

    const handleChange = (e, { name, value }) => {
        setFormData({ ...formData, [name]: value })
    }

    /**
     * Handle user form to edit or create
     */
    const handleSubmit = () => {
        const myHeaders = getDjangoHeader()

        if (props.institutionToEdit?.id) {
            const jsonParams = {
                id: formData.id,
                name: formData.name,
                location: formData.location,
                email: formData.email,
                telephone_number: formData.telephone_number
            }
            const editUrl = `${urlEditInstitution}/${formData.id}/`

            ky.patch(editUrl, { headers: myHeaders, json: jsonParams }).then((response) => {
                setFormData(prevState => ({ ...prevState, isLoading: true }))
                response.json().then((jsonResponse: DjangoInstitution) => {
                    props.handleUpdateAlert(true, CustomAlertTypes.SUCCESS, `Institution ${jsonResponse.name} Updated!`, () => setFormData(defaultForm), true)
                }).catch((err) => {
                    setFormData(prevState => ({ ...prevState, isLoading: false }))
                    props.handleUpdateAlert(true, CustomAlertTypes.ERROR, 'Error creating an institution!', () => setFormData(prevState => ({ ...prevState, isLoading: false })))
                    console.error('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                props.handleUpdateAlert(true, CustomAlertTypes.ERROR, 'Error creating an institution!', () => setFormData(prevState => ({ ...prevState, isLoading: false })))
                console.error('Error adding new Institution ->', err)
            })
        } else {
            const jsonParams = {
                name: formData.name,
                location: formData.location,
                email: formData.email,
                telephone_number: formData.telephone_number
            }
            ky.post(urlCreateInstitution, { headers: myHeaders, json: jsonParams }).then((response) => {
                setFormData(prevState => ({ ...prevState, isLoading: true }))
                response.json().then((jsonResponse: DjangoInstitution) => {
                    props.handleUpdateAlert(true, CustomAlertTypes.SUCCESS, `Institution ${jsonResponse.name} created!`, () => setFormData(defaultForm))
                }).catch((err) => {
                    props.handleUpdateAlert(true, CustomAlertTypes.ERROR, 'Error creating an institution!', () => setFormData(prevState => ({ ...prevState, isLoading: false })))
                    setFormData(prevState => ({ ...prevState, isLoading: false }))
                    console.error('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                props.handleUpdateAlert(true, CustomAlertTypes.ERROR, 'Error creating an institution!', () => setFormData(prevState => ({ ...prevState, isLoading: false })))
                console.error('Error adding new Institution ->', err)
            })
        }
    }

    /**
     * Handle if user Reset or cancel edit
     */
    const handleCancelForm = () => {
        if (props.institutionToEdit) {
            props.handleResetInstitutionToEdit(() => setFormData(defaultForm))
        } else {
            setFormData(defaultForm)
        }
    }

    /**
     * use effect to handle if a institution for edit is sent
     */
    useEffect(() => {
        if (props.institutionToEdit) {
            setFormData({
                ...props.institutionToEdit,
                id: props.institutionToEdit?.id,
                isLoading: false
            })
        }
    }, [props.institutionToEdit])
    return (
        <>
            <Form onSubmit={handleSubmit}>
                <Form.Input
                    name='name'
                    value={formData.name}
                    onChange={handleChange}
                    placeholder='Institution name'
                />
                <Form.Input
                    name='location'
                    value={formData.location}
                    onChange={handleChange}
                    placeholder='Institution location'
                />
                <Form.Input
                    name='email'
                    type='email'
                    value={formData.email}
                    onChange={handleChange}
                    placeholder='Institution email'
                />
                <Form.Input
                    name='telephone_number'
                    type='tel'
                    value={formData.telephone_number}
                    onChange={handleChange}
                    placeholder='Institution phone number'
                />
                <Button
                    type='submit'
                    fluid
                    primary
                    disabled={(!formData.email.trim() && !formData.location.trim() && !formData.name.trim() && !formData.telephone_number.trim()) || formData.isLoading}
                    color='green'
                    loading={formData.isLoading}
                >
                    {props.institutionToEdit ? 'Edit institution' : 'Create institution'}
                </Button>
            </Form>
            <Button
                className='margin-top-5'
                fluid
                primary
                disabled={formData.isLoading}
                color='red'
                onClick={handleCancelForm}
            >
                {props.institutionToEdit ? 'Cancel edit' : 'Reset form'}
            </Button>
        </>
    )
}

export default InstitutionForm
