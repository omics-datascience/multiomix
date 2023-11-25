import React from 'react'
import ReactDOM from 'react-dom'
import './css/biomarkers.css'

import { BiomarkersPanel } from './components/biomarkers/BiomarkersPanel'

ReactDOM.render(
    <BiomarkersPanel />,
    document.getElementById('biomarkers-app')
)
