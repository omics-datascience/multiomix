import React from 'react'
import { createRoot } from 'react-dom/client'

import './css/biomarkers-form.css'
import './css/biomarkers.css'

import { BiomarkersPanel } from './components/biomarkers/BiomarkersPanel'
import { IntlProvider } from 'react-intl'
import en from './locales/en'
import es from './locales/es'

const messages = { en, es }

const container = document.getElementById('biomarkers-app')
const root = createRoot(container!)
root.render(
    <IntlProvider locale='en' messages={messages['en']}>
        <BiomarkersPanel />
    </IntlProvider>
)
