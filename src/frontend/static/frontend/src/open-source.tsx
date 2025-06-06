import React from 'react'
import { createRoot } from 'react-dom/client'
import { OpenSource } from './components/open-source/OpenSource'

const container = document.getElementById('open-source-app')
const root = createRoot(container!)
root.render(<OpenSource />)
