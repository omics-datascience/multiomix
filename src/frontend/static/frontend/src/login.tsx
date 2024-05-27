import React from 'react'
import ReactDOM from 'react-dom'
import './css/login.css'

import { LoginSignUpForm } from './components/login/LoginSignUpForm'

ReactDOM.render(
    <LoginSignUpForm />,
    document.getElementById('login-form')
)
