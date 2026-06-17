import React from 'react'
import { createRoot } from 'react-dom/client'
import './css/institutions.css'

import { InstitutionsPanel } from './components/institutions/InstitutionsPanel'
import { IntlProvider } from 'react-intl'
import en from './locales/en'
import es from './locales/es'

const messages = { en, es }

const container = document.getElementById('institutions-app')
const root = createRoot(container!)
root.render(
    <IntlProvider locale='es' messages={messages.es}>
        <InstitutionsPanel />
    </IntlProvider>
)
