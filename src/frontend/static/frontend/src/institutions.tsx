import React from 'react'
import { createRoot } from 'react-dom/client'
import './css/institutions.css'

import { InstitutionsPanel } from './components/institutions/InstitutionsPanel'

const container = document.getElementById('institutions-app')
const root = createRoot(container!)
root.render(<InstitutionsPanel />)
