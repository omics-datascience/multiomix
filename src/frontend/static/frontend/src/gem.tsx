import React from 'react'
import { createRoot } from 'react-dom/client'
import './css/biomarkers-form.css'
import './css/gem.css'

import { Pipeline } from './components/pipeline/Pipeline'
import { IntlProvider } from 'react-intl'
import en from './locales/en'
import es from './locales/es'

const messages = { en, es }

const container = document.getElementById('gem-app')
const root = createRoot(container!)
root.render(
    <IntlProvider locale='en' messages={messages['en']}>
        <Pipeline />
    </IntlProvider>
)
