import React from 'react'
import { createRoot } from 'react-dom/client'

import './css/files.css'

import { CGDSPanel } from './components/cgds-panel/CGDSPanel'
import { IntlProvider } from 'react-intl'
import en from './locales/en'
import es from './locales/es'

const messages = { en, es }

const container = document.getElementById('cgds-app')
const root = createRoot(container!)

root.render(
    <IntlProvider locale='es' messages={messages.es}>
        <CGDSPanel />
    </IntlProvider>
)
