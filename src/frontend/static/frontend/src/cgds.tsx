import React from 'react'
import { createRoot } from 'react-dom/client'

import './css/files.css'

import { CGDSPanel } from './components/cgds-panel/CGDSPanel'
const container = document.getElementById('about-us-app')
const root = createRoot(container!)
root.render(<CGDSPanel />)
