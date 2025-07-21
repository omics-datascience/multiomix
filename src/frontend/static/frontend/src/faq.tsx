import React from 'react'
import { createRoot } from 'react-dom/client'
import { FAQ } from './components/faq/FAQ'

const container = document.getElementById('faq-app')
const root = createRoot(container!)
// eslint-disable-next-line @stylistic/jsx-pascal-case
root.render(<FAQ />)
