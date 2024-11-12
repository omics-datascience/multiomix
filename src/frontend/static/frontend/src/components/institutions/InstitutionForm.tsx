import React, { useState } from 'react'
import { Form, Button } from 'semantic-ui-react'

const defaultForm = {
    name: '',
    location: '',
    email: '',
    phone: '',
    isLoading: false
}

const InstitutionForm = () => {
    const [formData, setFormData] = useState(defaultForm)

    const handleChange = (e, { name, value }) => {
        setFormData({ ...formData, [name]: value })
    }

    const handleSubmit = () => {
        console.log('Form Data Submitted:', formData)
    }

    return (
        <Form onSubmit={handleSubmit}>
            <Form.Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Institution name"
            />
            <Form.Input
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="Institution location"
            />
            <Form.Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Institution email"
            />
            <Form.Input
                name="phone"
                type="tel"
                value={formData.phone}
                onChange={handleChange}
                placeholder="Institution phone number"
            />
            <Button
                type="submit"
                fluid
                primary
                disabled={(!formData.email.trim() && !formData.location.trim() && !formData.name.trim() && !formData.phone.trim()) || formData.isLoading}
                color='green'
                loading={formData.isLoading}
            >
                Create institution
            </Button>
            <Button
                className='margin-top-5'
                fluid
                primary
                disabled={formData.isLoading}
                color='red'
                onClick={() => setFormData(defaultForm)}
            >
                Reset form
            </Button>
        </Form>
    )
}

export default InstitutionForm
