import React from 'react'
import { createRoot } from 'react-dom/client'
import { IntlProvider } from 'react-intl'
import './css/login.css'

import LoginSignUpForm from './components/login/LoginSignUpForm'
import en from './locales/en'
import es from './locales/es'

const messages = { en, es }

const container = document.getElementById('login-form')
const root = createRoot(container!)
root.render(
    <IntlProvider locale='es' messages={messages.es}>
        <LoginSignUpForm />
    </IntlProvider>
)
