import React from 'react'
import { createRoot } from 'react-dom/client'

import './css/biomarkers.css'

import { BiomarkersPanel } from './components/biomarkers/BiomarkersPanel'

const container = document.getElementById('biomarkers-app')
const root = createRoot(container!)
root.render(<BiomarkersPanel />)
