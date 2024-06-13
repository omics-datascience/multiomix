import React from 'react'
import { createRoot } from 'react-dom/client'
import './css/login.css'

import { LoginSignUpForm } from './components/login/LoginSignUpForm'

const container = document.getElementById('login-form')
const root = createRoot(container!)
root.render(<LoginSignUpForm />)
