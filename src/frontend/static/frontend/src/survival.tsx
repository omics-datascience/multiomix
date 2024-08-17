import React from 'react'
import { createRoot } from 'react-dom/client'
import './css/survival.css'
import { SurvivalAnalysisPanel } from './components/survival/SurvivalAnalysisPanel'

const container = document.getElementById('survival-app')
const root = createRoot(container!)
root.render(<SurvivalAnalysisPanel />)
