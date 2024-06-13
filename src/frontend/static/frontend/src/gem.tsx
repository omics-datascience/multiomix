import React from 'react'
import { createRoot } from 'react-dom/client'
import './css/gem.css'

import { Pipeline } from './components/pipeline/Pipeline'

const container = document.getElementById('gem-app')
const root = createRoot(container!)
root.render(<Pipeline />)
