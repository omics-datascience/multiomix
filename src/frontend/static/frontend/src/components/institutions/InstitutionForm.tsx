import ky from 'ky'
import React, { useEffect, useState } from 'react'
import { Form, Button } from 'semantic-ui-react'
import { getDjangoHeader } from '../../utils/util_functions'
import { CustomAlertTypes, Nullable } from '../../utils/interfaces'
import { DjangoInstitution } from '../../utils/django_interfaces'
import { useIntl } from 'react-intl'

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
    const intl = useIntl()
    const [formData, setFormData] = useState(defaultForm)

    /**
     * Handle form state data.
     * @param _ event.
     * @param data Data with the name and current value of the input element to update the form state.
     */
    const handleChange = (_, data: any) => {
        const { name, value } = data
        setFormData(prevState => ({
            ...prevState, [name]: value
        }))
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
                response.json<DjangoInstitution>().then((jsonResponse) => {
                    props.handleUpdateAlert(true, CustomAlertTypes.SUCCESS, intl.formatMessage({ id: 'institutionForm.updated' }, { name: jsonResponse.name }), () => setFormData(defaultForm), true)
                }).catch((err) => {
                    setFormData(prevState => ({ ...prevState, isLoading: false }))
                    props.handleUpdateAlert(true, CustomAlertTypes.ERROR, intl.formatMessage({ id: 'institutionForm.error' }), () => setFormData(prevState => ({ ...prevState, isLoading: false })))
                    console.error('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                props.handleUpdateAlert(true, CustomAlertTypes.ERROR, intl.formatMessage({ id: 'institutionForm.error' }), () => setFormData(prevState => ({ ...prevState, isLoading: false })))
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
                response.json<DjangoInstitution>().then((jsonResponse) => {
                    props.handleUpdateAlert(true, CustomAlertTypes.SUCCESS, intl.formatMessage({ id: 'institutionForm.created' }, { name: jsonResponse.name }), () => setFormData(defaultForm))
                }).catch((err) => {
                    props.handleUpdateAlert(true, CustomAlertTypes.ERROR, intl.formatMessage({ id: 'institutionForm.error' }), () => setFormData(prevState => ({ ...prevState, isLoading: false })))
                    setFormData(prevState => ({ ...prevState, isLoading: false }))
                    console.error('Error parsing JSON ->', err)
                })
            }).catch((err) => {
                props.handleUpdateAlert(true, CustomAlertTypes.ERROR, intl.formatMessage({ id: 'institutionForm.error' }), () => setFormData(prevState => ({ ...prevState, isLoading: false })))
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
                    placeholder={intl.formatMessage({ id: 'institutionForm.namePlaceholder' })}
                />
                <Form.Input
                    name='location'
                    value={formData.location}
                    onChange={handleChange}
                    placeholder={intl.formatMessage({ id: 'institutionForm.locationPlaceholder' })}
                />
                <Form.Input
                    name='email'
                    type='email'
                    value={formData.email}
                    onChange={handleChange}
                    placeholder={intl.formatMessage({ id: 'institutionForm.emailPlaceholder' })}
                />
                <Form.Input
                    name='telephone_number'
                    type='tel'
                    value={formData.telephone_number}
                    onChange={handleChange}
                    placeholder={intl.formatMessage({ id: 'institutionForm.phonePlaceholder' })}
                />
                <Button
                    type='submit'
                    fluid
                    primary
                    disabled={(!formData.email.trim() && !formData.location.trim() && !formData.name.trim() && !formData.telephone_number.trim()) || formData.isLoading}
                    color='green'
                    loading={formData.isLoading}
                >
                    {props.institutionToEdit ? intl.formatMessage({ id: 'institutionForm.editInstitution' }) : intl.formatMessage({ id: 'institutionForm.createInstitution' })}
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
                {props.institutionToEdit ? intl.formatMessage({ id: 'institutionForm.cancelEdit' }) : intl.formatMessage({ id: 'institutionForm.resetForm' })}
            </Button>
        </>
    )
}

export default InstitutionForm
