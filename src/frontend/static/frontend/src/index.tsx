import React from 'react'
import { createRoot } from 'react-dom/client'
import './css/index.css'

import { Homepage } from './components/index/Homepage'

const container = document.getElementById('main-app')
const root = createRoot(container!)
root.render(<Homepage />)
