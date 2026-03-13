import React from 'react'
import { createRoot } from 'react-dom/client'
import './css/differential-expression.css'
import { DiferentialExpressionPanel } from './components/differential-expression/DifferentialExpressionPanel'

const container = document.getElementById('differential-expression-app')
const root = createRoot(container!)
root.render(<DiferentialExpressionPanel />)
